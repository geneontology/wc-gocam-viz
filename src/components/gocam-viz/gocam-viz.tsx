import { Component, Prop, Element, Watch, h } from '@stencil/core';

import { graph as noctua_graph } from 'bbop-graph-noctua';
import minerva_manager from 'bbop-manager-minerva';
import barista_response from 'bbop-response-barista';
import { jquery as jquery_engine } from 'bbop-rest-manager';

import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { State } from '@stencil/core';

cytoscape.use( coseBilkent );


@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.css',
    shadow: false,
})
export class GoCamViz {

    @Element() gocamviz;

    @Prop() gocamId: string;

    @Prop() showHasInput: boolean = false;

    @Prop() showHasOutput: boolean = false;

    @Prop() showActivity: boolean = false;

    @Prop() graphFold: string = "editor";

    @State() loading: boolean = false;


    @Watch('gocamId')
    gocamIdChanged(newValue, oldValue) {
        if (newValue != oldValue) {
            this.loadGoCam(newValue);
        }
    }


    relations_enabled_by = ['http://purl.obolibrary.org/obo/RO_0002333', 'RO_0002333', 'RO:0002333'];
    relations_collapsible = ["RO:0002333", "BFO:0000066", "RO:0002233", "RO:0002488", "RO:0002234"]; // 2233 : has input ; 2234 : has output
    // relations_collapsible = ["RO:0002333", "BFO:0000066", "RO:0002233", "RO:0002488", "RO:0002234"]; // 2233 : has input ; 2234 : has output
    relations_nestable = { };
    relations_strippable = {
        "BFO:0000050": true,    // part of
        "BFO:0000051": true,    // has part
        "RO:0002220": true,     // adjacent to
        "BFO:0000066": true,    // occurs in
        "RO:0012005" : true     // is small molecule activator
    };

    

    glyph(relation) {
        switch(relation) {
            case "BFO:0000050":
                return { glyph: null, label: "part of", color: '#add8e6'};
            case "BFO:0000051":
                return { glyph: null, label: "has part", color: '#6495ED'};
            case "BFO:0000066":
                return { glyph: null, label: "occurs in", color: '#66CDAA'};
            case "RO:0002211":
                return { glyph: null, label: "regulates", color: '#2F4F4F'};
            case "RO:0002212":
                return { glyph: "tee", label: "negatively regulates", color: '#FF0000'};
            case "RO:0002630":
                return { glyph: "tee", label: "directly negatively regulates", color: '#FF0000'};                
            case "RO:0002213":
                return { glyph : "triangle", label: "positively regulates", color: '#008000'};
            case "RO:0002629":
                return { glyph : "triangle", label: "directly positively regulates", color: '#008000'};
            case "RO:0002233":
                return { glyph : null, label: "has input", color: '#6495ED'};
            case "RO:0002234":
                return { glyph : null, label: "has output", color: '#ED6495'};
            case "RO:0002331":
                return { glyph : null, label: "involved in", color: '#E9967A'};
            case "RO:0002333":
                return { glyph : null, label: "enabled by", color: '#B8860B'};
            case "RO:0002411":
                return { glyph : null, label: "causally upstream of", color: '#483D8B'};
            case "RO:0002418":
                return { glyph : null, label: "causally upstream of or within", color: '#483D8B'};

            case "RO:0002406":
                return { glyph: "tee", label: "directly activates", color: '#008000'};                
              
            case "RO:0002305":
                return { glyph : null, label: "causally upstream of, negative effect", color: '#FF0000'};
            case "RO:0004046":
                return { glyph : null, label: "causally upstream of or within, negative effect", color: '#FF0000'};

            case "RO:0002304":
                return { glyph : null, label: "causally upstream of, positive effect", color: '#008000'};
            case "RO:0004047":
                return { glyph : null, label: "causally upstream of or within, positive effect", color: '#008000'};

            case "annotation":
                return { glyph : "diamond", label: "annotation", color: '#483D8B'};
            case "instance_of":
                return { glyph : null, label: "activity", color: '#FFFAFA'};
        }
        console.log("No glyph found for relation '" + relation + "'");
        return { glyph: null, label: relation, color: "black" };
    }


    initCytoscape() {
        cytoscape.use( coseBilkent );
    }

    engine;
    initEngine() {
        this.engine = new jquery_engine(barista_response);
        this.engine.method('POST');
        // console.log("engine: " , this.engine);
    }

