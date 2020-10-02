import { Component, Prop, Element, Watch, h } from '@stencil/core';

import { graph as noctua_graph } from 'bbop-graph-noctua';
import minerva_manager from 'bbop-manager-minerva';
import barista_response from 'bbop-response-barista';
import { jquery as jquery_engine } from 'bbop-rest-manager';

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



        // var engine = new jquery_engine(barista_response);
        // engine.method('POST');
        // var manager = new minerva_manager(global_barista_location,
        //                   global_minerva_definition_name,
        //                   user_token, engine, 'async');
    


        // manager.register('manager_error', function(resp, man) {
        // });

        // manager.register('warning', function(resp, man) {
        // });

        // manager.register('error', function(resp, man) {
        // });

    //     manager.register('rebuild', function(resp, man){
    //         ll('rebuild callback');
	// // Noctua graph.
	// graph = new noctua_graph();
    // graph.load_data_basic(resp.data());
    //     });

	// // Ready a new request.
	// var reqs = new minerva_requests.request_set(manager.user_token(),
	// 					    ecore.get_id());

	// // Add the individual itself to the request.
	// var ind = ecore.get_node(tid);
	// var cloned_ind_id = add_with_types(reqs, ind);

	// // Next, collect anything in the subgraph.
    // var subgr = ind.subgraph();
	// Trigger the delete--hopefully consistent.
	//manager.remove_individual(ecore.get_id(), tid);
	// manager.request_with(reqs);    

    engine;
    initEngine() {
        // let engine = new sync_request(barista_response);
        this.engine = new jquery_engine(barista_response);
        this.engine.method('POST');
        console.log("engine: " , this.engine);
    }

    manager;
    initManager() {
        let global_barista_location = "http://barista.berkeleybop.org/";
        let global_minerva_definition_name = "minerva_public";
        let user_token = "qfmsf7j12312v0ihr17j";

        this.manager = new minerva_manager(global_barista_location, global_minerva_definition_name, user_token, this.engine, "async");
        
        this.manager.register('rebuild', (resp, man) => {
            console.log("rebuild: ", resp , man);
            let graph = new noctua_graph();
            graph.load_data_basic(resp.data());
            this.renderGoCam(this.gocamId, graph);
        });
        this.manager.register('meta', function(resp, man){
            console.log(resp);
        });
        this.manager.register('manager_error', function(resp, man){
            console.error(resp);
        });
        this.manager.register('error', function(resp, man){
            console.error(resp);
        });
        this.manager.register('warning', function(resp, man){
            console.log(resp);
        });
        console.log("manager: " , this.manager);
    }

    loadGoCam(gocamId) {
        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = "Loading GO-CAM (" + gocamId + ")";

        this.manager.get_model(gocamId);


    }

    renderGoCam(gocamId, graph) {
        let viz = this.gocamviz.querySelector("#gocam-viz");
        viz.innerHTML = "";
        console.log("Displaying GO-CAM ", gocamId , graph);

        let cy = cytoscape({
            container: viz
        });

        cy.add({
            group: 'nodes',
            data: { weight: 75 },
            position: { x: 200, y: 200 }
        });


        cy.on("mouseover", this.onMouseOver);
        cy.on("mouseout", this.onMouseOut);
    }

    onMouseOver(evt) {
        console.log("cy over ", evt);
    }

    onMouseOut(evt) {
        console.log("cy out ", evt);
    }


    /** 
     * Before the component is rendered (executed once)
     * https://stenciljs.com/docs/component-lifecycle
    */
    componentWillLoad() {
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

    render() {
        return (
            <div id="gocam-viz" class="gocam-viz">
                Loading GO-CAM...
            </div>
        );
    }
}
