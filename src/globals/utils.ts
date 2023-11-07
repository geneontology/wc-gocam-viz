
export function isCausal(relation) {
    switch(relation) {
        case "RO:0002418":
            return true;
        case "RO:0004046":
            return true;
        case "RO:0004047":
            return true;
        case "RO:0002304":
            return true;
        case "RO:0002305":
            return true;
        case "RO:0002211":
            return true;
        case "RO:0002212":
            return true;
        case "RO:0002213":
            return true;
        case "RO:0002578":
            return true;
        case "RO:0002629":
            return true;
        case "RO:0002630":
            return true;
        case "RO:0002406":
            return true;
        case "RO:0002407":
            return true;
        case "RO:0002408":
            return true;
        case "RO:0002409":
            return true;
        case "RO:0002411":
            return true;
        case "RO:0002412":
            return true;
        case "RO:0002413":
            return true;
        case "RO:0002414":
            return true;
        case "RO:0002010":
            return true;
    }
    return false;
}


export function glyph(relation) {

    let defaultSize = 9;
    let smallSize = 4;
    let indirectSize = 6;
    let directSize = 9;

    switch (relation) {
        case "BFO:0000050":
            return { lineStyle: "solid", glyph: null, label: "part of", color: '#add8e6', width: defaultSize };
        case "BFO:0000051":
            return { lineStyle: "solid", glyph: null, label: "has part", color: '#6495ED', width: defaultSize };
        case "BFO:0000066":
            return { lineStyle: "solid", glyph: null, label: "occurs in", color: '#66CDAA', width: defaultSize };
        case "RO:0002211":
            return { lineStyle: "dashed", glyph: null, label: "regulates", color: '#2F4F4F', width: indirectSize };
        case "RO:0002212":
            return { lineStyle: "dashed", glyph: "tee", label: "negatively regulates", color: '#FF0000', width: indirectSize };
        case "RO:0002630":
            return { lineStyle: "solid", glyph: "tee", label: "directly negatively regulates", color: '#FF0000', width: directSize };
        case "RO:0002213":
            return { lineStyle: "dashed", glyph: "triangle", label: "positively regulates", color: '#008000', width: indirectSize };
        case "RO:0002629":
            return { lineStyle: "solid", glyph: "triangle", label: "directly positively regulates", color: '#008000', width: directSize };
        case "RO:0002233":
            return { lineStyle: "solid", glyph: null, label: "has input", color: '#6495ED', width: defaultSize };
        case "RO:0002234":
            return { lineStyle: "solid", glyph: null, label: "has output", color: '#ED6495', width: defaultSize };
        case "RO:0002331":
            return { lineStyle: "solid", glyph: null, label: "involved in", color: '#E9967A', width: defaultSize };
        case "RO:0002333":
            return { lineStyle: "solid", glyph: null, label: "enabled by", color: '#B8860B', width: defaultSize };
        case "RO:0002411":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of", color: '#483D8B', width: indirectSize };
        case "RO:0002418":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within", color: '#483D8B', width: indirectSize };

        case "RO:0002408":
            return { lineStyle: "solid", glyph: "tee", label: "directly inhibits", color: '#FF0000', width: directSize };
        case "RO:0002406":
            return { lineStyle: "solid", glyph: "triangle", label: "directly activates", color: '#008000', width: directSize };

        case "RO:0002305":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of, negative effect", color: '#FF0000', width: indirectSize };
        case "RO:0004046":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within, negative effect", color: '#FF0000', width: indirectSize };

        case "RO:0002304":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of, positive effect", color: '#008000', width: indirectSize };
        case "RO:0004047":
            return { lineStyle: "dashed", glyph: null, label: "causally upstream of or within, positive effect", color: '#008000', width: indirectSize };

        case "annotation":
            return { lineStyle: "solid", glyph: "diamond", label: "annotation", color: '#483D8B', width: defaultSize };
        case "instance_of":
            return { lineStyle: "solid", glyph: null, label: "activity", color: '#FFFAFA', width: defaultSize };

        case "RO:0002413":
            return { lineStyle: "solid", glyph: "circle-triangle", label: "directly provides input for", color: '#add8e6', width: smallSize };
    
    }
    console.warn("No glyph found for relation '" + relation + "'");
    return { glyph: null, label: relation, color: "black" };
}

