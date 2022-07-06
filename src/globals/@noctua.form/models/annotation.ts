import { Activity } from "./activity/activity";
import { ActivityNode } from "./activity/activity-node";
import { Cam } from "./activity/cam";

export interface Annotation {
    id: number;
    name: string;
    detail: string;
    parent_id: number;
    leaf: boolean;
}

export class AnnotationNode {
    id: number;
    node: Activity | ActivityNode
    leaf: boolean;
    level: number;
    visible: boolean;
    expandable: boolean;
    children: AnnotationNode[];

    constructor(node: Activity | ActivityNode) {
        this.node = node;
    }
}

export class AnnotationFlatNode {
    constructor(
        public id: number,
        public node: Activity | ActivityNode,
        public leaf: boolean,
        public visible: boolean,
        public expandable: boolean,
        public level: number) { }
}
