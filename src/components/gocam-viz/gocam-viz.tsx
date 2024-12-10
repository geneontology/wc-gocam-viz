import { Component, Host, Prop, Element, Event, EventEmitter, Watch, h } from '@stencil/core';
import { Listen, Method, State } from '@stencil/core';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import * as dbxrefs from "@geneontology/dbxrefs";
import {
    Activity, ActivityType, Cam,
    ActivityNodeType,
    NoctuaFormConfigService,
    NoctuaGraphService,
    Triple
} from '../../globals/@noctua.form';
import { glyph } from '../../globals/relations';



cytoscape.use(dagre);

const GOMODEL_PREFIX = "gomodel:"

/**
 * @part gocam-panel - The panel containing the GO-CAM graph and legend
 * @part gocam-title - The GO-CAM title
 * @part gocam-graph - The GO-CAM graph container
 * @part activities-panel - The panel containing the process and activities list
 * @part process - A process group in the process and activities list
 * @part activity - An activity in the process and activities list
 * @part gene-product - A gene product name in process and activities list
 * @part function-label - A function term name in process and activities list
 * @part legend-header - The header of the legend
 * @part legend-section - A group of entries in the legend
 */
@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.scss',
    shadow: true,
})
export class GoCamViz {

    @Element() gocamviz;
    genesPanel: HTMLWcGenesPanelElement;
    graphDiv: HTMLDivElement;

    /**
     * ID of the GO-CAM to be shown in this widget. If provided, the GO-CAM will automatically
     * be fetched using this ID and the value of the `api-url` prop. If omitted, data will
     * not automatically be fetched, but can be provided via the `setModelData` method. This may
     * be useful if the host page already has the GO-CAM data.
     */
    @Prop() gocamId: string;

    /**
     * The url used to fetch GO-CAM graphs. Any occurrence of %ID in the string will be replaced
     * by the GO-CAM ID.
     */
    @Prop() apiUrl: string = "https://api.geneontology.org/api/go-cam/%ID";

    /**
     * Show/hide default legend
     */
    @Prop() showLegend: boolean = true;

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
     * This state is updated whenever loading a new graph, in order to trigger a new rendering of genes-panel
     */
    @State() cam: Cam;

    @State() title: string;

    @State() expandComplex = false;

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

