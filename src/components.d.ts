/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { GraphHandler } from "./globals/graphHandler";
export namespace Components {
    interface WcGenesPanel {
        /**
          * BBOP Graph Handler -> GO-CAM Must be provided to build the side panel
         */
        "ghandler": GraphHandler;
        /**
          * Passed by the parent to highlight & clear highlight nodes
         */
        "parentCy": any;
        "scrollToActivity": (nodeId: any) => Promise<void>;
    }
    interface WcGocamSelector {
    }
    interface WcGocamViz {
        /**
          * Deprecated for the moment
         */
        "autoHideModal": boolean;
        "gocamId": string;
        "graphFold": string;
        /**
          * Used to connect to a barista instance. By default, always access production (prod) server prod = http://barista.berkeleybop.org/ dev  = http://barista-dev.berkeleybop.org/
         */
        "repository": string;
        /**
          * Center the cytoscape graph to fit the whole graph
         */
        "resetView": () => Promise<void>;
        /**
          * Show/hide the activity in the activity node
         */
        "showActivity": boolean;
        /**
          * Show/hide the gene product in the activity node
         */
        "showGeneProduct": boolean;
        /**
          * If true, this will show the list of available GO-CAM in GO For more information, please refer to http://geneontology.org/docs/gocam-overview/
         */
        "showGoCamSelector": boolean;
        /**
          * Show/hide the input of an activity
         */
        "showHasInput": boolean;
        /**
          * Show/hide the output of an activity
         */
        "showHasOutput": boolean;
    }
}
declare global {
    interface HTMLWcGenesPanelElement extends Components.WcGenesPanel, HTMLStencilElement {
    }
    var HTMLWcGenesPanelElement: {
        prototype: HTMLWcGenesPanelElement;
        new (): HTMLWcGenesPanelElement;
    };
    interface HTMLWcGocamSelectorElement extends Components.WcGocamSelector, HTMLStencilElement {
    }
    var HTMLWcGocamSelectorElement: {
        prototype: HTMLWcGocamSelectorElement;
        new (): HTMLWcGocamSelectorElement;
    };
    interface HTMLWcGocamVizElement extends Components.WcGocamViz, HTMLStencilElement {
    }
    var HTMLWcGocamVizElement: {
        prototype: HTMLWcGocamVizElement;
        new (): HTMLWcGocamVizElement;
    };
    interface HTMLElementTagNameMap {
        "wc-genes-panel": HTMLWcGenesPanelElement;
        "wc-gocam-selector": HTMLWcGocamSelectorElement;
        "wc-gocam-viz": HTMLWcGocamVizElement;
    }
}
declare namespace LocalJSX {
    interface WcGenesPanel {
        /**
          * BBOP Graph Handler -> GO-CAM Must be provided to build the side panel
         */
        "ghandler"?: GraphHandler;
        "onSelectChanged"?: (event: CustomEvent<any>) => void;
        /**
          * Passed by the parent to highlight & clear highlight nodes
         */
        "parentCy"?: any;
    }
    interface WcGocamSelector {
        "onSelectGOCAM"?: (event: CustomEvent<any>) => void;
    }
    interface WcGocamViz {
        /**
          * Deprecated for the moment
         */
        "autoHideModal"?: boolean;
        "gocamId"?: string;
        "graphFold"?: string;
        "onLayoutChange"?: (event: CustomEvent<any>) => void;
        "onNodeClick"?: (event: CustomEvent<any>) => void;
        "onNodeOut"?: (event: CustomEvent<any>) => void;
        "onNodeOver"?: (event: CustomEvent<any>) => void;
        /**
          * Used to connect to a barista instance. By default, always access production (prod) server prod = http://barista.berkeleybop.org/ dev  = http://barista-dev.berkeleybop.org/
         */
        "repository"?: string;
        /**
          * Show/hide the activity in the activity node
         */
        "showActivity"?: boolean;
        /**
          * Show/hide the gene product in the activity node
         */
        "showGeneProduct"?: boolean;
        /**
          * If true, this will show the list of available GO-CAM in GO For more information, please refer to http://geneontology.org/docs/gocam-overview/
         */
        "showGoCamSelector"?: boolean;
        /**
          * Show/hide the input of an activity
         */
        "showHasInput"?: boolean;
        /**
          * Show/hide the output of an activity
         */
        "showHasOutput"?: boolean;
    }
    interface IntrinsicElements {
        "wc-genes-panel": WcGenesPanel;
        "wc-gocam-selector": WcGocamSelector;
        "wc-gocam-viz": WcGocamViz;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "wc-genes-panel": LocalJSX.WcGenesPanel & JSXBase.HTMLAttributes<HTMLWcGenesPanelElement>;
            "wc-gocam-selector": LocalJSX.WcGocamSelector & JSXBase.HTMLAttributes<HTMLWcGocamSelectorElement>;
            "wc-gocam-viz": LocalJSX.WcGocamViz & JSXBase.HTMLAttributes<HTMLWcGocamVizElement>;
        }
    }
}
