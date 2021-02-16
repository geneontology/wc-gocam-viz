// This is a first attempt at simplifying the data access from bbop graph to gocam graph
// This should be a separate library to ease the reuse throughout both GO and external applications


export class GraphHandler {

    dbxrefs;
    goApiUrl = "https://api.geneontology.org/api/search/entity/autocomplete/";
    
    relations_enabled_by = ['http://purl.obolibrary.org/obo/RO_0002333', 'RO_0002333', 'RO:0002333'];
    relations_collapsible = ["RO:0002333", "BFO:0000066", "RO:0002233", "RO:0002488", "RO:0002234"]; // 2233 : has input ; 2234 : has output
    relations_nestable = { };
    relations_strippable = {
        "BFO:0000050": true,    // part of
        "BFO:0000051": true,    // has part
        "RO:0002220": true,     // adjacent to
        "BFO:0000066": true,    // occurs in
        "RO:0012005" : true     // is small molecule activator
    };

    bbopGraph = undefined;
    bbopGraphBackup = undefined;        // this is used to restore the graph if needed

    categories = undefined;

    constructor(graph) {
        this.setBBOPGraph(graph);
    }

    setBBOPGraph(graph) {
        this.bbopGraph = graph;
        this.bbopGraphBackup = graph.clone();
        this.preprocess(graph);
    }

    preprocess(graph, graphFold = "editor", nest = "no") {

        // Prepare graph
        graph.unfold();
        if(graphFold == "evidence") {
            graph.fold_evidence();
        } else if(graphFold == "editor") {
            graph.fold_go_noctua(this.relations_collapsible)
        }


        // Get a list of all the singletons we start with.
        var all_starting_singletons_by_id = {};
        var sings = graph.get_singleton_nodes();
        for(let sing of sings) {
            all_starting_singletons_by_id[sing.id()] = true;
        }


        // Remove all of the undesireable rels.
        var parent_trap = {};
        var note_sink = {}; // keep the reverse lookup info of parent_trap
        if( nest && nest === 'yes' ){
            // console.log('adding nestable rels');
            this.relations_nestable["BFO:0000050"] = true; // part of
        }

        for(let e of graph.all_edges()) {
            if(this.relations_nestable.hasOwnProperty(e.predicate_id())) {
                if(!parent_trap.hasOwnProperty(e.subject_id())) {
                    parent_trap[e.subject_id()] = [];
                }
                parent_trap[e.subject_id()].push(e.object_id());
                // Note the object for later checking.
                note_sink[e.object_id()] = true;
            }
            if(this.relations_strippable.hasOwnProperty(e.predicate_id())) {
                graph.remove_edge(e.subject_id(),
                        e.object_id(),
                        e.predicate_id());
            }
        }


        // If it wasn't a singleton before we started, but is one now,
        // remove it. In "nest" mode, only remove ones that are not
        // going to be nested.
        var eings = graph.get_singleton_nodes();
        for(let eing of eings) {
            if(!all_starting_singletons_by_id.hasOwnProperty(eing.id())) {
                if( nest && nest === 'yes' && note_sink[eing.id()] ){
                    // pass
                }else{
                    graph.remove_node(eing.id());
                }
            }
        };

        let cat_set = new Set();
        for(let enode of this.bbopGraph.all_nodes()) {
            for(let in_type of enode.types()) {
                cat_set.add(in_type.category());
            }
        }
        this.categories = Array.from(cat_set);    
    }
    
    getBBOPGraph() {
        return this.bbopGraph;
    }

    /**
     * Used to restore the graph as it was before any manipulation
     */
    resetBBOPGraph() {
        this.setBBOPGraph(this.bbopGraphBackup);        
    }
    
    setDBXrefs(dbxrefs) {
        this.dbxrefs = dbxrefs;
    }

    getDBXrefs() {
        return this.dbxrefs;
    }


    /** 
     * Return all GO-CAM activity nodes using the GO-CAM activity object (not the bbop node)
    */
    getAllActivities() {
        let nodes = this.bbopGraph.all_nodes();
        let activities = nodes.filter(node => node.root_types().some(type => type.class_id() == "GO:0003674"))
        let betterActivities = [];
        for(let activity of activities) {
            betterActivities.push(this.getActivity(activity.id()));
        }
        return betterActivities;
    }
    
