
import { Rule } from './rule';

export class DirectnessRule extends Rule {
  directness: any;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    super(name, label, description, url);
  }

}