export function relationMeta(relation) {
    switch(relation) {
        case "instance_of":
            return { "priority" : 8, "label": "instance_of" };
        case "is_a":
            return { "priority": 1, "label": "is a" };
        case "BFO:0000050":
            return { "priority" : 15, "label": "part of" };
        case "BFO:0000051":
            return { "priority": 4, "label": "has part" };
        case "BFO:0000066":
            return { "priority": 12, "label": "occurs in" };
        case "RO:0002202":
            return { "priority": 0, "label": "develops from" };
        case "RO:0002211":
            return { "priority": 16, "label": "regulates" };
        case "RO:0002212":
            return { "priority": 16, "label": "negatively regulates" };
        case "RO:0002630":
            return { "priority": 16, "label": "directly negatively regulates" };
        case "RO:0002213":
            return { "priority": 18, "label": "positively regulates" };
        case "RO:0002629":
            return { "priority": 17, "label": "directly positively regulates" };
        case "BFO:0000066":
            return { "priority": 4, "label": "has_part" };
    }
    return { "priority" : 1, "label": "N/A"};
}


export function _node_ids_labels(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
        var accumulated_types = bin[cat_id];
        var cell_cache = [];
        for(let atype of accumulated_types) {
            var id = atype.class_id();
            var label = atype.class_label();
            cell_cache.push({ id : id, label : label });
        }
        retlist.push(cell_cache);
    };
    return retlist;
}