    // Default cytoscape node styling
    defaultParentStyle = {
        'content': 'data(label)',
        'width': 'data(width)',
        'height': 55,
        'backgroundColor': 'data(backgroundColor)',
        'border-width': 1,
        'border-color': 'black',
        'font-size': 12,
        'min-zoomed-font-size': 1, //10,
        'text-valign': 'top',
        'text-halign': 'center',
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
        cola: {}
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
            this.gocamId = data.id; // this trigger the watchGoCamIdAndApiUrl below
        }
    }

    // If the GO-CAM ID or API URL is changed, update the current graph to the new gocam
    @Watch('gocamId')
    @Watch('apiUrl')
    watchGoCamIdAndApiUrl(newValue: string, oldValue: string, propName: string) {
        if (newValue !== oldValue) {
            this.loadGoCam();
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
    async initDBXrefs() {
        await dbxrefs.init();
        this.dbXrefsReady = true;
    }

    /**
     * Will request the gocam from the bbop manager; if manager approves, will trigger renderGoCam
     */
    loadGoCam() {
        if (!this.gocamId || !this.apiUrl) {
            return
        }

        this.graphDiv.innerHTML = ""
        this.loading = true;
        this.error = false;
        this.cam = undefined;

        let gocamCurie = this.gocamId;
        if (!gocamCurie.startsWith(GOMODEL_PREFIX)) {
            gocamCurie = GOMODEL_PREFIX + gocamCurie;
        }
        const url = this.apiUrl.replace('%ID', gocamCurie);

        fetch(url).then(data => {
            return data.json();
        }).catch(err => {
            console.error("Error while fetching gocam ", url);
        }).then(graph => {
            let model = graph.activeModel ?? graph;
            if (model) {
                this.setModelData(model);
            }
        })
    }


    renderGoCam(cam: Cam, expandComplex = false, layout = 'dagre') {
        const self = this;

        const nodes = [];
        const edges = [];

        cam.activities.forEach((activity: Activity) => {
            if (activity.visible) {
                let el
                if (activity.activityType === ActivityType.molecule) {
                    el = self.createMolecule(activity);
                } else if (activity.activityType === ActivityType.proteinComplex) {
                    el = self.createComplex(activity, expandComplex);
                } else {
                    el = self.createNode(activity);
                }
                nodes.push(...el);
            }
        });

        cam.causalRelations.forEach((triple: Triple<Activity>) => {
            if (triple.predicate.visible && triple.isTripleComplete() && this.configService.isAllowedEdge(triple.predicate.edge.id)) {
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
        const geneShorthand = this.configService.getGeneShorthand(label)

        const el = {
            group: "nodes",
            data: {
                id: activity.id,
                label: geneShorthand,
                width: Math.max(115, geneShorthand.length * 11),
                textwidth: Math.max(115, geneShorthand.length * 9),
                // link: ??
                // parent: ??
                "text-valign": "top",
                "text-halign": "left",
                "backgroundColor": activity.backgroundColor || 'white',
                // degree: (child * 10 + parent)
            }
        }

        return [el]
    }

    createComplex(activity: Activity, expandComplex = false): any[] {

        const label = activity.gpNode?.term.label || activity.label || '';

        let el
        // result.push(el)
        if (expandComplex) {

            const edges = activity.getEdges(ActivityNodeType.GoProteinContainingComplex)

            const gps = edges.map(edge => {
                const geneShorthand = this.configService.getGeneShorthand(edge.object.term?.label)
                return geneShorthand
            });
            const truncatedGps = gps.slice(0, 3)
            let geneString = gps.join(', ')

            if (gps.length > truncatedGps.length) {
                geneString += ' and ' + (gps.length - truncatedGps.length).toString() + ' more'
            }
            el = {
                group: "nodes",
                data: {
                    id: activity.id,
                    label: `${geneString}`,
                    height: 200,
                    width: Math.max(115, geneString.length * 11),
                    textwidth: Math.max(115, geneString.length * 9),
                    "backgroundColor": activity.backgroundColor || 'white',
                    // degree: (child * 10 + parent)
                }
            }


        } else {
            el = {
                group: "nodes",
                data: {
                    id: activity.id,
                    label: label,
                    width: Math.max(115, label.length * 11),
                    textwidth: Math.max(115, label.length * 9),
                    "backgroundColor": activity.backgroundColor || 'white',
                    // degree: (child * 10 + parent)
                }
            }
        }
        // result.push(...gps)
        return [el]

    }

    createMolecule(activity: Activity) {
        const moleculeNode = activity.rootNode;
        const label = moleculeNode?.term.label || activity.label || '';
        const geneShorthand = this.configService.getGeneShorthand(label) ?? label

        const el = {
            group: "nodes",
            data: {
                id: activity.id,
                label: geneShorthand,
                width: Math.max(115, geneShorthand.length * 11),
                textwidth: Math.max(115, geneShorthand.length * 9),
                // link: ??
                // parent: ??
                "text-valign": "top",
                "text-halign": "left",
                "backgroundColor": activity.backgroundColor || 'white',
                // degree: (child * 10 + parent)
            }
        }

        return [el]
    }


    renderCytoscape(cam: Cam, elements, layout) {
        // Creating the cytoscape component
        this.cy = cytoscape({
            container: this.graphDiv,
            elements: elements,
            layout: this.layout_opts[layout],
            style: [
                {
                    selector: 'node',
                    style: this.defaultNodeStyle
                },
                {
                    selector: ':parent',
                    style: this.defaultParentStyle
                },
                {
                    selector: 'edge',
                    style: this.defaultEdgeStyle
                },
                {
                    selector: 'edge',
                    style: {
                        ...this.defaultEdgeStyle,
                        'arrow-shape': function (edge) {
                            return {
                                width: 3,
                                height: 3,
                                name: 'custom-tee-circle',
                                path: 'M 0,0 m -1,-1 l 2,0 l 0,2 l -2,0 z M 2,0 a 1,1 0 1,0 2,0 a 1,1 0 1,0 -2,0'
                            };
                        }
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


        // Binding mouse events
        // this.cy.on("mouseover", evt => this.onMouseOver(evt));
        // this.cy.on("mouseout", evt => this.onMouseOut(evt));
        this.cy.nodes().on("click", evt => this.onMouseClick(evt));

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
     * Center the cytoscape graph to fit the whole graph
    */
    @Method()
    async resetView() {
        this.cy.fit();
        this.cy.center();
    }

    @Method()
    async toggleComplex() {
        this.expandComplex = !this.expandComplex;
        this.renderGoCam(this.cam, this.expandComplex);
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

    /**
     * Manually supply GO-CAM data to be rendered. This will overwrite any data previously
     * fetched using the gocamId and apiUrl props, if they were provided.
     *
     * @param model GO-CAM object
     */
    @Method()
    async setModelData(model) {
        this.cam = this.graphService.getCam(model)
        this.currentGraph = this.cam.graph;
        this.renderGoCam(this.cam, this.expandComplex);
    }

    isAutoFocusing() {
        return this.cy.userZoomingEnabled;
    }

    scrollDiv(parent, elt) {
        const findPosition = (obj) => {
            var currenttop = 0;
            if (obj.offsetParent) {
                do {
                    currenttop += obj.offsetTop;
                } while ((obj = obj.offsetParent));
                return currenttop;
            }
        }

        parent.scroll(0, findPosition(elt));
    }



    previousPanelElt = undefined;
    onMouseOver(evt) {

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
        if (evt && evt.target && evt.target.id) {
            let entity_id = evt.target.id();
            if (entity_id.startsWith(GOMODEL_PREFIX)) {
                this.nodeOut.emit(evt);
            }
        }
        this.timerPopup = undefined;
    }

    onMouseClick(evt) {
        if (this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if (entity_id.startsWith(GOMODEL_PREFIX)) {
                this.nodeOut.emit(this.selectedEvent);
            }
            this.selectedEvent = undefined;
        }

        if (this.selectedNode) {
            this.selectedNode.style("background-color", this.defaultNodeStyle["background-color"]);
            this.selectedNode = undefined;
        }

        if (this.genesPanel) {
            this.genesPanel.highlightActivity(evt.target.id());
        }

        this.nodeClick.emit(evt);
    }

    onLayoutChange(evt) {
        if (this.selectedEvent) {
            let entity_id = this.selectedEvent.target.id();
            if (entity_id.startsWith(GOMODEL_PREFIX)) {
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
    async componentWillLoad() {
        await this.initDBXrefs();
        this.initCytoscape();
    }

    /**
     * Once the component has loaded (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentDidLoad() {
        this.loadGoCam();

        // Cytoscape's renderer initialization code includes a step where it walks up the DOM
        // tree from the cytoscape container (this.graphDiv here) following `parentNode`
        // attributes and attaches event listeners to each element is passes[1]. It assumes that
        // it can reach the HTML document root doing this. However, that's not a valid
        // assumption when the cytoscape container is in a shadow DOM host (this.gocamviz here).
        // From the outside, the host's `parentNode` attribute is null. Someone reported a
        // different issue to cytoscape that also involves hosting it in a shadow DOM element,
        // but it didn't get much traction[2]. So here we help cytoscape out by setting up the event
        // listeners that it won't be able to reach.
        // [1] https://github.com/cytoscape/cytoscape.js/blob/3.16.x/src/extensions/renderer/base/load-listeners.js#L326-L342
        // [2] https://github.com/cytoscape/cytoscape.js/issues/3133
        let element: Node = this.gocamviz;
        const invalidateCoordsCache = () => this.cy?.renderer().invalidateContainerClientCoordsCache();
        while (element != null) {
            element.addEventListener('transitionend', invalidateCoordsCache);
            element.addEventListener('animationend', invalidateCoordsCache);
            element.addEventListener('scroll', invalidateCoordsCache);
            element = element.parentNode;
        }
    }

    /**
     * Main render method; any change to a @Prop or @State triggers this
    */
    render() {

        if (this.genesPanel && !this.genesPanel.parentCy) {
            this.genesPanel.parentCy = this.cy;
        }

        return (
            <Host>
                <div class="panel w-8" part="gocam-panel">
                    <div class="panel-header">
                        <div part="gocam-title">{this.cam?.title}</div>
                        <div class="gocam-panel-header-buttons">
                            <button onClick={() => this.toggleComplex()}>
                                {this.expandComplex ? 'Collapse Protein Complexes' : 'Expand Protein Complexes'}
                            </button>
                            <button onClick={() => this.resetView()}>Reset View</button>
                        </div>
                    </div>
                    <div class="panel-body">
                        <div class="gocam-graph" part="gocam-graph" ref={(el) => this.graphDiv = el}>
                            {this.loading &&
                                <go-loading-spinner message={`Loading GO-CAM ${this.gocamId}`}></go-loading-spinner>
                            }
                        </div>
                        {this.showLegend && (
                            <wc-gocam-legend exportparts="header : legend-header, section : legend-section" />
                        )}
                    </div>
                </div>

                <div class="panel w-4" part="activities-panel">
                    <div class="panel-header">
                        Processes and Activities
                    </div>
                    <div class="panel-body">
                        <wc-genes-panel
                            cam={this.cam}
                            exportparts="process, activity, gene-product, function-label"
                            ref={el => this.genesPanel = el}
                        >
                        </wc-genes-panel>
                    </div>
                </div>
            </Host>
        );
    }
}
