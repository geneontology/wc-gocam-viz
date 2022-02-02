import { Component, Prop, Element, Event, EventEmitter, Watch, getAssetPath, h } from '@stencil/core';
import { Listen, Method, State } from '@stencil/core';

import { graph as noctua_graph } from 'bbop-graph-noctua';

import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

import { glyph, _node_labels, annotate, _folded_stack_gather } from '../../globals/utils';

import * as dbxrefs from "@geneontology/dbxrefs";

import '@geneontology/wc-light-modal';
import { GraphHandler } from '../../globals/graph-handler';
import { GenesPanel } from '../genes-panel/genes-panel';



cytoscape.use(coseBilkent);


@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.css',
    shadow: false,
    assetsDirs: ['assets']
})
export class GoCamViz {

    @Element() gocamviz;
    genesPanel: HTMLWcGenesPanelElement;

    /**
     * ID of the gocam to be shown in this widget. Look for the watcher below that will load
     * the GO-CAM upon a change of this variable
     */
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

    /**
     * Show/hide isolated activity (not connected through causals)
     */
    @Prop() showIsolatedActivity: boolean = false;

    /**
     * Show/hide default legend
     */
    @Prop() showLegend: boolean = true;

    @Prop() graphFold: string = "editor";

    /**
     * Deprecated for the moment
     */
    @Prop() autoHideModal: boolean = false;

    /**
     * Indicates if the component is loading some data
     */
    @State() loading: boolean = false;

    /**
     * Indicates if the component has encountered an error while loading some data
     */
    @State() error: boolean = false;

    // variables for bbop graph
    currentGraph = undefined;

    cy = undefined;             // container of the cytoscape.js graph

    dbXrefsReady = false;       // check if dbxrefs is initialized

    /**
     * Base URL used to fetch gocam as bbop graph
     */
    apiUrl = "https://api.geneontology.xyz/gocam/";

    devBaristaUrl = 'http://barista-dev.berkeleybop.org/search/stored?id=';

    productionBaristaUrl = 'http://barista.berkeleybop.org/search/stored?id=';

    noctuaGraphURL = {
        prod: "http://noctua.geneontology.org/editor/graph/",
        dev: "http://noctua-dev.berkeleybop.org/editor/graph/",
        release: "http://noctua.geneontology.org/editor/graph/",
    };

    /**
     * Used to connect to a barista instance. By default, always access production (prod) server
     * prod = http://barista.berkeleybop.org
     * dev  = http://barista-dev.berkeleybop.org
     */
    @Prop() repository: string = 'release';

    /**
     * This state is updated whenever loading a new graph, in order to trigger a new rendering of genes-panel
     */
    @State() ghandler: GraphHandler;

    @Watch('repository')
    changeRepository(newValue, oldValue) {
        const isNotString = typeof newValue !== 'string';
        if (isNotString) { throw new Error('repository: not string') };
        if (newValue !== oldValue) {
            this.repository = newValue
        }
    }


    // Variables for handling click and mouse over
    selectedNode = undefined;
    selectedEvent = undefined;
    timerPopup = undefined;
    delayPopup = 400;


    // Default cytoscape node styling
    defaultNodeStyle = {
        'content': 'data(label)',
        'width': 'data(width)',
        'height': 55,
        'background-color': 'white',
        'border-width': 1,
        'border-color': 'black',
        'font-size': 20,
        'min-zoomed-font-size': 1, //10,
        'text-valign': 'center',
        'color': 'black',
        'shape': "round-rectangle",
        'text-wrap': 'wrap',
        // 'text-overflow-wrap': "anywhere",
        'text-max-width': 'data(textwidth)'
    }

    // Default cytoscape edge styling
    defaultEdgeStyle = {
        // 'content': 'data(label)',
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
        'width': 'data(width)'
    }


