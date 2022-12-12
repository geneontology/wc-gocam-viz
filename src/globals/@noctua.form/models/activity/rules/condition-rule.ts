
import { Rule } from './rule';

export class ConditionRule extends Rule {

  condition = false;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    super(name, label, description, url);
  }

}