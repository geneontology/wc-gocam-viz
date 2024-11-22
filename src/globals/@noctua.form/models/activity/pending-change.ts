import { Entity } from "./entity";

export class PendingChange {

    constructor(
        public uuid: string,
        public oldValue: Entity,
        public newValue: Entity,
    ) {

    }
}