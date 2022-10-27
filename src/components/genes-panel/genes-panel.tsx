import { Component, Prop, Element, Event, EventEmitter, Watch, h, Method } from '@stencil/core';
import { State } from '@stencil/core';
import { Activity, ActivityNode, ActivityNodeType, Cam, Evidence, noctuaFormConfig } from '../../globals/@noctua.form';


@Component({
    tag: 'wc-genes-panel',
    styleUrl: 'genes-panel.scss',
    shadow: false,
})
export class GenesPanel {

    @Element() GenesPanel;

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

            let activities = this.cam.activities;
            this.groupedActivities = this.cam.groupActivitiesByProcess();
            /*  this.cam.enrichActivities(activities)
                 .then((data) => {
                     // we sort activities by BP, as much as we can; ordered alphabetically and when no partOf = end of list
                     data.sort((a, b) => (a.partOf.length == 0) ?
                         1 : (b.partOf.length == 0) ?
                             -1 : (a.partOf[0].label < b.partOf[0].label) ?
                                 -1 : 1)
                     this.enrichedActivities = data;
                     // console.log("GenesPanel:EnrichedActivities: ", this.enrichedActivities);
                     this.groupedActivities = this.cam.groupActivitiesByProcess(this.enrichedActivities);
                     // console.log("GenesPanel:GroupedActivities: ", this.groupedActivities);
                 }) */
        }
    }



    @Method()
    async scrollToActivity(nodeId) {
        const scrollList = document.getElementById("genes-panel__list");
        const elt = document.getElementById("gp_item_" + nodeId);
        if (scrollList && elt) {
            scrollList.scroll(0, elt.offsetTop)
        }
    }

    select(activity) {
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
            // this.previousElt.style("background-color", "white")
            this.previousElt = undefined;
        }
    }


    highlightSelf(activityNode) {
        if (!activityNode.classList.contains("gocam-activity-card:hover")) {
            activityNode.classList.add("gocam-activity-card:hover");
        }
    }

    /**
     * Render the references of a GP but does not display "with" field for the moment
     * @param gp a gene product object (see graphHandler)
     */
    renderGeneReferences(gp) {
        return (
            <span class='reference-list'>
                {
                    gp.evidences.map(evidence => {
                        return <a class='a-gcv reference-article far fa-newspaper' href={evidence.url} target='_blank' title={"Source: " + evidence.source + "\nEvidence: " + evidence.evidences.map(ev => ev.label).join(",")}></a>
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
            <span class='reference-list'>
                {
                    evidences.map(evidence => {
                        return <a class='a-gcv reference-article far fa-newspaper' href={evidence.evidence.url} target='_blank'
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
            return <a class='a-gcv gocam-activity-card__title__gp__taxon' href={gp.taxonURL} target='_blank'></a>;
        }
        // otherwise parse and show it
        if (label.includes(" ")) {
            let split = label.split(" ");
            label = split[0].substring(0, 1) + "." + split[1];
        }
        return <a class='a-gcv gocam-activity-card__title__gp__taxon' href={gp.taxonURL} target='_blank'>{label}</a>;
    }

    renderProcess(process) {

        return (
            <div class="card gocam-process-card mb-5 gocam-activity-card__process">
                <div class="card-header gocam-activity-card__process__list">
                    <a href={process} class="a-gcv gocam-activity-card__process__list-name" target="_blank">{process}</a>
                </div>
                <div class="card-body p-0 gocam-activity-card__process__activities">
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
        const nodes = activity.nodes.filter((node: ActivityNode) => {
            return (node.displaySection.id === noctuaFormConfig.displaySection.fd.id &&
                node.type !== ActivityNodeType.GoMolecularFunction);
        });

        return (
            <div class="card mb-2 gocam-activity-card" id={"gp_item_" + activity.id} onClick={() => this.select(activity)} onMouseOver={() => this.highlight(activity.id)} onMouseOut={() => this.clearHighlight()} >
                <div class='card-header'>
                    {
                        activity.gpNode ?
                            <a class='a-gcv gocam-activity-card__title__gp' href={activity.gpNode?.term.url} target='_blank'>{activity.gpNode?.term.label}</a>
                            : ""
                    }
                </div>
                {activity.mfNode ?
                    <div class='card-body'>
                        <a class='a-gcv block-right' href={activity.mfNode?.term.url} target='_blank'>
                            {activity.mfNode?.term.label}
                        </a>
                        <ul class="list-group list-group-flush">

                            {nodes.map((node: ActivityNode) => {
                                return (
                                    <li class="list-group-item d-flex">
                                        <div class="gocam-node-relation d-flex align-items-center">
                                            <a class='' target='_blank' href="">{node.predicate?.edge.label}</a>
                                        </div>
                                        <div class="flex-grow-1 gocam-node-term">
                                            <a class='col' target='_blank' href={node.term.url}>{node.term.label}</a>
                                        </div>
                                        <div class="gocam-node-evidence">
                                            {this.renderReferences(node.predicate.evidence)}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    : ""}
            </div>
        )
    }

    render() {
        if (!this.cam || !this.groupedActivities) {
            return "";
        }

        return (
            <div class="genes-panel__list" id="genes-panel__list">
                {
                    Object.keys(this.groupedActivities).map((process) => {
                        return this.renderProcess(process);
                    })
                }
            </div>
        )

    }

}