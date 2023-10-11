import { Component, Prop, Element, Event, EventEmitter, Watch, h, Method } from '@stencil/core';
import { State } from '@stencil/core';
import { Activity, ActivityNode, ActivityNodeType, Cam, Evidence, noctuaFormConfig } from '../../globals/@noctua.form';

/**
 * @part process - Process containers
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

    /**
     * Render the references of a GP but does not display "with" field for the moment
     * @param gp a gene product object (see graphHandler)
     */
    renderGeneReferences(gp) {
        return (
            <span>
                {
                    gp.evidences.map(evidence => {
                        return <a class='far fa-newspaper' href={evidence.url} target='_blank' title={"Source: " + evidence.source + "\nEvidence: " + evidence.evidences.map(ev => ev.label).join(",")}></a>
                    })
                }
            </span>
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
                        return <a class='far fa-newspaper' href={evidence.evidence.url} target='_blank'
                            title={"Source: " + evidence.reference + "\nEvidence: " + evidence.evidence.label}>E</a>
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
                <div class="process-label">
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
            node.type !== ActivityNodeType.GoMolecularFunction)
        );

        return (
            <div class="activity" id={"gp_item_" + activity.id} onClick={() => this.select(activity)} part="activity" >
                <div class='gene-product' part="gene-product">
                    {
                        activity.gpNode &&
                            <a href={activity.gpNode?.term.url} target='_blank'>{activity.gpNode?.term.label}</a>
                    }
                </div>
                {activity.mfNode &&
                    <div class='function'>
                        <div class='function-label' part="function-label">
                            <a href={activity.mfNode?.term.url} target='_blank'>
                                {activity.mfNode?.term.label}
                            </a>
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
