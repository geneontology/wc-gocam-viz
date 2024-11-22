import { Evidence } from './evidence';
import { ActivityError, ErrorLevel, ErrorType } from './parser/activity-error';
import { Activity } from './activity';
import { Entity, EntityType } from './entity';
import { EntityLookup } from './entity-lookup';
import { Contributor } from './../contributor';
import { each, find, some } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';
import { Predicate } from './predicate';
import { PendingChange } from './pending-change';
import { CamStats } from './cam';

import * as EntityDefinition from './../../data/config/entity-definition';

export class GoCategory {
  id: ActivityNodeType;
  category: string;
  categoryType = 'isa_closure';
  suffix: string;
}

export enum ActivityNodeType {

  GoCellularComponent = 'GoCellularComponent',
  GoBiologicalProcess = 'GoBiologicalProcess',
  GoMolecularFunction = 'GoMolecularFunction',
  GoMolecularEntity = 'GoMolecularEntity',
  // extensions 
  GoCellularAnatomical = 'GoCellularAnatomical',
  GoProteinContainingComplex = 'GoProteinContainingComplex',
  GoBiologicalPhase = 'GoBiologicalPhase',
  GoChemicalEntity = 'GoChemicalEntity',
  GoCellTypeEntity = 'GoCellTypeEntity',
  GoAnatomicalEntity = 'GoAnatomicalEntity',
  GoOrganism = 'GoOrganism',
  WormLifeStage = "WormLifeStage",
  // extra internal use
  GoChemicalEntityHasInput = 'GoChemicalEntityHasInput',
  GoChemicalEntityHasOutput = 'GoChemicalEntityHasOutput',

  // evidence
  GoEvidence = 'GoEvidence',
  BPPhaseStageExistenceOverlaps = "BPPhaseStageExistenceOverlaps",
  BPPhaseStageExistenceStartsEnds = "BPPhaseStageExistenceStartsEnds",
  UberonStage = "UberonStage"
}

export interface ActivityNodeDisplay {
  id: string;
  rootTypes: Entity[];
  type: ActivityNodeType;
  label: string;
  uuid: string;
  isExtension: boolean;
  aspect: string;
  category: GoCategory[];
  displaySection: any;
  displayGroup: any;
  treeLevel: number;
  required: boolean;
  termRequired: boolean;
  visible: boolean;
  skipEvidenceCheck: boolean;
  showEvidence: boolean;
  isKey: boolean;
  weight: number;
  relationEditable: boolean;
  showInMenu: boolean;
  canDelete: boolean;
}

export class ActivityNode implements ActivityNodeDisplay {

  subjectId: string;
  entityType = EntityType.ACTIVITY_NODE
  type: ActivityNodeType;
  label: string;
  uuid: string;
  category: GoCategory[];
  rootTypes: Entity[] = [];
  term: Entity = new Entity('', '');
  date: string;
  termLookup: EntityLookup = new EntityLookup();
  isExtension = false;
  aspect: string;
  nodeGroup: any = {};
  activity: Activity;
  ontologyClass: any = [];
  isComplement = false;
  assignedBy: boolean = null;
  contributor: Contributor = null;
  isKey = false;
  displaySection: any;
  displayGroup: any;
  predicate: Predicate;
  treeLevel = 1;
  required = false;
  termRequired = false;
  visible = true;
  canInsertNodes;
  skipEvidenceCheck = false;
  showEvidence = true;
  errors = [];
  warnings = [];
  status = '0';
  weight: 0;
  relationEditable = false;
  showInMenu = false;
  insertMenuNodes = [];
  linkedNode = false;
  displayId: string;
  expandable: boolean = true;
  expanded: boolean = false;
  causalNode: boolean = false;
  frequency: number;
  canDelete: boolean = true;

  private _id: string;

  //For Save 
  pendingEntityChanges: PendingChange;
  pendingRelationChanges: PendingChange;

  chemicalParticipants = []


  constructor(activityNode?: Partial<ActivityNodeDisplay>) {
    if (activityNode) {
      this.overrideValues(activityNode);
    }
  }

  getTerm() {
    return this.term;
  }

  get id() {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    this.displayId = NoctuaFormUtils.cleanID(id);
  }

  get classExpression() {
    return this.term.classExpression;
  }

  set classExpression(classExpression) {
    this.term.classExpression = classExpression;
  }

  updateNodeType() {
    if (this.hasRootType(EntityDefinition.GoBiologicalProcess)) {
      this.type = ActivityNodeType.GoBiologicalProcess
    } else if (this.hasRootType(EntityDefinition.GoMolecularEntity)) {
      this.type = ActivityNodeType.GoMolecularEntity
    } else if (this.hasRootType(EntityDefinition.GoMolecularFunction)) {
      this.type = ActivityNodeType.GoMolecularFunction
    } else if (this.hasRootType(EntityDefinition.GoBiologicalProcess)) {
      this.type = ActivityNodeType.GoBiologicalProcess
    } else if (this.hasRootType(EntityDefinition.GoCellularComponent)) {
      this.type = ActivityNodeType.GoCellularComponent
    }
  }

