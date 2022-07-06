
import { Rule } from './rule';

export class ActivityRelationshipRule extends Rule {
  relation: any;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    super(name, label, description, url);
  }

}