    /**
     * Return a GO-CAM activity object
     * @param nodeId gocam node id e.g. gomodel:568b0f9600000284/57ec3a7e00000119
     */
    getActivity(nodeId) {

        // If no id provided, no activity returned
        if(!nodeId) { console.error("no id provided"); return undefined; }
    
        // If id is not from gomodel space (hardcoded bad), no activity returned
        if(nodeId.substring(0, 8) != "gomodel:") { console.error("wrong id provided"); return undefined; }
    
        // if not couldn't be retrieved, no activity returned
        let node = this.bbopGraph.get_node(nodeId);
        if(!node) { console.error("could not get bbop graph node ", nodeId); return undefined; }


        // nodes connected to this activity
        let subgraph = node.subgraph();


        // this will detect the associated biological context
        let standardTypes = node.types();
        let inferredTypes = node.get_unique_inferred_types();
        let geneProducts = []
        let biocontext = { };
        let hook_list = []
        if(subgraph) {
            let connectedNodes = subgraph.all_nodes();
            for(let connected of connectedNodes) {
                // don't treat if same node
                if(node.id() == connected.id()) { continue; }
    
                let edges = subgraph.get_edges(node.id(), connected.id());
                for(let edge of edges) {
                    // we are only interested in edges with enabled_by relation
                    if(!this.relations_enabled_by.includes(edge.predicate_id())) { continue }
    
                    geneProducts.push({
                        id : this.nodeIDs(connected)[0],
                        label: this.nodeLabels(connected)[0]
                    });
                }
            }
    
            // Do it both ways--upstream and downstream.
            this._folded_stack_gather(node, subgraph, 'standard', hook_list, biocontext);
            this._folded_stack_gather(node, subgraph, 'reverse', hook_list, biocontext);
            // convert to array
            for(let key of Object.keys(biocontext)) {
                biocontext[key] = Array.from(biocontext[key]);
            }
        }        

        // var x_node = subgraph.get_node(entity_id);
        // if(x_node) {
        //     var ev_node_anns = x_node.get_annotations_by_key('evidence');
        //     // console.log("node evs: ", ev_node_anns);
        // }

        let annotations = node.annotations();
        let annotationMap = { };
        for(let ann of annotations) {
            let cs = new Set();
            if(ann.key() in annotationMap) {
                cs = annotationMap[ann.key()]
            } else {
                annotationMap[ann.key()] = cs;
            }
            cs.add(ann.value());
        }
        // convert to array
        for(let key of Object.keys(annotationMap)) {
            annotationMap[key] = Array.from(annotationMap[key]);
        }
        // console.log("node annotations: ", annotationMap);        
        
        return {
            nodeId : nodeId,
            ids : standardTypes.map(elt => elt.class_id()),
            labels : standardTypes.map(elt => elt.class_label()),
            biocontexts : biocontext,
            geneProducts : geneProducts,
            contributors : "contributor" in annotationMap ? annotationMap["contributor"] : [],
            providedBy : "providedBy" in annotationMap ? annotationMap["providedBy"] : [],
            date : "date" in annotationMap ? annotationMap["date"][0] : "N/A",
            raw : {
                node : node,
                stdTypes : standardTypes,
                infTypes : inferredTypes,
                annotations : annotationMap,
            }
        }
    }    


    async enrichActivities(activities) {
        let enriched = [];
        for(let activity of activities) {
            enriched.push(this.enrichActivity(activity));
        }
        return Promise.all(enriched);
    }


    /**
     * This will return an activity enriched with additional meta data, such as gene taxon and URLs
     * Note: this require dbxrefs to be set
     * @param activity activity object returned by getActivity()
     */
    async enrichActivity(activity) {

        for(let gp of activity.geneProducts) {
            let metas = await this.annotate(gp.id);

            // if no meta retrieved, continue
            if(!metas) { continue; }

            // add hyperlink to gene
            gp.url = metas.url;
            
            if(metas.taxon) {
                let db = metas.taxon.split(":")[0];
                db = "taxon" // temp fix
                let id = metas.taxon.split(":")[1];
                gp.taxonId = metas.taxon;
                gp.taxonLabel = metas.taxon_label;
                gp.taxonURL = this.dbxrefs.getURL(db, undefined, id);
            }
        }

        activity.urls = []
        for(let goid of activity.ids) {
            let db = goid.split(":")[0];
            let id = goid.split(":")[1];
            activity.urls.push(this.dbxrefs.getURL(db, undefined, id));
        }

        return activity;
    }

    async annotate(id) {
        if(!id) {
            console.error("asked to annotated null id: ", id);
            return "";
        }
        if(id.includes(":")) {
            let category = "category=gene&";
            if(id.includes("GO:"))
                category = ""
            let url = this.goApiUrl + id + "?" + category + "rows=1";
            return await fetch(url)
            .then(async function(data) { return data.json()})
            .then(data => {
                let doc = data.docs[0];
                let db = doc.id.split(":")[0];
                let dbid = doc.id.split(":")[1];
                doc["url"] = this.dbxrefs.getURL(db, undefined, dbid);
                // doc["taxon_url"] = ncbiTaxonUrl + doc.taxon.replace("NCBITaxon:", "")
                return doc
            })
        }
    }


//         let id = data.link && data.link._class_id ? data.link.class_id() : undefined
//         let meta = annotate(id, dbxrefs);

//         meta.then(metaData => {
//             let payload = {
//                 entityId : nodeId,
//                 id : id,
//                 uri : id ? "https://www.alliancegenome.org/gene/" + id : undefined,
//                 annotation : annotationMap,
//                 biocontext : biocontext,
//                 meta : metaData,
//                 label : data.label,
//                 data : data.link,
//                 standardTypes : standardTypes,
//                 inferredTypes : inferredTypes,
//                 x : evt.renderedPosition.x,
//                 y : evt.renderedPosition.y
//             }
//         });        





