
import { Activity } from './activity';
import { Entity, EntityType } from './entity';
import { Contributor } from './../contributor';
import { find } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';
import { Predicate } from './predicate';

export interface GoCategory {
  id: ActivityNodeType;
  category: string;
  categoryType: string;
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
  visible: boolean;
  isKey: boolean;
  weight: number;
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
  isExtension = false;
  aspect: string;
  nodeGroup: any = {};
  activity: Activity;
  isComplement = false;
  closures: any = [];
  assignedBy: boolean = null;
  contributor: Contributor = null;
  isKey = false;
  displaySection: any;
  displayGroup: any;
  predicate: Predicate;
  treeLevel = 1;
  visible = true;
  canInsertNodes;
  showEvidence = true;
  weight: 0;
  insertMenuNodes = [];
  displayId: string;
  expanded: boolean = false;
  causalNode: boolean = false;
  frequency: number;

  private _id: string;


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
    const self = this;
    self.term.id = null;
    self.term.label = null;
    self.predicate.resetEvidence();
  }

  copyValues(node: ActivityNode) {
    const self = this;
    self.uuid = node.uuid;
    self.term = node.term;
    self.assignedBy = node.assignedBy;
    self.isComplement = node.isComplement;
  }


  setDisplay(value) {
    if (value) {
      this.displaySection = value.displaySection;
      this.displayGroup = value.displayGroup;
    }
  }

  overrideValues(override: Partial<ActivityNodeDisplay> = {}) {
    Object.assign(this, override);
  }
}

export function categoryToClosure(categories) {
  return categories.map((category) => {
    let result = `${category.categoryType}:"${category.category}"`;
    if (category.suffix) {
      result += ' ' + category.suffix;
    }
    return result
  }).join(' OR ');
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