export function _node_labels(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
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

export function _node_ids(n, cat_list){
    var retlist = [];
    var bin = {};
    for(let in_type of n.types()) {
        var cat = in_type.category();
        if( ! bin[cat] ) { bin[cat] = []; }
        bin[cat].push(in_type);
    }
    for(let cat_id of cat_list) {
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

export function type_to_span(in_type, color){

    var text = null;

    var min = in_type.to_string();
    var more = in_type.to_string_plus();
    if( color ){
	text = '<span ' + 'style="background-color: ' + color + ';" ' +
	    'alt="' + more + '" ' + 'title="' + more +'">' + min + '</span>';
    }else{
	text = '<span alt="' + more + '" title="' + more +'">' + min + '</span>';
    }

    return text;
}

let goApiUrl = "https://api.geneontology.org/api/search/entity/autocomplete/";
let ncbiTaxonUrl = "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=";
export async function annotate(id, dbxrefs) {
    if(!id) {
        console.error("asked to annotated null id: ", id);
        return "";
    }
    if(id.includes(":")) {
        let category = "category=gene&";
        if(id.includes("GO:"))
            category = ""
        let url = goApiUrl + id + "?" + category + "rows=1";
        return await fetch(url)
        .then(async function(data) { return data.json()})
        .then(data => {
            let doc = data.docs[0];
            let db = doc.id.split(":")[0];
            let dbid = doc.id.split(":")[1];
            doc["url"] = dbxrefs.getURL(db, undefined, dbid);
            doc["taxon_url"] = ncbiTaxonUrl + doc.taxon.replace("NCBITaxon:", "")
            return doc
        })
    }
}




// Gather the stack to display, abstractly do go up or down
// the subgraph.
export function _folded_stack_gather(enode, graph, subgraph, direction, hook_list, biocontext, dbxrefs) {

    // First, get the parent/child sub-nodes.
    var x_edges = [];
    if( direction === 'standard' ) {
        x_edges = subgraph.get_parent_edges(enode.id());
    }else{
        x_edges = subgraph.get_child_edges(enode.id());
    }
    
    // Put an order on the edges.
    x_edges.sort(function(e1, e2) {
        return relationMeta(e1.relation())["priority"] - relationMeta(e2.relation())["priority"];
    });
    
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
                            gathered_evidences["url"].push(dbxrefs.getURL(id.split(":")[0], undefined, id.split(":")[1]))
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
                var elt_id = uuid();
                var edge_id = x_edge.id();
                let edge_label = glyph(x_edge.relation()).label;
                hook_list.push([edge_id, elt_id]);
                // console.log("XTYPE: ", x_type);
                let relid = x_edge.relation();

                if( ev_edge_anns.length > 0 ){
                    let cs = new Set();
                    if(relid in biocontext) {
                        cs = biocontext[relid];
                    } else {
                        biocontext[relid] = cs;
                    }
                    
                    cs.add({
                        relationId: edge_id,
                        relationLabel : edge_label,
                        relationURL : dbxrefs.getURL(relid.split(":")[0], undefined, relid.split(":")[1]),
                        relationEvidence : ev_edge_anns,
                        evidences: gathered_evidences,
                        nodeId : elt_id,
                        termId : x_type.class_id(),
                        termLabel : x_type.class_label(),
                        termURL : dbxrefs.getURL(x_type.class_id().split(":")[0], undefined, x_type.class_id().split(":")[1]),
                    });

                    // In this case (which should be the only possible
                    // case), we'll capture the ID and pair it with an
                    // ID.
                    // _add_table_row(x_type, rel_color, rel + '(',
                    //     ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-with">E</button></sup>');
                } else {
                    let cs = new Set();
                    if(relid in biocontext) {
                        cs = biocontext[relid];
                    } else {
                        biocontext[relid] = cs;
                    }
                    cs.add({
                        relationId: edge_id,
                        relationLabel : edge_label,
                        relationURL : dbxrefs.getURL(relid.split(":")[0], undefined, relid.split(":")[1]),
                        evidences: gathered_evidences,
                        nodeId : elt_id,
                        termId : x_type.class_id(),
                        termLabel : x_type.class_label(),
                        termURL : dbxrefs.getURL(x_type.class_id().split(":")[0], undefined, x_type.class_id().split(":")[1]),
                    });

                    // _add_table_row(x_type, rel_color, rel + '(',
                    //     ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-without">&nbsp;</button></sup>');
                }
            }
        }

    }
}


// General function for adding type information to stack.
export function _add_table_row(item, color, prefix, suffix) {
    //var rep_color = aid.color(item.category());
    var out_rep = type_to_span(item, color);
    if( prefix ){ out_rep = prefix + out_rep; }
    if( suffix ){ out_rep = out_rep + suffix; }
    var trstr = null;
    if( color ){
        trstr = '<tr class="bbop-mme-stack-tr" ' +
        'style="background-color: ' + color +
        ';"><td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';
    }else{
        trstr = '<tr class="bbop-mme-stack-tr">' +
        '<td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';
    }
    // enode_stack_table.add_to(trstr);
}









/**
 * From https://github.com/berkeleybop/bbop-core/blob/master/lib/core.js
 * RFC 4122 v4 compliant UUID generator.
 * From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
 *
 * @returns {string} string
 */
export function uuid(){

    // Replace x (and y) in string.
    function replacer(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    }
    var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return target_str.replace(/[xy]/g, replacer);
}


const slim = {
    "GO:0048018" : "Ligand - receptor ligand activity",
    "GO:0004888" : "Receptor - transmembrane signaling receptor activity",
    "GO:0016301" : "Kinase - kinase activity",
    "GO:0016791" : "Phosphatase - phosphatase activity",
    "GO:0061630" : "Ubiquitin Ligase - ubiquitin protein ligase activity",
    "GO:0101005" : "Deubiquitinase - ubiquitinyl hydrolase activity",
    "GO:0003700" : "Transcription Factor - DNA-binding transcription factor activity",
    "GO:0060090" : "Adaptor - molecular adaptor activity"
};


export function activityType(mfTerm) {

}