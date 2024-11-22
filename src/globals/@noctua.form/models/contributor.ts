import { EntityType } from "./activity/entity";

export class Contributor {
    entityType = EntityType.CONTRIBUTOR
    orcid: string;
    name?: string;
    initials?: string;
    color?: string;
    group?: any = {};
    cams?: number;
    _groups?: any = [];
    token?: string;
    frequency: number;


    set groups(groups) {
        this._groups = groups;

        if (groups && groups.length > 0) {
            this.group = groups[0];
        }
    }

    get groups() {
        return this._groups;
    }

    static fromResponse(response) {
        const user = new Contributor()
        user.orcid = response.uri;
        user.name = response.nickname;
        user.groups = response.groups;

        return user;
    }
}

export function compareContributor(a: Contributor, b: Contributor): number {
    if (a.name < b.name) {
        return -1;
    } else {
        return 1;
    }
}

export function equalContributor(a: Contributor, b: Contributor) {
    return a.orcid === b.orcid;
}
