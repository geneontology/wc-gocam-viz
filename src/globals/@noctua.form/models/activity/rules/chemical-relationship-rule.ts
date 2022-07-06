
import { Rule } from './rule';

export class ChemicalRelationshipRule extends Rule {
  relation: any;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    super(name, label, description, url);
  }

}