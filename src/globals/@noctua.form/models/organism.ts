export class Organism {
    taxonIri: string;
    taxonName?: string;
    cams?: number;
}

export function compareOrganism(a: Organism, b: Organism): number {
    if (a.taxonName < b.taxonName) {
        return -1;
    } else {
        return 1;
    }
}