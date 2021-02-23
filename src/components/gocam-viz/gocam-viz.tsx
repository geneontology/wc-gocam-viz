import { Component, Prop, Element, Event, EventEmitter, Watch, h } from '@stencil/core';
import { Listen, Method, State } from '@stencil/core';

import { graph as noctua_graph } from 'bbop-graph-noctua';
import minerva_manager from 'bbop-manager-minerva';
import barista_response from 'bbop-response-barista';
import { jquery as jquery_engine } from 'bbop-rest-manager';

import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

import { glyph, _node_labels, annotate, _folded_stack_gather } from '../../globals/utils';

import * as dbxrefs from "@geneontology/dbxrefs";

import '@geneontology/wc-light-modal';
import { GraphHandler } from '../../globals/graphHandler';
import { GenesPanel } from '../genes-panel/genes-panel';


cytoscape.use( coseBilkent );


@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.css',
    shadow: false,
})
export class GoCamViz {

    @Element() gocamviz;
    genesPanel : HTMLWcGenesPanelElement;

    @Prop() gocamId: string;

    /**
     * If true, this will show the list of available GO-CAM in GO
     * For more information, please refer to http://geneontology.org/docs/gocam-overview/
     */
    @Prop() showGoCamSelector: boolean = false;

    /**
     * Show/hide the input of an activity
     */
    @Prop() showHasInput: boolean = false;

    /**
     * Show/hide the output of an activity
     */
    @Prop() showHasOutput: boolean = false;

    /**
     * Show/hide the gene product in the activity node
     */    
    @Prop() showGeneProduct: boolean = false;
    
    /**
     * Show/hide the activity in the activity node
     */    
    @Prop() showActivity: boolean = false;

    @Prop() graphFold: string = "editor";

    /**
     * Deprecated for the moment
     */
    @Prop() autoHideModal: boolean = false;
    
    /**
     * Indicates if the component is loading some data
     */
    @State() loading: boolean = false;


    // variables for bbop manager & graph
    engine;
    manager;    
    currentGraph = undefined;

    // modal: HTMLWcLightModalElement;

    cy = undefined;             // container of the cytoscape.js graph

    dbXrefsReady = false;       // check if dbxrefs is initialized

    /**
     * This state is updated whenever loading a new graph, in order to trigger a new rendering of genes-panel
     */
    @State() ghandler : GraphHandler;


    // Variables for handling click and mouse over
    selectedNode = undefined;
    selectedEvent = undefined;
    timerPopup = undefined;
    delayPopup = 400;    


    defaultNodeStyle = {
        'content': 'data(label)',
        'width': 'data(width)',
        'height': 55,
        'background-color': 'white',
        'border-width': 1,
        'border-color': 'black',
        'font-size': 16,
        'min-zoomed-font-size': 1, //10,
        'text-valign': 'center',
        'color': 'black',
        'shape': "round-rectangle",
        'text-wrap': 'wrap',
        // 'text-overflow-wrap': "anywhere",
        'text-max-width': 'data(textwidth)'
    }


    // Events triggered by this component
    @Event({eventName: 'nodeOver', cancelable: true, bubbles: true}) nodeOver: EventEmitter;
    @Event({eventName: 'nodeOut', cancelable: true, bubbles: true}) nodeOut: EventEmitter;
    @Event({eventName: 'nodeClick', cancelable: true, bubbles: true}) nodeClick: EventEmitter;
    @Event({eventName: 'layoutChange', cancelable: true, bubbles: true}) layoutChange: EventEmitter;
    


    /**
     * Called whenever an activity has been selected from the genes-panel
     */
    @Listen('selectChanged',{target: "body"})
    newSelection(event: CustomEvent) {
        if (event.detail) {
            let data = event.detail;
            this.cy.zoom(1);
            this.center(data.nodeId);
        }
    }

    /**
     * Called whenever there is a selection of a new GO-CAM
     * @param event 
     */
    @Listen('selectGOCAM',{target: "body"})
    selectGOCAM(event: CustomEvent) {
        if (event.detail) {
            let data = event.detail;
            this.loadGoCam(data.id);
        }
    }
    
    // If the gocam id is changed, update the current graph to the new gocam
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


    initCytoscape() {
        cytoscape.use( coseBilkent );
    }

    initEngine() {
        this.engine = new jquery_engine(barista_response);
        this.engine.method('POST');
        // console.log("engine: " , this.engine);
    }