  setTermOntologyClass(value) {
    this.ontologyClass = value;
  }

  toggleIsComplement() {
    const self = this;
    self.isComplement = !self.isComplement;
    self.nodeGroup.isComplement = self.isComplement;
  }

  setIsComplement(complement) {
    const self = this;
    self.isComplement = complement;
  }

  hasValue() {
    const self = this;
    return self.term.hasValue();
  }

  hasRootType(inRootType: GoCategory) {
    const found = find(this.rootTypes, (rootType: Entity) => {
      return rootType.id === inRootType.category;
    });

    return found ? true : false
  }

  hasRootTypes(inRootTypes: GoCategory[]) {
    let found = false;

    for (let i = 0; i < this.rootTypes.length; i++) {
      for (let j = 0; j < inRootTypes.length; j++) {
        if (this.rootTypes[i].id === inRootTypes[j].category) {
          found = true;
          break;
        }
      }
    }

    return found;
  }

  clearValues() {
    this.term.id = null;
    this.term.label = null;
    this.predicate.resetEvidence();
  }

  copyValues(node: ActivityNode) {
    this.uuid = node.uuid;
    this.term = node.term;
    this.assignedBy = node.assignedBy;
    this.isComplement = node.isComplement;
  }

  setTermLookup(value) {
    this.termLookup.requestParams = value;
  }

  setDisplay(value) {
    if (value) {
      this.displaySection = value.displaySection;
      this.displayGroup = value.displayGroup;
    }
  }

  enableRow() {
    let result = true;
    if (this.nodeGroup) {
      if (this.nodeGroup.isComplement && this.treeLevel > 0) {
        result = false;
      }
    }

    return result;
  }

  reviewTermChanges(stat: CamStats, modifiedStats: CamStats): boolean {
    const self = this;
    let modified = false;

    if (self.term.modified) {
      if (self.type === ActivityNodeType.GoMolecularEntity) {
        modifiedStats.gpsCount++;
        stat.gpsCount++;
      } else {
        modifiedStats.termsCount++;
        stat.termsCount++;
      }

      modified = true;
    }

    each(self.predicate.evidence, (evidence: Evidence, key) => {
      const evidenceModified = evidence.reviewEvidenceChanges(stat, modifiedStats);
      modified = modified || evidenceModified;
    });

    modifiedStats.updateTotal();
    return modified;
  }

  checkStored(oldNode: ActivityNode) {
    const self = this;

    if (oldNode && self.term.id !== oldNode.term.id) {
      self.term.termHistory.unshift(new Entity(oldNode.term.id, oldNode.term.label));
      self.term.modified = true;
    }

    each(self.predicate.evidence, (evidence: Evidence, key) => {
      const oldEvidence = oldNode?.predicate.getEvidenceById(evidence.uuid)
      evidence.checkStored(oldEvidence)
    });
  }

  addPendingChanges(oldNode: ActivityNode) {
    const self = this;

    if (self.term.id !== oldNode.term.id) {
      self.pendingEntityChanges = new PendingChange(self.uuid, oldNode.term, self.term);
    }

    if (self.predicate.edge.id !== oldNode.predicate.edge.id) {
      self.pendingRelationChanges = new PendingChange(self.uuid, oldNode.predicate.edge, self.predicate.edge);
    }

    each(self.predicate.evidence, (evidence: Evidence, key) => {
      const oldEvidence = oldNode.predicate.getEvidenceById(evidence.uuid)
      evidence.addPendingChanges(oldEvidence);
    });

    //this is temporary swap back into old
    //self.term = oldNode.term
  }

  enableSubmit(errors, validateEvidence = true) {
    const self = this;
    let result = true;

    if (self.termRequired && !self.term.id) {
      self.required = true;
      const meta = {
        aspect: self.label
      };
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, `"${self.label}" is required`, meta);
      errors.push(error);
      result = false;
    } else {
      self.required = false;
    }

    if (!self.skipEvidenceCheck && self.hasValue() && validateEvidence) {
      each(self.predicate.evidence, (evidence: Evidence, key) => {
        result = evidence.enableSubmit(errors, self, key + 1) && result;
      });
    }

    return result;
  }

  overrideValues(override: Partial<ActivityNodeDisplay> = {}) {
    Object.assign(this, override);
  }
}

export function categoryToClosure(categories: GoCategory[]) {

  let results = categories.map((category) => {
    let result
    if (category.categoryType === 'is_obsolete') {
      result = `${category.categoryType}:${category.category}`;
    } else {
      result = `${category.categoryType}:"${category.category}"`;
    }
    if (category.suffix) {
      result += ' ' + category.suffix;
    }
    return result
  }).join(' OR ');

  return results;
}

export function compareTerm(a: ActivityNode, b: ActivityNode) {
  return a.term.id === b.term.id;
}

export function compareNodeWeight(a: ActivityNode, b: ActivityNode): number {
  if (a.weight < b.weight) {
    return -1;
  } else {
    return 1;
  }
}

