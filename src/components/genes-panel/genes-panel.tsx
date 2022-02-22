import { Component, Prop, Element, Event, EventEmitter, Watch, h, Method } from '@stencil/core';
import { State } from '@stencil/core';
import { GraphHandler } from '../../globals/graph-handler';


@Component({
    tag: 'wc-genes-panel',
    styleUrl: 'genes-panel.css',
    shadow: false,
})
export class GenesPanel {

    @Element() GenesPanel;

    @Event({ bubbles: true, composed: true }) selectChanged: EventEmitter;


    /**
     * BBOP Graph Handler -> GO-CAM
     * Must be provided to build the side panel
     */
    @Prop() ghandler: GraphHandler

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

    // If the ghandler, should redraw
    @Watch('ghandler')
    ghandlerChanged(newValue, oldValue) {
        if (newValue != oldValue) {
            this.enrichedActivities = undefined;

            // if an undefined handler was provided, do nothing
            if (!this.ghandler) { return; }

            let activities = this.ghandler.getAllActivities();
            this.ghandler.enrichActivities(activities)
                .then((data) => {
                    // we sort activities by BP, as much as we can; ordered alphabetically and when no partOf = end of list
                    data.sort((a, b) => (a.partOf.length == 0) ?
                        1 : (b.partOf.length == 0) ?
                            -1 : (a.partOf[0].label < b.partOf[0].label) ?
                                -1 : 1)
                    this.enrichedActivities = data;
                    // console.log("GenesPanel:EnrichedActivities: ", this.enrichedActivities);
                    this.groupedActivities = this.ghandler.groupActivitiesByProcess(this.enrichedActivities);
                    // console.log("GenesPanel:GroupedActivities: ", this.groupedActivities);
                })
        }
    }



    @Method()
    async scrollToActivity(nodeId) {
        let scrollList = document.getElementById("genes-panel__list");
        let elt = document.getElementById("gp_item_" + nodeId);
        if (scrollList && elt) {
            scrollList.scroll(0, elt.offsetTop - 150)
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
            sel.style("background-color", "#eef2ff")
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
        if (!activityNode.classList.contains("genes-panel__item:hover")) {
            activityNode.classList.add("genes-panel__item:hover");
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
    renderReferences(context) {
        let pos = Array.from(Array(context.evidences.pmid.length).keys())
        return (
            <span class='reference-list'>
                {
                    pos.map(i => {
                        return <a class='a-gcv reference-article far fa-newspaper' href={context.evidences.url[i]} target='_blank' title={"Source: " + context.evidences.pmid[i] + "\nEvidence: " + context.evidences.label[i]}></a>
                    })
                }
            </span>
        )
    }

    renderTaxon(gp) {
        let label = gp.taxonLabel;
        // no label present for taxon
        if (!label) {
            return <a class='a-gcv genes-panel__item__title__gp__taxon' href={gp.taxonURL} target='_blank'></a>;
        }
        // otherwise parse and show it
        if (label.includes(" ")) {
            let split = label.split(" ");
            label = split[0].substring(0, 1) + "." + split[1];
        }
        return <a class='a-gcv genes-panel__item__title__gp__taxon' href={gp.taxonURL} target='_blank'>{label}</a>;
    }

    renderProcess(process) {
        // console.log("- rendering process: ", process);

        let item = process.id.length > 1 ? "¤ " : "";

        let tmp = [];
        for (let p = 0; p < process.id.length; p++) {
            tmp.push({
                id: process.id[p],
                url: process.url[p],
                label: process.label[p]
            })
        }

        return (
            <div class="genes-panel__item__process">
                <div class="genes-panel__item__process__list">
                    {
                        tmp.map(process => {
                            return <a href={process.url} class="a-gcv genes-panel__item__process__list-name" target="_blank">{item + process.label}</a>
                        })
                        // process.label.map(elt => {
                        //     return <a href={process.url} class="a-gcv genes-panel__item__process__list-name" target="_blank">{process.label}</a>
                        // }) 
                    }
                </div>

                <div class="genes-panel__item__process__activities">
                    {
                        process.activities.map(activity => {
                            return this.renderActivity(activity);
                        })
                    }
                </div>
            </div>
        )
    }

    renderActivity(activity) {
        let contexts = Object.keys(activity.biocontexts);
        return (
            <div class="genes-panel__item" id={"gp_item_" + activity.nodeId} onClick={() => this.select(activity)} onMouseOver={() => this.highlight(activity.nodeId)} onMouseOut={() => this.clearHighlight()} >

                <div class='genes-panel__item__title'>
                    {activity.geneProducts.length == 0 ?
                        <a class='a-gcv genes-panel__item__title__gp' href={activity.urls[0]} target='_blank'>{activity.labels[0]}</a>
                        : activity.geneProducts.map(gp => { return <a class='a-gcv genes-panel__item__title__gp' href={gp.url} target='_blank'>{gp.label}</a> })}
                    {activity.geneProducts.length == 0 ?
                        <span class='genes-panel__item__title__gp__taxon'></span>
                        : activity.geneProducts.map(gp => { return this.renderTaxon(gp) })}
                </div>

                <div class='genes-panel__item__activity__block'>
                    <a class='a-gcv genes-panel__item__activity block-right' href={activity.urls[0]} target='_blank'>{activity.labels[0]}</a> <span class="activity__references">{activity.geneProducts.map(gp => { return this.renderGeneReferences(gp) })}</span>
                    {contexts.map(context => {
                        if (context == "RO:0002333") { return; }
                        return (
                            <div>
                                {
                                    activity.biocontexts[context].map(ctx => {
                                        //                                                        console.log(context , ctx);
                                        return (
                                            <div>
                                                <a class='a-gcv block-left' target='_blank' href={ctx.relationURL}><i>{ctx.relationLabel}</i></a>
                                                <a class='a-gcv block-right' target='_blank' href={ctx.termURL}>{ctx.termLabel}</a>
                                                {this.renderReferences(ctx)}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // render() {

    //     if(!this.ghandler || !this.enrichedActivities) {
    //         return "";
    //     }

    //     return(
    //         <div class="genes-panel__container" id={"gpc_" + this.ghandler.getBBOPGraph().id()}>
    //             <div class="genes-panel__container__title">
    //                 <h1>Gene Products and Activities</h1>
    //                 <hr/>
    //             </div>
    //             <div class="genes-panel__list" id="genes-panel__list">
    //             {
    //                 this.enrichedActivities.map((activity) => {
    //                     return this.renderActivity(activity);
    //                 })
    //             }
    //             </div>
    //         </div>
    //     )

    // }



    render() {
        if (!this.ghandler || !this.groupedActivities) {
            return "";
        }

        console.log("GenesPanel:EnrichedActivities (render): ", this.enrichedActivities);
        console.log("GenesPanel:GraphHandler (render): ", this.ghandler);
        console.log("GenesPanel:GroupedActivities (render): ", this.groupedActivities);

        return (
            <div class="genes-panel__container" id={"gpc_" + this.ghandler.getBBOPGraph().id()}>
                <div class="genes-panel__container__title">
                    <h1 class="h1-gcv">Processes and Activities</h1>
                    <hr />
                </div>
                <div class="genes-panel__list" id="genes-panel__list">
                    {
                        this.groupedActivities.map((process) => {
                            return this.renderProcess(process);
                        })
                    }
                </div>
            </div>
        )

    }

}