    manager;
    initManager() {
        let global_barista_location = "http://barista.berkeleybop.org/";
        let global_minerva_definition_name = "minerva_public";
        let user_token = "";

        this.manager = new minerva_manager(global_barista_location, global_minerva_definition_name, user_token, this.engine, "async");
        
        this.manager.register('rebuild', (resp, man) => {
            console.log("rebuild: ", resp , man);
            let graph = new noctua_graph();
            graph.load_data_basic(resp.data());
            this.renderGoCam(resp._data.id, graph);
        });
        this.manager.register('meta', function(resp, man){
            console.log(resp, man);
        });
        this.manager.register('manager_error', function(resp, man){
            console.error(resp, man);
        });
        this.manager.register('error', function(resp, man){
            console.error(resp, man);
        });
        this.manager.register('warning', function(resp, man){
            console.log(resp, man);
        });
        // console.log("manager: " , this.manager);
    }

    loadGoCam(gocamId) {
        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = ""
        if(!gocamId.startsWith("gomodel:")) {
            gocamId = "gomodel:" + gocamId;
        }
        this.loading = true;
        this.manager.get_model(gocamId);
    }


    renderGoCam(gocamId, graph, nest = "no") {

        // Prepare graph
        graph.unfold();
        if(this.graphFold == "evidence") {
            graph.fold_evidence();
        } else if(this.graphFold == "editor") {
            graph.fold_go_noctua(this.relations_collapsible)
        }

        let g = graph.clone();

        // Get a list of all the singletons we start with.
        var all_starting_singletons_by_id = {};
        var sings = g.get_singleton_nodes();
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

        for(let e of g.all_edges()) {
            if(this.relations_nestable.hasOwnProperty(e.predicate_id())) {
                if(!parent_trap.hasOwnProperty(e.subject_id())) {
                    parent_trap[e.subject_id()] = [];
                }
                parent_trap[e.subject_id()].push(e.object_id());
                // Note the object for later checking.
                note_sink[e.object_id()] = true;
            }
            if(this.relations_strippable.hasOwnProperty(e.predicate_id())) {
                g.remove_edge(e.subject_id(),
                        e.object_id(),
                        e.predicate_id());
            }
        }


        // If it wasn't a singleton before we started, but is one now,
        // remove it. In "nest" mode, only remove ones that are not
        // going to be nested.
        var eings = g.get_singleton_nodes();
        for(let eing of eings) {
            if(!all_starting_singletons_by_id.hasOwnProperty(eing.id())) {
                if( nest && nest === 'yes' && note_sink[eing.id()] ){
                    // pass
                }else{
                    g.remove_node(eing.id());
                }
            }
        };

        // let cat_list = [];
        // for(let enode of g.all_nodes()) {
        //     for(let in_type of enode.types()) {
        //         cat_list.push(in_type.category());
        //     }
        // }
        // // is this just creating a set ???
        // let tmph = bbop.hashify(cat_list);
        // cat_list = us.keys(tmph);

        let cat_set = new Set();
        for(let enode of g.all_nodes()) {
            for(let in_type of enode.types()) {
                cat_set.add(in_type.category());
            }
        }
        let cat_list = Array.from(cat_set);


        let elements = [];
        for(let node of g.all_nodes()) {

            let nid = node.id();

            // Where we'll assemble the label.
    	    var table_row = [];
            
            // Collect rdfs:label if extant.
            var anns = node.annotations();
            var rdfs_label = null;
            if( anns.length !== 0 ) {
                for(let ann of anns) {
                    // Capture rdfs:label annotation for visual override
                    // if extant. Allow clobber of last.
                    if( ann.key() === 'rdfs:label' ){
                        rdfs_label = ann.value();
                    }
                }
            }
            if( rdfs_label ){
                table_row.push('<<' + rdfs_label + '>>');
            }


            // First, extract any GP info (or has_input, depending on
            // rel), if it's there.  If it is, it is the exclusive
            // displayed info.
            let gp_identified_p = false;
            let has_input_collection = [];
            let sub = node.subgraph();
            if(sub) {
                for(let snode of sub.all_nodes()) {
                    let snid = snode.id();

                    if(nid != snid) {
                        let edges = sub.get_edges(nid, snid);

                        for(let edge of edges) {

                            // If enabled by relation is present, use primary that node label
                            if(this.relations_enabled_by.includes(edge.predicate_id())) {

                                let gpn = sub.get_node(snid);

                                let gp_labels = this._node_labels(gpn, cat_list);
                                for(let gpl of gp_labels) {
                                    let last = gpl.lastIndexOf(" ");
                                    if(last > 0) { gpl = gpl.substring(0, last); }
                                    console.log("GP: ", gpl);
                                    table_row.push(gpl);
                                    gp_identified_p = true;                                    
                                }

                            // If we consider has input relationship, look for node label here too
                            } else if(this.showHasInput && edge.predicate_id() == "RO:0002233") {
                                let hin = sub.get_node(snid);

                                let hi_labels = this._node_labels(hin, cat_list);
                                for(let hil of hi_labels) {
                                    let last = hil.lastIndexOf(" ");
                                    if(last > 0) { hil = hil.substring(0, last); }
                                    has_input_collection.push(hil);
                                }
                            }
                        }
                    }
                }
            }


            let bgc = "white";
            // If no GP has been identified, then add any label from that node
            if(!gp_identified_p) {
                for(let nl of this._node_labels(node, cat_list)) {
                    if(this.showActivity) {
                        table_row.push("[" + nl + "]");
                    } else {
                        table_row.push(nl);
                    }
                }

            } else if(this.showActivity) {
                for(let nl of this._node_labels(node, cat_list)) {
                    table_row.push("[" + nl + "]");
                }

            } else {
                bgc = "yellow";

            }

            // Add the has_inputs last.
            for(let itm of has_input_collection) {
                table_row.push("(" + itm + "➔)");
            }

            let nlabel = table_row.join("\n");


            // Add nesting where desired, if the nesting isn't
            // breaking the single parent model.
            var parent = null;
            var text_v_align = null;
            var text_h_align = null;
            if( parent_trap.hasOwnProperty(nid) ){
                var parents = parent_trap[nid];
                if( parents.length === 1 ){
                    console.log('adding parent for: ' + nid);
                    parent = parents[0];
                    text_v_align = 'top';
                    text_h_align = 'left';
                }
            }            

            elements.push(
                {
                    group: "nodes",
                    data: {
                        id: nid,
                        label: nlabel,
                        parent: parent,
                        'text-valign': text_v_align,
                        'text-halign': text_h_align,
                        'background-color': bgc,
                        degree: (g.get_child_nodes(nid).length * 10) +
                        g.get_parent_nodes(nid).length
                    }
                }
            );

        }


        for(let e of g.all_edges()) {
            // Detect endpoint type as best as possible.
            var rn = e.relation() || 'n/a';
            var rglyph = this.glyph(rn);

            // Push final edge data.
            elements.push({
                group: 'edges',
                data: {
                    id: e.id(),
                    source: e.subject_id(),
                    target: e.object_id(),
                    predicate: e.predicate_id(),
                    label: rglyph.label ? rglyph.label : e.label(),
                    color: rglyph.color ? rglyph.color : "black",
                    glyph: rglyph.glyph ? rglyph.glyph : "circle"
                }
            });            
        }









        // Get roots for algorithms that need it.
        let roots = g.get_root_nodes();
        let root_ids = [];
        for(let root of roots) {
            root_ids.push(root.id());
        }

        // Setup possible layouts.
        let layout_opts = {
            'cose': {
                name: 'cose',
                padding: 10,
                animate: true,
                'directed': true,
                'fit': true
            },
            'cose-bilkent': {
                name: 'cose-bilkent',
                randomize: true,
                idealEdgeLength: 100,
                // padding: 100,
                // spacingFactor: 1.5
                // nodeRepulsion: 450000
            },
            'noctuadef': {
                'name': 'preset',
                'padding': 30,
                'fit': true,
                'positions': function(a){

                var nid = a.data('id');
                var node = g.get_node(nid);

                // Somewhat vary the intitial placement.
                function _vari(){
                var min = -25;
                var max = 25;
                var rand = Math.random();
                var seed = Math.floor(rand * (max-min+1) +min);
                return seed + 100;
                }
                function _extract_node_position(node, x_or_y){
                var ret = null;

                var hint_str = null;
                if( x_or_y === 'x' || x_or_y === 'y' ){
                    hint_str = 'hint-layout-' + x_or_y;
                }

                var hint_anns = node.get_annotations_by_key(hint_str);
                if( hint_anns.length === 1 ){
                    ret = parseInt(hint_anns[0].value());
                    //ll('extracted coord ' + x_or_y + ': ' + ret);
                }else if( hint_anns.length === 0 ){
                    //ll('no coord');
                }else{
                    //ll('too many coord');
                }

                return ret;
                }

                var old_x = _extract_node_position(node, 'x') || _vari();
                var old_y = _extract_node_position(node, 'y') || _vari();
                console.log('nid', nid, 'old_x', old_x, 'old_y', old_y);

                return {'x': old_x, 'y': old_y };
            }
            },
            'random': {
                name: 'random',
                fit: true
            },
            'grid': {
                name: 'grid',
                fit: true,
                padding: 30,
                rows: undefined,
                columns: undefined
            },
            'circle': {
                name: 'circle',
                fit: true,
                sort: function(a, b){
                    return a.data('degree') - b.data('degree');
                }
            },
            'breadthfirst': {
                name: 'breadthfirst',
                directed: true,
                fit: true,
                spacingFactor: 1.0,// 1.75,
                padding: 30,// 30,
                circle: false//,
            }
        };






        // Showing loading message
        let viz = this.gocamviz.querySelector("#gocam-viz");
        // viz.innerHTML = "";
        console.log("Displaying GO-CAM ", gocamId , graph);


        // let show_shape = "ellipse";
        let show_shape = "round-rectangle";
        let layout = 'cose-bilkent';
        // let layout = "noctuadef";

        let cy = cytoscape({
            container: viz,
            elements: elements,
            layout: layout_opts[layout],
            style: [
                {
                    selector: 'node',
                    style: {
                        'content': 'data(label)',
                        'width': 95,
                        'height': 37,
                        'background-color': 'white',
                        'border-width': 1,
                        'border-color': 'black',
                        'font-size': 8,
                        'min-zoomed-font-size': 1, //10,
                        'text-valign': 'center',
                        'color': 'black',
                        'shape': show_shape,
                        'text-wrap': 'wrap',
                        'text-overflow-wrap': "anywhere",
                        'text-max-width': '85px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'content': 'data(label)',
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'data(glyph)',
                        'curve-style': 'bezier',
                        'text-rotation': 'autorotate',
                        'text-margin-y': '-6px',
                        'text-margin-x': '-3px',                    
                        'target-arrow-fill': 'filled',
                        'font-size': 6,
                        'min-zoomed-font-size': 1, //10,
                        'color': 'white',
                        'text-outline-width': 1,
                        'text-outline-color': '#222222',
                        'width': 12
                    }
                }
                ],            
            minZoom: 0.1,
            maxZoom: 3.0,
            zoomingEnabled: true,
            userZoomingEnabled: true,
            wheelSensitivity: 0.25,
            panningEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: true,
            selectionType: 'single',
            touchTapThreshold: 8,
            desktopTapThreshold: 4,
            autolock: false,
            autoungrabify: false,
            autounselectify: false,
            ready: this.finishRendering          
        });

        // cy.fit();
        // cy.center();

        this.loading = false;

        cy.on("mouseover", this.onMouseOver);
        cy.on("mouseout", this.onMouseOut);
        cy.on("tap", "node", this.onMouseClick);
    }


    // Adapted from widgetry.
    _node_labels(n, cat_list){
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
                var tt = atype.to_string();
                cell_cache.push(tt);
            }
            retlist.push(cell_cache.join("\n"));
        };
        return retlist;
    }

    finishRendering() {
        console.log("Rendering of the GO-CAM complete");
        // tableElement.innerHTML = "<wc-spinner spinner-style='default' spinner-color='blue'></wc-spinner>"
        
    }

    onMouseOver(evt) {
        console.log("Mouse over ", evt);
    }

    onMouseOut(evt) {
        console.log("Mouse out ", evt);
    }

    onMouseClick(evt) {
        console.log("Mouse click ", evt);
    }


    /** 
     * Before the component is rendered (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentWillLoad() {
        this.initCytoscape();
        this.initEngine();
        this.initManager();
    }

    /** 
     * Once the component has loaded (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentDidLoad() {
        this.loadGoCam(this.gocamId);
    }

    render() {
        let classes = this.loading ? "" : "gocam-viz";
        return [
            this.loading ? <div class="gocam-viz-loader">Loading GO-CAM {this.gocamId} ...</div> : "",
            <div id="gocam-viz" class={classes}></div>
        ];
    }
}
