import { Component, Prop, Element, Event, EventEmitter, Watch, h } from '@stencil/core';
import { State } from '@stencil/core';
import { GraphHandler } from '../../globals/graphHandler';

// import { graph as noctua_graph } from 'bbop-graph-noctua';
// import minerva_manager from 'bbop-manager-minerva';
// import barista_response from 'bbop-response-barista';
// import { jquery as jquery_engine } from 'bbop-rest-manager';


// import { glyph, _node_labels, annotate, _folded_stack_gather } from '../../globals/utils';

// import * as dbxrefs from "@geneontology/dbxrefs";

// import '@geneontology/wc-light-modal';



@Component({
    tag: 'wc-genes-panel',
    styleUrl: 'genes-panel.css',
    shadow: false,
})
export class GenesPanel {

    @Element() GenesPanel;

    @Event({ bubbles: true, composed: true }) selectChanged: EventEmitter;


    // must be provided to build the side panel - see gocam-viz component
    @Prop() ghandler : GraphHandler

    @State() enrichedActivities;

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
            if(!this.ghandler) { return; }

            let activities = this.ghandler.getAllActivities();
            this.ghandler.enrichActivities(activities)
            .then((data) => {
                this.enrichedActivities = data;
            })            
        }
    }



    select(activity) {
        this.selectChanged.emit(activity);
    }


    renderReferences(context) {
        let pos = Array.from(Array(context.evidences.pmid.length).keys())
        return(
            <span class='reference-list'>
                {
                    pos.map(i => {
                        return <a class='reference-article far fa-newspaper' href={context.evidences.url[i]} target='_blank' title={"Source: " + context.evidences.pmid[i] + "\nEvidence: " + context.evidences.label[i]}></a>
                    })
                }
            </span>
        )
    }

    render() {

        if(!this.ghandler || !this.enrichedActivities) {
            return "";
        }
      
        return(
            <div class="genes-panel__container">
                <div style={{"padding":"1rem"}}>
                <h1>Gene Products and Activities</h1>
                <hr/>
                </div>
                {
                    this.enrichedActivities.map((activity) => {
                        let contexts = Object.keys(activity.biocontexts);
                        return (
                            <div class="genes-panel__item" onClick={() => this.select(activity) }>
                                <div class='genes-panel__item__title'>
                                    {activity.geneProducts.length == 0 ? "N/A" : activity.geneProducts.map(gp => { return <a class='genes-panel__item__title__gp' href={gp.url} target='_blank'>{gp.label}</a> })}
                                </div> 

                                <div class='genes-panel__item__gene__block'>
                                    <div><span class='block-left not-clickable'>Gene</span>{activity.geneProducts.length == 0 ? <span class='block-right'>N/A</span> : activity.geneProducts.map(gp => { return <a class='genes-panel__item__title__gp block-right' href={gp.url} target='_blank'>{gp.label}</a> })}</div>
                                    <div><span class='block-left not-clickable'>Taxon</span>{activity.geneProducts.length == 0 ? <span class='block-right'>N/A</span> : activity.geneProducts.map(gp => { return <a class='genes-panel__item__title__gp block-right' href={gp.taxonURL} target='_blank'>{gp.taxonLabel}</a> })}</div>
                                </div>
                                
                                <div class='genes-panel__item__activity__block'>
                                    <span class='block-left not-clickable'>Activity</span><a class='genes-panel__item__activity block-right' href={activity.urls[0]} target='_blank'>{activity.labels[0]}</a>
                                    {contexts.map(context => {
                                        if(context == "RO:0002333") { return ;}
                                        return (
                                            <div>
                                                {
                                                    activity.biocontexts[context].map(ctx => {
//                                                        console.log(context , ctx);
                                                        return (
                                                            <div>
                                                                <span class='block-left'></span>
                                                                <a class='block-left' target='_blank' href={ctx.relationURL}><i>{ctx.relationLabel}</i></a>
                                                                <a class='block-right' target='_blank' href={ctx.termURL}>{ctx.termLabel}</a>
                                                                { this.renderReferences(ctx) }
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
                    })
                }
            </div>
        )

    }

}