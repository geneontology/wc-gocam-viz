import { Entity, EntityType } from './entity';
import { isEqual } from 'lodash';
import { Contributor } from "../contributor";
import { Group } from "../group";
import { PendingChange } from "./pending-change";

export class EvidenceExt {
  term: Entity;
  relations: Entity[] = [];
}

export class Evidence {
  entityType = EntityType.EVIDENCE;
  edge: Entity;
  evidence: Entity = new Entity('', '');
  referenceEntity: Entity = new Entity('', '');
  withEntity: Entity = new Entity('', '');
  reference: string;
  referenceUrl: string;
  with: string;
  groups: Group[] = [];
  contributors: Contributor[] = [];
  classExpression;
  uuid;
  evidenceRequired = false;
  referenceRequired = false;
  ontologyClass = [];
  pendingEvidenceChanges: PendingChange;
  pendingReferenceChanges: PendingChange;
  pendingWithChanges: PendingChange;
  frequency: number;
  date: string;
  formattedDate: string
  evidenceExts: EvidenceExt[] = [];


  constructor() {

  }

  hasValue() {
    const self = this;

    return self.evidence.id && self.reference;
  }

  setEvidenceOntologyClass(value) {
    this.ontologyClass = value;
  }

  setEvidence(value: Entity, classExpression?) {
    this.evidence = value;

    if (classExpression) {
      this.classExpression = classExpression;
    }
  }

  clearValues() {
    const self = this;

    self.setEvidence(new Entity('', ''));
    self.reference = '';
    self.with = '';
  }

  isEvidenceEqual(evidence) {
    const self = this;
    let result = true;

    result = result && isEqual(self.evidence, evidence.evidence);
    result = result && isEqual(self.reference, evidence.reference);
    result = result && isEqual(self.with, evidence.with);

    return result;
  }
}

export function compareEvidence(a: Evidence, b: Evidence) {
  return a.evidence.id === b.evidence.id
    && a.reference === b.reference
    && a.with === b.with;
}

export function compareEvidenceEvidence(a: Evidence, b: Evidence) {
  return a.evidence.id === b.evidence.id;
}

export function compareEvidenceReference(a: Evidence, b: Evidence) {
  return a.reference === b.reference;
}

export function compareEvidenceWith(a: Evidence, b: Evidence) {
  return a.with === b.with;
}

export function compareEvidenceDate(a: Evidence, b: Evidence) {
  return a.date === b.date;
}