    nodeIDs(n){
        var retlist = [];
        var bin = {};
        for(let in_type of n.types()) {
            var cat = in_type.category();
            if( ! bin[cat] ) { bin[cat] = []; }
            bin[cat].push(in_type);
        }
        for(let cat_id of this.categories) {
            var accumulated_types = bin[cat_id];
            var cell_cache = [];
            for(let atype of accumulated_types) {
                var tt = atype.class_id();
                cell_cache.push(tt);
            }
            retlist.push(cell_cache.join("\n"));
        };
        return retlist;
    }

    nodeLabels(n){
        var retlist = [];
        var bin = {};
        for(let in_type of n.types()) {
            var cat = in_type.category();
            if( ! bin[cat] ) { bin[cat] = []; }
            bin[cat].push(in_type);
        }
        for(let cat_id of this.categories) {
            var accumulated_types = bin[cat_id];
            var cell_cache = [];
            for(let atype of accumulated_types) {
                var tt = atype.class_label();
                cell_cache.push(tt);
            }
            retlist.push(cell_cache.join("\n"));
        };
        return retlist;
    }

    nodeIDLabels(n){
        var retlist = [];
        var bin = {};
        for(let in_type of n.types()) {
            var cat = in_type.category();
            if( ! bin[cat] ) { bin[cat] = []; }
            bin[cat].push(in_type);
        }
        for(let cat_id of this.categories) {
            var accumulated_types = bin[cat_id];
            var ids = [];
            var labels = [];
            for(let atype of accumulated_types) {
                ids.push(atype.class_id());
                labels.push(atype.class_label());
            }
            retlist.push({ ids: ids.join("\n"), labels: labels.join("\n") });
        };
        return retlist;
    }



    // Gather the stack to display, abstractly do go up or down
    // the subgraph.
    _folded_stack_gather(enode, subgraph, direction, hook_list, biocontext) {

        // First, get the parent/child sub-nodes.
        var x_edges = [];
        if( direction === 'standard' ) {
            x_edges = subgraph.get_parent_edges(enode.id());
        }else{
            x_edges = subgraph.get_child_edges(enode.id());
        }
        
        // for a specific aspect of the activity
        for(let x_edge of x_edges) {
            // Edge info.
            var rel = x_edge.relation() || 'n/a';
            // TODO var rel_color = aid.color(rel);
            // TODO var rel_readable = aid.readable(rel);
            var rel_color = "red";
            var rel_readable = "readable_var";
            // If context aid doesn't work, see if it comes with a label.
            if( rel_readable === rel && typeof(x_edge.label) === 'function'){
                var label_rn = x_edge.label();
                if( label_rn !== rel ){
                rel = label_rn; // use label
                }
            }else{
                rel = rel_readable; // use context
            }

            // collecting all the evidences for that aspect.... (seriously this business logic should be on the server side to avoid those kind of smelly/spaghetti code)
            let gathered_evidences = { "pmid": [], "eco": [], "label": [], "url" : [] }
            var refsubgraphs = x_edge.referenced_subgraphs();
            for(var refsubgraph of refsubgraphs) {
                var refevnodes = refsubgraph.get_nodes()
                for(let nodeid of Object.keys(refevnodes)) {
                    let node = refsubgraph.get_node(nodeid);
                    let anns = node.annotations();
                    for(let ann of anns) {
                        if(ann._properties["key"] == "source") {
                            let id = ann._properties["value"];
                            gathered_evidences["pmid"].push(id);
                            if(id && id.includes(":")) {
                                gathered_evidences["url"].push(this.dbxrefs.getURL(id.split(":")[0], undefined, id.split(":")[1]))
                            } else {
                                // could not resolve
                                gathered_evidences["url"].push("#");
                            }
                        }
                    }
                    let types = node.types();
                    for(let type of types) {
                        gathered_evidences["eco"].push(type.class_id());
                        gathered_evidences["label"].push(type.class_label());
                    }
                }
            }

            var ev_edge_anns = x_edge.get_annotations_by_key('evidence');

            // Get node.
            var x_ent_id = null;
            if( direction === 'standard' ){
                x_ent_id = x_edge.object_id();
            }else{
                x_ent_id = x_edge.subject_id();
            }

            var x_node = subgraph.get_node(x_ent_id);
            // console.log("CENTRAL NODE: ", x_ent_id, x_node);
            // Try and extract proof of evidence.
            if( x_node ) {
                var ev_node_anns = x_node.get_annotations_by_key('evidence');
                // console.log("utils : node annotation: ", ev_node_anns);

                // Add the edge/node combos to the table.
                for(let x_type of x_node.types()) {
                    //
                    var elt_id = this.uuid();
                    var edge_id = x_edge.id();
                    let edge_label = this.glyph(x_edge.relation()).label;
                    hook_list.push([edge_id, elt_id]);
                    // console.log("XTYPE: ", x_type);
                    let relid = x_edge.relation();

                    let cs = new Set();
                    if(relid in biocontext) {
                        cs = biocontext[relid];
                    } else {
                        biocontext[relid] = cs;
                    }
                    
                    cs.add({
                        relationId: edge_id,
                        relationLabel : edge_label,
                        relationURL : this.dbxrefs.getURL(relid.split(":")[0], undefined, relid.split(":")[1]),
                        evidences: gathered_evidences,
                        nodeId : elt_id,
                        termId : x_type.class_id(),
                        termLabel : x_type.class_label(),
                        termURL : this.dbxrefs.getURL(x_type.class_id().split(":")[0], undefined, x_type.class_id().split(":")[1]),
                    });

                    // In this case (which should be the only possible
                    // case), we'll capture the ID and pair it with an
                    // ID.
                    // _add_table_row(x_type, rel_color, rel + '(',
                    //     ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-with">E</button></sup>');
                
                }
            }

        }
    }    


