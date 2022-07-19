import { Component, Prop, Element, Event, EventEmitter, Watch, getAssetPath, h } from '@stencil/core';
import { Listen, Method, State } from '@stencil/core';
import { graph as noctua_graph } from 'bbop-graph-noctua';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import dagre from 'cytoscape-dagre';
import { glyph, _node_labels, annotate, _folded_stack_gather } from '../../globals/utils';
import * as dbxrefs from "@geneontology/dbxrefs";
import '@geneontology/wc-light-modal';
import { Activity, ActivityType, Cam, NoctuaFormConfigService, NoctuaGraphService, Triple } from '../../globals/@noctua.form';

cytoscape.use(dagre);


@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.scss',
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

    configService = new NoctuaFormConfigService();
    graphService = new NoctuaGraphService(this.configService)
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
    @State() cam: Cam;

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
        'backgroundColor': 'data(backgroundColor)',
        'border-width': 1,
        'border-color': 'black',
        'font-size': 20,
        'min-zoomed-font-size': 1, //10,
        'text-valign': 'center',
        'color': 'black',
        'shape': "rectangle",
        'text-wrap': 'wrap',
        // 'text-overflow-wrap': "anywhere",
        'text-max-width': 'data(textwidth)'
    }

    // Default cytoscape edge styling
    defaultEdgeStyle = {
        //'content': 'data(label)',
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
        },
        dagre: {
            name: 'dagre',
            rankDir: 'TB',
            align: 'UR',
        },
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


    initCytoscape() {
        cytoscape.use(dagre);
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
        this.cam = undefined;
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
                this.cam = new Cam();
                this.cam.graph = new noctua_graph();
                this.cam.graph.load_data_basic(model);
                this.renderGoCam(gocamId, this.cam);
            }
        })
    }


    /**
     * Actual method to render the GO-CAM graph
     * @param gocamId valid gocam id (e.g. gomodel:xxx)
     * @param graph bbop graph
     * @param nest nesting strategy (default = "no")
     */
    renderGoCam(gocamId, cam: Cam, nest = "no", layout = 'dagre') {
        const self = this;
        this.currentGraph = cam.graph;
        this.graphService.loadCam(cam)

        const nodes = [];
        const edges = [];

        cam.activities.forEach((activity: Activity) => {
            if (activity.visible) {
                let el;
                if (activity.activityType === ActivityType.molecule) {
                    el = self.createMolecule(activity);
                } else {
                    el = self.createNode(activity);
                }
                nodes.push(el);
            }
        });

        cam.causalRelations.forEach((triple: Triple<Activity>) => {
            if (triple.predicate.visible && triple.isTripleComplete()) {
                const source = triple.predicate.isReverseLink ? triple.object : triple.subject;
                const target = triple.predicate.isReverseLink ? triple.subject : triple.object;
                let rglyph = glyph(triple.predicate.edge.id);

                const link = {
                    group: "edges",
                    data: {
                        id: triple.predicate.uuid,
                        source: source.id,
                        target: target.id,
                        label: triple.predicate.edge.label,
                        color: rglyph.color ? rglyph.color : "black",
                        glyph: rglyph.glyph ? rglyph.glyph : "circle",
                        lineStyle: rglyph.lineStyle ? rglyph.lineStyle : "solid",
                        width: rglyph.width ? rglyph.width : 2,
                    }
                };

                edges.push(link);
            }
        });

        const elements = { nodes, edges }

        this.renderCytoscape(cam, elements, layout);
    }

    createNode(activity: Activity) {

        const label = activity.gpNode?.term.label || activity.label || '';
        const el = {
            group: "nodes",
            data: {
                id: activity.id,
                label: label,
                width: Math.max(115, label.length * 11),
                textwidth: Math.max(115, label.length * 9),
                // link: ??
                // parent: ??
                "text-valign": "top",
                "text-halign": "left",
                "backgroundColor": activity.backgroundColor || 'white',
                // degree: (child * 10 + parent)
            }
        }

        return el
    }

    createMolecule(activity: Activity) {
        const moleculeNode = activity.rootNode;
        const label = moleculeNode?.term.label || activity.label || '';

        const el = {
            group: "nodes",
            data: {
                id: activity.id,
                label: label,
                width: Math.max(115, label.length * 11),
                textwidth: Math.max(115, label.length * 9),
                // link: ??
                // parent: ??
                "text-valign": "top",
                "text-halign": "left",
                "backgroundColor": activity.backgroundColor || 'white',
                // degree: (child * 10 + parent)
            }
        }

        return el
    }


    renderCytoscape(cam: Cam, elements, layout) {

        // Showing loading message
        let viz = this.gocamviz.querySelector("#gocam-viz");
        // viz.innerHTML = "";
        console.log("Displaying GO-CAM ", cam.id);

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
            // sel.style("background-color", "#eef2ff")
            this.selectedNode = sel;
        }
    }

    clearHighlight(cyNode) {
        if (cyNode) {
            cyNode.style("border-width", "1px");
            cyNode.style("border-color", "black");
            // cyNode.style("background-color", "white");
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

            const activity = this.cam.findActivityById(entity_id);
            // console.log("graph handler: " , activity);

            //this.cam.enrichActivity(activity);

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

        console.log(this.cam)
        let classes = this.loading ? "" : "gocam-viz";

        if (this.genesPanel && !this.genesPanel.parentCy) {
            this.genesPanel.parentCy = this.cy;
        }

        return [

            /*    <div>
                   {this.showGoCamSelector ?
                       <div class="control__panel">
                           {this.showGoCamSelector ? <wc-gocam-selector></wc-gocam-selector> : ""}
                           <button class='open__in_noctua__label button-gcv' onClick={() => this.openInNoctua()}>Open in Noctua</button>
                           <button class='reset__view button-gcv' onClick={() => this.resetView()}>Reset View</button>
                       </div>
                       : ""}
               </div>, */

            this.loading ? this.error ? "" : <div class="gocam-viz-loader">Loading GO-CAM {this.gocamId} ...</div> : "",


            <div id="gocam-viz-container" class="container">
                <div class="row align-items-start">
                    <div class="card col col-lg-8 p-0">
                        <div class="d-flex card-header gocam-card-header-md">
                            <h6 class="flex-grow-1">
                                {this.cam?.title}
                            </h6>

                            <button class='float-end btn btn-primary btn-sm' onClick={() => this.resetView()}>Reset View</button>

                        </div>
                        <div class="card-body p-0">
                            <div id="gocam-viz" class={classes}></div>
                        </div>
                    </div>
                    <div class="card col col-lg-4 p-0">
                        <div class="card-header gocam-h-md">
                            Processes and Activities
                        </div>
                        <div class="card-body p-0">
                            <wc-genes-panel id="gocam-viz-panel" class="" cam={this.cam} ref={el => this.genesPanel = el}></wc-genes-panel>
                        </div>
                    </div>
                </div>
            </div >,

            this.showLegend ? <img class="img-gcv" src={getAssetPath("./assets/legendv2.png")}></img> : ""

        ];

    }

}
