import { v4 as uuid } from 'uuid';
import { Activity } from './activity';

import { ActivityNode } from './activity-node';
import { Predicate } from './predicate';

export class Triple<T extends ActivityNode | Activity> {

  id
  object: T;
  predicate: Predicate;
  subject: T;

  constructor(subject: T, object: T, predicate: Predicate) {
    this.id = uuid();
    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
  }

  isTripleComplete() {
    return this.subject && this.object && this.predicate;
  }
}

export class ActivityTriple<T extends Activity> {
  objectId: string;
  predicateId: string;
  subjectId: string;
  id: string;
  title: string;
  triples: ActivityTriple<T>[];
  object: T;
  predicate: T;
  subject: T;

  constructor(subject: T, object: T, predicate: T) {

    this.id = uuid();
    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
  }



  getTripleIds() {
    return {
      subjectId: this.subject.id,
      predicateId: this.predicate.id,
      objectId: this.object.id
    }
  }

}

export interface TriplePair<T extends ActivityNode | Activity> {
  a: Triple<T> | undefined;
  b: Triple<T> | undefined;
}

export function compareTripleWeight(a: Triple<ActivityNode>, b: Triple<ActivityNode>): number {
  if (a.object.weight < b.object.weight) {
    return -1;
  } else {
    return 1;
  }
}
