export class Group {
    url: string;
    name: string;
    cams: number;
    contributors;
    contributorsCount?: number;

    constructor(url?: string, name?: string) {
        this.url = url;
        this.name = name;
    }
}

export function compareGroup(a: Group, b: Group): number {
    if (a.name < b.name) {
        return -1;
    } else {
        return 1;
    }
}