    /**
     * From https://github.com/berkeleybop/bbop-core/blob/master/lib/core.js
     * RFC 4122 v4 compliant UUID generator.
     * From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
     *
     * @returns {string} string
     */
    uuid(){

        // Replace x (and y) in string.
        function replacer(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }
        var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return target_str.replace(/[xy]/g, replacer);
    }    

    glyph(relation) {
        switch (relation) {
            case "BFO:0000050":
                return { lineStyle: "solid", glyph: null, label: "part of", color: '#add8e6' };
            case "BFO:0000051":
                return { lineStyle: "solid", glyph: null, label: "has part", color: '#6495ED' };
            case "BFO:0000066":
                return { lineStyle: "solid", glyph: null, label: "occurs in", color: '#66CDAA' };
            case "RO:0002211":
                return { lineStyle: "dashed", glyph: null, label: "regulates", color: '#2F4F4F' };
            case "RO:0002212":
                return { lineStyle: "dashed", glyph: "tee", label: "negatively regulates", color: '#FF0000' };
            case "RO:0002630":
                return { lineStyle: "solid", glyph: "tee", label: "directly negatively regulates", color: '#FF0000' };
            case "RO:0002213":
                return { lineStyle: "dashed", glyph: "triangle", label: "positively regulates", color: '#008000' };
            case "RO:0002629":
                return { lineStyle: "solid", glyph: "triangle", label: "directly positively regulates", color: '#008000' };
            case "RO:0002233":
                return { lineStyle: "solid", glyph: null, label: "has input", color: '#6495ED' };
            case "RO:0002234":
                return { lineStyle: "solid", glyph: null, label: "has output", color: '#ED6495' };
            case "RO:0002331":
                return { lineStyle: "solid", glyph: null, label: "involved in", color: '#E9967A' };
            case "RO:0002333":
                return { lineStyle: "solid", glyph: null, label: "enabled by", color: '#B8860B' };
            case "RO:0002411":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of", color: '#483D8B' };
            case "RO:0002418":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within", color: '#483D8B' };
    
            case "RO:0002408":
                return { lineStyle: "solid", glyph: "tee", label: "directly inhibits", color: '#FF0000' };
            case "RO:0002406":
                return { lineStyle: "solid", glyph: "triangle", label: "directly activates", color: '#008000' };
    
            case "RO:0002305":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of, negative effect", color: '#FF0000' };
            case "RO:0004046":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within, negative effect", color: '#FF0000' };
    
            case "RO:0002304":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of, positive effect", color: '#008000' };
            case "RO:0004047":
                return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within, positive effect", color: '#008000' };
    
            case "annotation":
                return { lineStyle: "solid", glyph: "diamond", label: "annotation", color: '#483D8B' };
            case "instance_of":
                return { lineStyle: "solid", glyph: null, label: "activity", color: '#FFFAFA' };
        }
        console.log("No glyph found for relation '" + relation + "'");
        return { glyph: null, label: relation, color: "black" };
    }

}