    // Cytoscape layouts
    layout_opts = {
        'cose': {
            name: 'cose',
            padding: 10,
            animate: true,
            'directed': true,
            'fit': true
        },
        'cose-bilkent': {
            name: 'cose-bilkent',
            padding: 10,
            quality: "proof", // default, draft
            nodeDimensionsIncludeLabels: true,
            randomize: true,
            spacingFactor: 0.8,
            idealEdgeLength: 90,
            edgeElasticity: 0.45,
            // gravity: 0.25,
            // gravityRange: 3.8,
            gravityCompound: 1.0,
            gravityRangeCompound: 1.5,
            numIter: 2500,
            nodeRepulsion: 45000,
            // coolingFactor: 0.9,
            // minTemp: 1.0            
            tile: true, // tile disconnected nodes
            fit: true
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
            sort: function (a, b) {
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


    // Events triggered by this component
    @Event({ eventName: 'nodeOver', cancelable: true, bubbles: true }) nodeOver: EventEmitter;
    @Event({ eventName: 'nodeOut', cancelable: true, bubbles: true }) nodeOut: EventEmitter;
    @Event({ eventName: 'nodeClick', cancelable: true, bubbles: true }) nodeClick: EventEmitter;
    @Event({ eventName: 'layoutChange', cancelable: true, bubbles: true }) layoutChange: EventEmitter;



    /**
     * Called whenever an activity has been selected from the genes-panel
     */
    @Listen('selectChanged', { target: "body" })
    newSelection(event: CustomEvent) {
        if (event.detail) {
            let data = event.detail;
            this.cy.zoom(1);
            this.center(data.nodeId);
        }
    }

    /**
     * Called whenever there is a selection of a new GO-CAM
     * See for instance gocam-selector.selectGOCAM()
     * @param event must contain a detail { id: xxx } where xxx is the new GO-CAM id
     */
    @Listen('selectGOCAM', { target: "body" })
    selectGOCAM(event: CustomEvent) {
        if (event.detail) {
            let data = event.detail;
            this.gocamId = data.id; // this trigger the gocamIdChanged below
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
    relations_nestable = {};
    relations_strippable = {
        "BFO:0000050": true,    // part of
        "BFO:0000051": true,    // has part
        "RO:0002220": true,     // adjacent to
        "BFO:0000066": true,    // occurs in
        "RO:0012005": true     // is small molecule activator
    };


    initCytoscape() {
        cytoscape.use(coseBilkent);
    }

    /** 
     * Init the GO dbxrefs.yaml, in order to build URL meta
    */
    initDBXrefs() {
        dbxrefs.init(() => {
            // console.log("dbxrefs ready");
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
        if (!gocamId.startsWith("gomodel:")) {
            gocamId = "gomodel:" + gocamId;
        }
        this.loading = true;
        this.error = false;
        this.ghandler = undefined;
        let url = ''

        if (this.repository === 'prod') {
            url = this.productionBaristaUrl + gocamId;
        } else if (this.repository === 'dev') {
            url = this.devBaristaUrl + gocamId;
        } else if (this.repository === 'release') {
            url = this.apiUrl + gocamId + "/raw"
        }

        fetch(url).then(data => {
            return data.json();
        }).catch(err => {
            console.error("Error while fetching gocam ", url);
        }).then(graph => {
            let model = (this.repository === 'release') ? graph : graph.activeModel;
            if (model) {
                let ngraph = new noctua_graph();
                ngraph.load_data_basic(model);
                this.renderGoCam(gocamId, ngraph);
            }
        })
    }


    /**
     * Actual method to render the GO-CAM graph
     * @param gocamId valid gocam id (e.g. gomodel:xxx)
     * @param graph bbop graph
     * @param nest nesting strategy (default = "no")
     */
    renderGoCam(gocamId, graph, nest = "no", layout = 'cose-bilkent') {

        this.currentGraph = graph;
        this.ghandler = new GraphHandler(this.currentGraph);
        this.ghandler.setDBXrefs(dbxrefs);


        let activities = this.ghandler.getAllActivities();
        this.ghandler.enrichActivities(activities)
            .then((data) => {

                let elements = [];

                // 1 - create the nodes
                for (let enrichedActivity of data) {

                    let label = "";
                    if (enrichedActivity.geneProducts.length > 0) {
                        label = enrichedActivity.geneProducts.map(elt => elt.label).join(" | ");
                    } else {
                        label = enrichedActivity.labels.join(" | ");
                    }

                    let eanode = {
                        group: "nodes",
                        data: {
                            id: enrichedActivity.nodeId,
                            label: label,
                            width: Math.max(115, label.length * 11),
                            textwidth: Math.max(115, label.length * 9),
                            // link: ??
                            // parent: ??
                            "text-valign": "top",
                            "text-halign": "left",
                            "background-color": this.defaultNodeStyle["background-color"],
                            // degree: (child * 10 + parent)
                        }
                    }
                    elements.push(eanode);
                }

                // 2 - create the edges
                for (let enrichedActivity of data) {
                    let connected = this.ghandler.getCausalActivities(enrichedActivity, data);
                    // console.log("activity ", enrichedActivity, " is connected to ", connected);
                    let relids = Object.keys(connected)
                    for (let relid of relids) {
                        let targets = connected[relid];
                        let rglyph = glyph(relid);

                        for (let target of targets) {
                            // console.log("target: ", target);
                            let ed = {
                                group: "edges",
                                data: {
                                    id: target.relationId,
                                    source: enrichedActivity.nodeId,
                                    target: target.activity.nodeId,
                                    label: rglyph.label ? rglyph.label : target.relationLabel,
                                    color: rglyph.color ? rglyph.color : "black",
                                    glyph: rglyph.glyph ? rglyph.glyph : "circle",
                                    lineStyle: rglyph.lineStyle ? rglyph.lineStyle : "solid",
                                    width: rglyph.width ? rglyph.width : this.defaultEdgeStyle.width
                                }
                            };
                            // console.log("ED: ", ed);
                            elements.push(ed);
                        }
                    }
                }

                this.renderCytoscape(gocamId, graph, elements, layout);
            });

    }

    renderCytoscape(gocamId, graph, elements, layout) {

        // Showing loading message
        let viz = this.gocamviz.querySelector("#gocam-viz");
        // viz.innerHTML = "";
        console.log("Displaying GO-CAM ", gocamId, graph);

        // Creating the cytoscape component
        this.cy = cytoscape({
            container: viz,
            elements: elements,
            layout: this.layout_opts[layout],

            style: [
                {
                    selector: 'node',
                    style: this.defaultNodeStyle
                },
                {
                    selector: 'edge',
                    style: this.defaultEdgeStyle
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


        // Binding mouse events
        this.cy.on("mouseover", evt => this.onMouseOver(evt));
        this.cy.on("mouseout", evt => this.onMouseOut(evt));
        this.cy.on("click", evt => this.onMouseClick(evt));

        // Events whenever the layout is changes, eg to remove modal
        this.cy.on("pan", evt => this.onLayoutChange(evt));
        this.cy.on("zoom", evt => this.onLayoutChange(evt));
        this.cy.on("viewport", evt => this.onLayoutChange(evt));
        this.cy.on("resize", evt => this.onLayoutChange(evt));

        if (this.genesPanel) {
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
        if (sel.size() > 0) {
            sel.style("border-width", "2px")
            sel.style("border-color", "blue")
            sel.style("background-color", "#eef2ff")
            this.selectedNode = sel;
        }
    }

    clearHighlight(cyNode) {
        if (cyNode) {
            cyNode.style("border-width", "1px");
            cyNode.style("border-color", "black");
            cyNode.style("background-color", "white");
        }
    }


    center(nodeId) {
        let sel = this.cy.elements('[id="' + nodeId + '"]')
        if (sel.size() > 0) {
            this.cy.center(sel);
        }
    }

    /**
     * If desired, this can render a pop up with information about the gene & its activity
     * @param evt 
     */
    showPopup(evt) {
        if (evt && evt.target && evt.target.id) {
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

            if (entity_id.substr(0, 8) == "gomodel:") {
                let data = evt.target.data();
                let node = this.currentGraph.get_node(entity_id);
                let labels = [];
                for (let ann of node.annotations()) {
                    if (ann.key() == "rdfs:label") {
                        labels.push(ann.value());
                    }
                }

                // this concern the activity itself
                let standardTypes = node.types();
                let inferredTypes = node.get_unique_inferred_types();

                // this will detect the associated biological context
                let subgraph = node.subgraph();
                let biocontext = {};
                let hook_list = []
                if (subgraph) {
                    // Do it both ways--upstream and downstream.
                    _folded_stack_gather(node, this.currentGraph, subgraph, 'standard', hook_list, biocontext, dbxrefs);
                    _folded_stack_gather(node, this.currentGraph, subgraph, 'reverse', hook_list, biocontext, dbxrefs);
                    // convert to array
                    for (let key of Object.keys(biocontext)) {
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
                let annotationMap = {};
                for (let ann of annotations) {
                    if (ann.key() == "evidence") {
                        let cs = new Set();
                        if (ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if (ann.key() == "rdfs:label") {
                        let cs = new Set();
                        if (ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if (ann.key() == "contributor") {
                        let cs = new Set();
                        if (ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    } else if (ann.key() == "providedBy") {
                        let cs = new Set();
                        if (ann.key() in annotationMap) {
                            cs = annotationMap[ann.key()]
                        } else {
                            annotationMap[ann.key()] = cs;
                        }
                        cs.add(ann.value());
                    }
                }
                // convert to array
                for (let key of Object.keys(annotationMap)) {
                    annotationMap[key] = Array.from(annotationMap[key]);
                }
                // console.log("node annotations: ", annotationMap);

                let id = data.link && data.link._class_id ? data.link.class_id() : undefined
                let meta = annotate(id, dbxrefs);
                meta.then(metaData => {
                    let payload = {
                        entityId: entity_id,
                        id: id,
                        uri: id ? "https://www.alliancegenome.org/gene/" + id : undefined,
                        annotation: annotationMap,
                        biocontext: biocontext,
                        meta: metaData,
                        label: data.label,
                        data: data.link,
                        standardTypes: standardTypes,
                        inferredTypes: inferredTypes,
                        x: evt.renderedPosition.x,
                        y: evt.renderedPosition.y
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

    /**
     * Define if the GO-CAM viz should capture the mouse scroll
     * @param shouldAF set to true if you want a mouse scroll to be captured by the component
     */
    @Method()
    async setAutoFocus(shouldAF) {
        this.cy.userZoomingEnabled(shouldAF);
    }

    isAutoFocusing() {
        return this.cy.userZoomingEnabled;
    }


    previousPanelElt = undefined;
    onMouseOver(evt) {
        // we don't need that timeout anymore since it's not showing pop up but just highlighting
        // this.timerPopup = setTimeout(() => this.showPopup(evt), this.delayPopup);

        if (evt && evt.target && evt.target.id) {
            this.highlight(evt.target.id());
            this.selectedNode = evt.target;
            this.selectedEvent = evt;
        }

        if (evt.target && evt.target.length) {

            let elt = document.getElementById("gp_item_" + evt.target.id());
            if (elt && !elt.classList.contains("gp_item_selected")) {
                elt.classList.add("gp_item_selected");
                this.previousPanelElt = elt;
            }

            if (this.genesPanel) {

                let scrollList = document.getElementById("genes-panel__list");
                let elt2 = document.getElementById("gp_item_" + evt.target.id());
                if (scrollList && elt2) {
                    scrollList.scroll(0, elt2.offsetTop - 220);
                    elt2.style["box-shadow"] = "2px 2px 5px 6px rgb(194 194 255)";
                }

                // this.genesPanel.scrollToActivity(evt.target.id());
            }

        }
    }

    onMouseOut(evt) {
        if (this.timerPopup) {
            clearTimeout(this.timerPopup);
        }
        if (this.previousPanelElt && this.previousPanelElt.classList) {
            if (this.previousPanelElt.classList.contains("gp_item_selected")) {
                this.previousPanelElt.classList.remove("gp_item_selected");
                this.previousPanelElt.style["box-shadow"] = "";

            }
            this.previousPanelElt = undefined;
        }
        if (this.selectedNode) {
            this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
            this.selectedNode.style("border-width", "1px")
            this.selectedNode.style("border-color", "black")
            this.selectedNode = undefined;
        }
        if (this.autoHideModal && evt && evt.target && evt.target.id) {
            let entity_id = evt.target.id();
            if (entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(evt);
            }
        }
        this.timerPopup = undefined;
    }

    onMouseClick(evt) {
        if (this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if (entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(this.selectedEvent);
            }
            this.selectedEvent = undefined;
        }
        if (this.selectedNode) {
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
        if (this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if (entity_id.substr(0, 8) == "gomodel:") {
                this.nodeOut.emit(this.selectedEvent);
            }
            this.selectedEvent = undefined;
        }
        if (this.selectedNode) {
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
        window.open(this.noctuaGraphURL[this.repository] + this.currentGraph.id(), "_blank");
    }

    /** 
     * Main render method; any change to a @Prop or @State triggers this
    */
    render() {
        let classes = this.loading ? "" : "gocam-viz";

        if (this.genesPanel && !this.genesPanel.parentCy) {
            this.genesPanel.parentCy = this.cy;
        }

        return [

            <div>
                {this.showGoCamSelector ?
                    <div class="control__panel">
                        {this.showGoCamSelector ? <wc-gocam-selector></wc-gocam-selector> : ""}
                        <button class='open__in_noctua__label button-gcv' onClick={() => this.openInNoctua()}>Open in Noctua</button>
                        <button class='reset__view button-gcv' onClick={() => this.resetView()}>Reset View</button>
                    </div>
                    : ""}
            </div>,

            this.loading ? this.error ? "" : <div class="gocam-viz-loader">Loading GO-CAM {this.gocamId} ...</div> : "",

            <div id="gocam-viz-container">
                <div id="gocam-viz" class={classes}></div>
                <wc-genes-panel id="gocam-viz-panel" ghandler={this.ghandler} ref={el => this.genesPanel = el}></wc-genes-panel>
            </div>,

            this.showLegend ? <img class="img-gcv" src={getAssetPath("./assets/legendv2.png")}></img> : ""

        ];

    }

}
