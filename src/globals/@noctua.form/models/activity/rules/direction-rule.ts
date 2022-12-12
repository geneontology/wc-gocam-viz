
import { Rule } from './rule';

export class DirectionRule extends Rule {
  direction: any;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    super(name, label, description, url);
  }

}