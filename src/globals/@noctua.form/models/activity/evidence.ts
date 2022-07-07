import { Entity, EntityType } from './entity';
import { ActivityNode } from './activity-node';
import { find, isEqual } from 'lodash';

import { noctuaFormConfig } from './../../noctua-form-config';
import { CamStats } from "./cam";
import { Contributor } from "../contributor";
import { Group } from "../group";
import { NoctuaFormUtils } from "../../utils/noctua-form-utils";

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
  frequency: number;
  date: string;
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

  checkStored(oldEvidence: Evidence) {
    const self = this;

    if (oldEvidence && self.evidence.id !== oldEvidence.evidence.id) {
      self.evidence.termHistory.unshift(new Entity(oldEvidence.evidence.id, oldEvidence.evidence.label));
      self.evidence.modified = true;
    }

    if (oldEvidence && self.reference !== oldEvidence.reference) {
      self.referenceEntity.termHistory.unshift(new Entity(oldEvidence.referenceEntity.id, oldEvidence.referenceEntity.label));
      self.referenceEntity.modified = true;

    }

    if (oldEvidence && self.with !== oldEvidence.with) {
      self.withEntity.termHistory.unshift(new Entity(oldEvidence.withEntity.id, oldEvidence.withEntity.label));
      self.withEntity.modified = true;
    }

  }


  public static formatReference(reference: string) {
    const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
    const db = DBAccession[0].trim();
    const accession = DBAccession[1].trim();

    return db + ':' + accession;
  }

  public static getReferenceNumber(reference: string) {
    const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
    const accession = DBAccession[1]?.trim();

    return accession;
  }

  public static checkReference(reference: string) {
    let result = false;

    if (reference.includes(':')) {
      const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
      const db = DBAccession[0].trim().toUpperCase();
      const accession = DBAccession[1].trim();
      const dbs = [
        noctuaFormConfig.evidenceDB.options.pmid,
        noctuaFormConfig.evidenceDB.options.doi,
        noctuaFormConfig.evidenceDB.options.goRef,
      ];

      const found = find(dbs, { name: db });
      const accessionFound = accession.length > 0;
      result = found && accessionFound;
    }

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
