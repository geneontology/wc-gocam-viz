import { Component, Prop, Element, Event, EventEmitter, Watch, h, Method } from '@stencil/core';
import { State } from '@stencil/core';
import { Activity, ActivityNode, Cam, Evidence, noctuaFormConfig } from '../../globals/@noctua.form';

/**
 * @part process - Process containers
 * @part process-label - Process label
 * @part activity - Activity containers
 * @part gene-product - Gene product labels
 * @part function-label - Molecular function labels
 */
@Component({
    tag: 'wc-genes-panel',
    styleUrl: 'genes-panel.scss',
    shadow: true,
})
export class GenesPanel {

    @Element() hostElement;

    @Event({ bubbles: true, composed: true }) selectChanged: EventEmitter;


    /**
     * BBOP Graph Handler -> GO-CAM
     * Must be provided to build the side panel
     */
    @Prop() cam: Cam

    /**
     * Passed by the parent to highlight & clear highlight nodes
     */
    @Prop() parentCy;

    @State() enrichedActivities;

    @State() groupedActivities;

    componentWillLoad() {
    }

    componentDidLoad() {
    }

    // If the cam, should redraw
    @Watch('cam')
    camChanged(newValue, oldValue) {
        if (newValue != oldValue) {
            this.enrichedActivities = undefined;

            // if an undefined handler was provided, do nothing
            if (!this.cam) { return; }

            this.groupedActivities = this.cam.groupActivitiesByProcess();
        }
    }



    @Method()
    async highlightActivity(nodeId) {
        const elt = this.hostElement.shadowRoot.getElementById("gp_item_" + nodeId);
        if (this.hostElement && elt) {
            const cardEl = this.hostElement.shadowRoot.querySelectorAll('.activity')
            for (let i = 0; i < cardEl.length; i++) {
                cardEl[i].classList.remove('active')
            }
            elt.classList.add("active")
            this.hostElement.scroll(0, elt.offsetTop - this.hostElement.offsetTop)
        }
    }

    select(activity) {
        this.clearHighlight()
        this.selectChanged.emit(activity);
    }

    previousElt = undefined;
    highlight(nodeId) {
        // console.log("highlight-child: ", this.parentCy, nodeId);
        let sel = this.parentCy.elements('[id="' + nodeId + '"]')
        if (sel.size() > 0) {
            sel.style("border-width", "2px")
            sel.style("border-color", "blue")
            //  sel.style("background-color", "#eef2ff")
            this.previousElt = sel;
        }
    }

    clearHighlight() {
        if (this.previousElt) {
            this.previousElt.style("border-width", "1px")
            this.previousElt.style("border-color", "black")
            this.previousElt.style("background-color", "white")
            this.previousElt = undefined;
        }
    }


    highlightSelf(activityNode) {
        if (!activityNode.classList.contains("gocam-activity:hover")) {
            activityNode.classList.add("gocam-activity:hover");
        }
    }

    renderReferenceIcon() {
        // SVG originally from https://icons.getbootstrap.com/icons/newspaper/
        // Modified to remove the width and height attributes in order to allow the size to be
        // controlled via CSS
        return (
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-newspaper icon" viewBox="0 0 16 16">
                <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5z" />
                <path d="M2 3h10v2H2zm0 3h4v3H2zm0 4h4v1H2zm0 2h4v1H2zm5-6h2v1H7zm3 0h2v1h-2zM7 8h2v1H7zm3 0h2v1h-2zm-3 2h2v1H7zm3 0h2v1h-2zm-3 2h2v1H7zm3 0h2v1h-2z" />
            </svg>
        )
    }

    /**
     * Render the references for a biological context
     * @param context a biological context (see graphHandler)
     */
    renderReferences(evidences: Evidence[]) {
        return (
            <span>
                {
                    evidences.map(evidence => {
                        if (!evidence.reference) {
                            return null; // for extreme case
                        }
                        return <a href={evidence.referenceEntity?.url} target='_blank'
                            title={"Source: " + evidence.reference + "\nEvidence: " + evidence.evidence.label}>
                            {this.renderReferenceIcon()}
                        </a>
                    })
                }
            </span>
        )
    }

    renderTaxon(gp) {
        let label = gp.taxonLabel;
        // no label present for taxon
        if (!label) {
            return <a href={gp.taxonURL} target='_blank'></a>;
        }
        // otherwise parse and show it
        if (label.includes(" ")) {
            let split = label.split(" ");
            label = split[0].substring(0, 1) + "." + split[1];
        }
        return <a href={gp.taxonURL} target='_blank'>{label}</a>;
    }

    renderProcess(process) {

        return (
            <div class="process" part="process">
                <div class="process-label" part="process-label">
                    {process}
                </div>
                <div class="process-activities">
                    {
                        this.groupedActivities[process].map(activity => {
                            return this.renderActivity(activity);
                        })
                    }
                </div>
            </div>
        )
    }

    renderActivity(activity: Activity) {
        const nodes = activity.nodes.filter((node: ActivityNode) => (
            node.predicate?.edge?.id !== '' && node.predicate?.edge?.id !== noctuaFormConfig.edge.enabledBy.id)
        );

        return (
            <div class="activity" id={"gp_item_" + activity.id} onClick={() => this.select(activity)} part="activity" >
                <div class='gene-product' part="gene-product">
                    {
                        activity.gpNode &&
                        <a href={activity.gpNode?.term.url} target='_blank'>{activity.gpNode?.term.label}</a>
                    }
                </div>
                {activity.rootNode &&
                    <div class='function'>
                        <div class='function-label' part="function-label">
                            <div class="node-term">
                                <a href={activity.rootNode?.term.url} target='_blank'>
                                    {activity.rootNode?.term.label}
                                </a>
                            </div>
                            <div class="node-evidence">
                                {this.renderReferences(activity.rootNode.predicate.evidence)}
                            </div>
                        </div>
                        <div class="function-nodes">
                            {nodes.map((node: ActivityNode) => {
                                return (
                                    <div class='node'>
                                        <div class="node-relation">
                                            <a target='_blank' href="">{node.predicate?.edge.label}</a>
                                        </div>
                                        <div class="node-term">
                                            <a target='_blank' href={node.term.url}>{node.term.label}</a>
                                        </div>
                                        <div class="node-evidence">
                                            {this.renderReferences(node.predicate.evidence)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                }
            </div>
        )
    }

    render() {
        if (!this.cam || !this.groupedActivities) {
            return null;
        }

        return (
            Object.keys(this.groupedActivities).map((process) => {
                return this.renderProcess(process);
            })
        )

    }

}