    /** 
     * Init general communication to barista -> minerva
    */
    initManager() {
        let global_barista_location = "http://barista.berkeleybop.org/";
        let global_minerva_definition_name = "minerva_public";
        let user_token = "";

        this.manager = new minerva_manager(global_barista_location, global_minerva_definition_name, user_token, this.engine, "async");
        
        this.manager.register('rebuild', (resp) => {
            // console.log("rebuild: ", resp , man);
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
    }

    /** 
     * Init the GO dbxrefs.yaml, in order to build URL meta
    */
    initDBXrefs() {
        dbxrefs.init(() => {
            console.log("dbxrefs ready");
            this.dbXrefsReady = true;    
        })
    }

    /**
     * Will request the gocam from the bbop manager; if manager approves, will trigger renderGoCam 
     * @param gocamId valid gocam id gomodel:xxx
     */
    loadGoCam(gocamId) {
        // just to make sure we are working with ID without base URL
        gocamId = gocamId.replace("http://model.geneontology.org/", "");

        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = ""
        if(!gocamId.startsWith("gomodel:")) {
            gocamId = "gomodel:" + gocamId;
        }
        this.loading = true;
        this.ghandler = undefined;
        this.manager.get_model(gocamId);
    }


    /**
     * Actual method to render the GO-CAM graph
     * @param gocamId valid gocam id (e.g. gomodel:xxx)
     * @param graph bbop graph
     * @param nest nesting strategy (default = "no")
     */
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

            let nlink = null;

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
                        // console.log(node , " rdfs:label: ", ann.value());
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

                                let gp_labels = _node_labels(gpn, cat_list);
                                for(let gpl of gp_labels) {
                                    let last = gpl.lastIndexOf(" ");
                                    if(last > 0) { gpl = gpl.substring(0, last); }
                                    // console.log("GP: ", gpl, gpn);
                                    if(this.showGeneProduct) {
                                        table_row.push(gpl);
                                        nlink = gpn.types()[0]
                                    }
                                    gp_identified_p = true;                                    
                                }

                            // If we consider has input relationship, look for node label here too
                            } else if(this.showHasInput && edge.predicate_id() == "RO:0002233") {
                                let hin = sub.get_node(snid);

                                let hi_labels = _node_labels(hin, cat_list);
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
                for(let nl of _node_labels(node, cat_list)) {
                    if(this.showActivity) {
                        table_row.push(nl);
                        // console.log("activity: ", nl);
                        // table_row.push("[" + nl + "]");
                    } else {
                        table_row.push(nl);
                    }
                }

            } else if(this.showActivity) {
                for(let nl of _node_labels(node, cat_list)) {
                    table_row.push(nl);
                    // console.log("activity: ", nl);
                    // table_row.push("[" + nl + "]");
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
                        width: Math.max(115, nlabel.length * 8),
                        textwidth: Math.max(115, nlabel.length * 7),
                        link: nlink,
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
            var rglyph = glyph(rn);

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
                    glyph: rglyph.glyph ? rglyph.glyph : "circle",
                    lineStyle: rglyph.lineStyle ? rglyph.lineStyle : "solid"
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
                // idealEdgeLength: 30,
                // padding: 100,
                spacingFactor: 1.1,
                nodeRepulsion: 450000
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
                    console.log("hint anns: ", hint_anns);
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


        this.currentGraph = g;
        this.ghandler = new GraphHandler(graph.clone());
        this.ghandler.setDBXrefs(dbxrefs);
            

        // Showing loading message
        let viz = this.gocamviz.querySelector("#gocam-viz");
        // viz.innerHTML = "";
        console.log("Displaying GO-CAM ", gocamId , graph);


        let layout = 'cose-bilkent';
        // let layout = "noctuadef";


        this.cy = cytoscape({
            container: viz,
            elements: elements,
            layout: layout_opts[layout],

            style: [
                {
                    selector: 'node',
                    style: this.defaultNodeStyle
                },
                {
                    selector: 'edge',
                    style: {
                        'content': 'data(label)',
                        'line-color': 'data(color)',
                        'line-style': 'data(lineStyle)',
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


        setTimeout(() => {
            this.resetView();
        }, 1000);

        this.loading = false;

        
        this.cy.on("mouseover", evt => this.onMouseOver(evt));
        this.cy.on("mouseout", evt => this.onMouseOut(evt));
        this.cy.on("click", evt => this.onMouseClick(evt));

        // Events whenever the layout is changes, eg to remove modal
        this.cy.on("pan", evt => this.onLayoutChange(evt));
        this.cy.on("zoom", evt => this.onLayoutChange(evt));
        this.cy.on("viewport", evt => this.onLayoutChange(evt));
        this.cy.on("resize", evt => this.onLayoutChange(evt));

        if(this.genesPanel) {
            this.genesPanel.parentCy = this.cy;
        }
        
    }


    /** 
     * Called when cytoscape.ready is called
    */
    finishRendering() {
        console.log("Rendering of the GO-CAM complete");
        // tableElement.innerHTML = "<wc-spinner spinner-style='default' spinner-color='blue'></wc-spinner>"
    }


    highlight(nodeId) {
        let sel = this.cy.elements('[id="' + nodeId + '"]')
        if(sel.size() > 0) {
            sel.style("border-width", "2px")
            sel.style("border-color", "blue")
            sel.style("background-color", "#eef2ff")
            this.selectedNode = sel;
        }    
    }

    clearHighlight(cyNode) {
        if(cyNode) {
            cyNode.style("border-width", "1px");
            cyNode.style("border-color", "black");
            cyNode.style("background-color", "white");
        }
    }


    center(nodeId) {
        let sel = this.cy.elements('[id="' + nodeId + '"]')
        if(sel.size() > 0) {
            this.cy.center(sel);
        }    
    }

    /**
     * If desired, this can render a pop up with information about the gene & its activity
     * @param evt 
     */
    showPopup(evt) {
        if(evt && evt.target && evt.target.id) {
            this.highlight(evt.target.id());
            // evt.target.style("background-color", "#ebebeb")
            // evt.target.style("border-width", "2px")
            // evt.target.style("border-color", "black")
            this.selectedNode = evt.target;
            this.selectedEvent = evt;
            let entity_id = evt.target.id();

            let activity = this.ghandler.getActivity(entity_id);
            // console.log("graph handler: " , activity);

            this.ghandler.enrichActivity(activity);

            if(entity_id.substr(0, 8) == "gomodel:") {
                let data = evt.target.data();
                let node = this.currentGraph.get_node(entity_id);
                let labels = [];
                for(let ann of node.annotations()) {
                    if(ann.key() == "rdfs:label") {
                        labels.push(ann.value());
                    }
                }

                // this concern the activity itself
                let standardTypes = node.types();
                let inferredTypes = node.get_unique_inferred_types();

                // this will detect the associated biological context
                let subgraph = node.subgraph();
                let biocontext = { };
                let hook_list = []
                if(subgraph) {
                    // Do it both ways--upstream and downstream.
                    _folded_stack_gather(node, this.currentGraph, subgraph, 'standard', hook_list, biocontext, dbxrefs);
                    _folded_stack_gather(node, this.currentGraph, subgraph, 'reverse', hook_list, biocontext, dbxrefs);
                    // convert to array
                    for(let key of Object.keys(biocontext)) {
                        biocontext[key] = Array.from(biocontext[key]);
                    }
                }
                
                // console.log("BIOCONTEXT: ", biocontext);
                // console.log("std types: ", standardTypes);
                // console.log("inf types: ", inferredTypes);

                // console.log("node anns: ", annotations);

                // var x_node = subgraph.get_node(entity_id);
                // if(x_node) {
                //     var ev_node_anns = x_node.get_annotations_by_key('evidence');
                //     // console.log("node evs: ", ev_node_anns);
                // }

                let annotations = node.annotations();
                let annotationMap = { };
                for(let ann of annotations) {
                    if(ann.key() == "evidence") {
                        let cs = new Set();
                        if(ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if(ann.key() == "rdfs:label") {
                        let cs = new Set();
                        if(ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if(ann.key() == "contributor") {
                        let cs = new Set();
                        if(ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if(ann.key() == "providedBy") {
                        let cs = new Set();
                        if(ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    }
                }
                // convert to array
                for(let key of Object.keys(annotationMap)) {
                    annotationMap[key] = Array.from(annotationMap[key]);
                }
                // console.log("node annotations: ", annotationMap);

                let id = data.link && data.link._class_id ? data.link.class_id() : undefined
                let meta = annotate(id, dbxrefs);
                meta.then(metaData => {
                    let payload = {
                        entityId : entity_id,
                        id : id,
                        uri : id ? "https://www.alliancegenome.org/gene/" + id : undefined,
                        annotation : annotationMap,
                        biocontext : biocontext,
                        meta : metaData,
                        label : data.label,
                        data : data.link,
                        standardTypes : standardTypes,
                        inferredTypes : inferredTypes,
                        x : evt.renderedPosition.x,
                        y : evt.renderedPosition.y
                    }
                    this.nodeOver.emit(payload);
                })
            }
        }
    }


    /** 
     * Center the cytoscape graph to fit the whole graph
    */
    @Method()
    async resetView() {
        this.cy.fit();
        this.cy.center();
    }


    previousPanelElt = undefined;
    onMouseOver(evt) {
        this.timerPopup = setTimeout(() => this.showPopup(evt), this.delayPopup);

        if(evt.target && evt.target.length) {
            console.log("over: ", evt);
            console.log("gp: ", this.genesPanel);

            let elt = document.getElementById("gp_item_" + evt.target.id());
            if(elt && !elt.classList.contains("gp_item_selected")) {
                elt.classList.add("gp_item_selected");
                this.previousPanelElt = elt;
            }

            console.log("gp ??? " , this.genesPanel);
            if(this.genesPanel) {

                let scrollList = document.getElementById("genes-panel__list");
                let elt2 = document.getElementById("gp_item_" + evt.target.id());
                console.log("sclist: ", scrollList , elt2);
                if(scrollList && elt2) {
                    scrollList.scroll(0, elt2.offsetTop-150)        
                    console.log("scrolling to ", elt2.offsetTop);
                }
                        
                // this.genesPanel.scrollToActivity(evt.target.id());
            }

        }
    }

    onMouseOut(evt) {
        if(this.timerPopup) {
            clearTimeout(this.timerPopup);
        }
        if(this.previousPanelElt && this.previousPanelElt.classList) {
            if(this.previousPanelElt.classList.contains("gp_item_selected")) {
                this.previousPanelElt.classList.remove("gp_item_selected");
            }
            this.previousPanelElt = undefined;
        }
        if(this.selectedNode) {
            this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
            this.selectedNode.style("border-width", "1px")
            this.selectedNode.style("border-color", "black")
            this.selectedNode = undefined;
        }
        if(this.autoHideModal && evt && evt.target && evt.target.id) {
            let entity_id = evt.target.id();
            if(entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(evt);
            }
        }
        this.timerPopup = undefined;
    }

    onMouseClick(evt) {
        if(this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if(entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(this.selectedEvent);
            }
            this.selectedEvent = undefined;
        }
        if(this.selectedNode) {
            this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
            this.selectedNode = undefined;
        }
        // console.log("Mouse click ", evt);
        // if(evt && evt.target && evt.target.id) {
        //     let entity_id = evt.target.id();
        //     if(entity_id.substr(0, 8) == "gomodel:") {
        //         this.nodeOut.emit(evt);
        //     }
        // }
        // if(this.selectedNode) {
        //     this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
        //     this.selectedNode = undefined;
        // }
        
        this.nodeClick.emit(evt);
    }

    onLayoutChange(evt) {
        if(this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if(entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(this.selectedEvent);
            }
            this.selectedEvent = undefined;
        }
        if(this.selectedNode) {
            this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
            this.selectedNode = undefined;
        }
        // this.cy.fit();
        // this.cy.center();
        this.layoutChange.emit(evt);
    }



    /** 
     * Before the component is rendered (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentWillLoad() {
        this.initDBXrefs();
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

    /** 
     * Method to open the current gocam model into noctua
    */
    openInNoctua() {
        window.open("http://noctua.geneontology.org/editor/graph/" + this.currentGraph.id(), "_blank");
    }

    /** 
     * Main render method; any change to a @Prop or @State triggers this
    */
    render() {
        let classes = this.loading ? "" : "gocam-viz";

        if(this.genesPanel && !this.genesPanel.parentCy) {
            this.genesPanel.parentCy = this.cy;
        }

        return [

            <div class="control__panel">
                {this.showGoCamSelector ? <wc-gocam-selector></wc-gocam-selector> : ""}                
                <button class='open__in_noctua__label' onClick={() => this.openInNoctua()}>Open in Noctua</button>
                <button class='reset__view' onClick={() => this.resetView()}>Reset View</button>
            </div>,

            this.loading ? <div class="gocam-viz-loader">Loading GO-CAM {this.gocamId} ...</div> : "",

            <div>
                <div id="gocam-viz" class={classes}></div>
                <wc-genes-panel ghandler={this.ghandler} ref={el => this.genesPanel = el}></wc-genes-panel>
            </div>,


            // <wc-light-modal ref={(el) => this.modal = el as HTMLWcLightModalElement}
            // modal-title="Title" modal-content="CONTENT"></wc-light-modal>
        ];

    }
    
}
