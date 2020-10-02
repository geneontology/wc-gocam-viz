import { Component, Prop, Element, Watch, h } from '@stencil/core';

import cytoscape from 'cytoscape';


@Component({
    tag: 'wc-gocam-viz',
    styleUrl: 'gocam-viz.css',
    shadow: false,
})
export class GoCamViz {

    @Element() gocamviz;

    @Prop() gocamId: string;

    @Watch('gocamId')
    gocamIdChanged(newValue, oldValue) {
        if (newValue != oldValue) {
            this.loadGoCam(newValue);
        }
    }

    loadGoCam(gocamId) {
        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = "Loading GO-CAM (" + gocamId + ")";


        this.displayGoCam(null)
    }

    displayGoCam(gocam) {
        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = "";
        console.log("Displaying GO-CAM ", gocam);

        let cy = cytoscape({
            container: viz
        });

        cy.add({
            group: 'nodes',
            data: { weight: 75 },
            position: { x: 200, y: 200 }
        });

    }


    /** 
     * Before the component is rendered (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentWillLoad() {
    }

    /** 
     * Once the component has loaded (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentDidLoad() {
        this.loadGoCam(this.gocamId);
    }

    render() {
        return (
            <div id="gocam-viz" class="gocam-viz">
                Loading GO-CAM...
            </div>
        );
    }
}
