import { noctuaFormConfig } from './../../noctua-form-config';
import { Activity, ActivitySortField, ActivityType } from './activity'
import { ActivityNode, ActivityNodeType } from './activity-node';
import { Group } from '../group';
import { Contributor } from '../contributor';
import { Evidence } from './evidence';
import { Triple } from './triple';
import { Entity } from './entity';
import { each, find, orderBy, groupBy } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';
import { PendingChange } from './pending-change';

export enum ReloadType {
  RESET = 'reset',
  STORE = 'store'
}

export enum CamRebuildSignal {
  NONE = 'none',
  MERGE = 'merge',
  REBUILD = 'rebuild'
}

export enum CamOperation {
  NONE = 'none',
  ADD_ACTIVITY = 'add_activity',
  ADD_CAUSAL_RELATION = 'add_causal_relation'
}

export class CamQueryMatch {
  modelId?: string;
  terms?: Entity[] = [];
  reference?: Entity[] = [];
}

export class CamSortBy {
  field: ActivitySortField = ActivitySortField.GP
  label = "";
  ascending = true;
}


export class CamStats {
  totalChanges = 0;
  camsCount = 0;
  termsCount = 0;
  gpsCount = 0;
  evidenceCount = 0;
  referencesCount = 0;
  withsCount = 0;
  relationsCount = 0;

  constructor() { }

  updateTotal() {
    this.totalChanges =
      this.termsCount
      + this.gpsCount
      + this.evidenceCount
      + this.referencesCount
      + this.withsCount
      + this.relationsCount;
  }
}

export class CamLoadingIndicator {
  status = false;
  message = ''

  constructor(status = false, message = '') {
    this.status = status;
    this.message = message;
  }

  reset() {
    this.status = false;
    this.message = '';
  }
}

export class Cam {
  title: string;
  comments: string[] = [];
  state: any;
  groups: Group[] = [];
  contributors: Contributor[] = [];
  groupId: any;
  expanded = false;
  model: any;
  //connectorActivities: ConnectorActivity[] = [];
  causalRelations: Triple<Activity>[] = [];
  sortBy: CamSortBy = new CamSortBy();
  error = false;
  date: string;
  modified = false;
  modifiedStats = new CamStats();
  matchedCount = 0;
  queryMatch = new CamQueryMatch();
  dateReviewAdded = Date.now();


  //bbop graphs
  graph;
  storedGraph;
  pendingGraph;

  // bbop managers 
  baristaClient;
  engine;
  manager;
  copyModelManager;
  artManager;
  groupManager;
  replaceManager;

  // Display 

  /**
   * Used for HTML id attribute
   */
  displayId: string;
  moreDetail = false;
  displayNumber = '1';

  displayType;


  loading = new CamLoadingIndicator(false)

  // Error Handling
  isReasoned = false;
  hasViolations = false;

  //Graph
  manualLayout = false;
  layoutChanged = false;

  private _filteredActivities: Activity[] = [];
  activities: Activity[] = [];
  storedActivities: Activity[] = [];
  private _id: string;

  constructor() {

  }

  get id() {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    this.displayId = NoctuaFormUtils.cleanID(id);
  }

  updateSortBy(field: ActivitySortField, label: string) {
    this.sortBy.field = field
    this.sortBy.label = label
  }

  toggleExpand() {
    this.expanded = !this.expanded;
  }

  groupActivitiesByProcess() {
    const groupedActivities = groupBy(this.activities, (activity: Activity) => {
      if (activity.activityType === ActivityType.molecule) {
        return 'Small Molecules';
      }

      return activity.bpNode ? activity.bpNode.term.label : 'No Process Assigned'
    })

    return groupedActivities;
  }


  expandAllActivities(expand: boolean) {
    const self = this;

    each(self.activities, (activity: Activity) => {
      activity.expanded = expand;
    });
  }

  getCausalRelation(subjectId: string, objectId: string): Triple<Activity> {
    const self = this;

    return self.causalRelations.find((triple: Triple<Activity>) => {
      if (triple.predicate?.isReverseLink) {
        return triple.object?.id === subjectId && triple.object?.id === subjectId;
      }
      return triple.subject?.id === subjectId && triple.object?.id === objectId;
    })
  }

  clearHighlight() {
    const self = this;

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        node.term.highlight = false;
        each(node.predicate.evidence, (evidence: Evidence) => {
          evidence.evidence.highlight = false;
          evidence.referenceEntity.highlight = false;
          evidence.withEntity.highlight = false;
        });
      });
    });
  }

  findNodeById(uuid, activities: Activity[]): ActivityNode {
    const self = this;
    let found
    each(activities, (activity) => {
      found = find(activity.nodes, (node: ActivityNode) => {
        return node.uuid === uuid;
      });

      if (found) {
        return false;
      }
    })

    return found;
  }

  findActivityById(id) {
    const self = this;

    return find(self.activities, (activity) => {
      return activity.id === id;
    });
  }

  findActivityByNodeUuid(nodeId): Activity[] {
    const self = this;

    const result: Activity[] = [];

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        if (node.uuid === nodeId) {
          result.push(activity)
        }
        each(node.predicate.evidence, (evidence: Evidence) => {
          if (evidence.uuid === nodeId) {
            result.push(activity)
          }
        });
      });
    });
    return result;
  }

  checkStored() {
    const self = this;

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        // node.term.highlight = false;
        const oldNode: ActivityNode = self.findNodeById(node.uuid, self.storedActivities)
        node.checkStored(oldNode)
      });
    });
  }

  applyFilter() {
    const self = this;

    self.clearHighlight();

    if (self.queryMatch && self.queryMatch.terms.length > 0) {
      self._filteredActivities = [];
      self.matchedCount = 0;

      each(self.activities, (activity: Activity) => {
        let match = false;
        each(activity.nodes, (node: ActivityNode) => {
          each(self.queryMatch.terms, (term) => {

            if (node.term.uuid === term.uuid) {
              node.term.highlight = true;
              node.term.activityDisplayId = term.activityDisplayId = activity.displayId;

              self.matchedCount += 1;
              match = true;
            }
          });

          each(node.predicate.evidence, (evidence: Evidence) => {
            each(self.queryMatch.terms, (term) => {

              if (evidence.uuid === term.uuid) {
                evidence.referenceEntity.highlight = true;
                evidence.referenceEntity.activityDisplayId = term.activityDisplayId = activity.displayId;

                self.matchedCount += 1;
                match = true;
              }
            });
          });
        });

        if (match) {
          self._filteredActivities.push(activity);
        }
      });
    }
  }

  applyWeights(weight = 0) {
    const self = this;

    if (self.queryMatch && self.queryMatch.terms.length > 0) {

      each(self.activities, (activity: Activity) => {
        each(activity.nodes, (node: ActivityNode) => {
          const matchNode = find(self.queryMatch.terms, { uuid: node.term.uuid }) as Entity;

          if (matchNode) {
            matchNode.weight = node.term.weight = weight;
            weight++;
          }

          each(node.predicate.evidence, (evidence: Evidence) => {
            const matchNode = find(self.queryMatch.terms, { uuid: evidence.referenceEntity.uuid }) as Entity;

            if (matchNode) {
              matchNode.weight = evidence.referenceEntity.weight = weight;
              weight++;
            }
          });
        });

      });
    }
  }

  addPendingChanges(findEntities: Entity[], replaceWith: string, category) {
    const self = this;

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        each(findEntities, (entity: Entity) => {
          if (category.name === noctuaFormConfig.findReplaceCategory.options.reference.name) {
            each(node.predicate.evidence, (evidence: Evidence, key) => {
              if (evidence.uuid === entity.uuid) {
                const oldReference = new Entity(evidence.reference, evidence.reference);
                const newReference = new Entity(replaceWith, replaceWith);

                evidence.pendingReferenceChanges = new PendingChange(evidence.uuid, oldReference, newReference);
                evidence.pendingReferenceChanges.uuid = evidence.uuid;
              }
            });
          } else {
            if (node.term.uuid === entity.uuid) {
              const newValue = new Entity(replaceWith, replaceWith);
              node.pendingEntityChanges = new PendingChange(node.uuid, node.term, newValue);
            }
          }
        });
      });
    });
  }

  reviewCamChanges(stat: CamStats = new CamStats()): boolean {
    const self = this;
    let modified = false;

    self.modifiedStats = new CamStats();

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        activity.modified = node.reviewTermChanges(stat, self.modifiedStats);
        modified = modified || activity.modified;
      });
    });

    self.modifiedStats.updateTotal();
    return modified;
  }

  getNodesByType(type: ActivityNodeType): any[] {
    const self = this;
    const result = [];

    each(self.activities, (activity: Activity) => {
      result.push({
        activity,
        title: activity.title,
        activityNodes: activity.getNodesByType(type)
      });
    });

    return result;
  }

  getNodesByTypeFlat(type: ActivityNodeType): ActivityNode[] {
    const self = this;
    const result = [];

    each(self.activities, (activity: Activity) => {
      result.push(...activity.getNodesByType(type));
    });

    return result;
  }

  getTerms(formActivity: Activity) {
    const self = this;
    const result = [];

    if (formActivity && formActivity.nodes) {
      each(formActivity.nodes, (node: ActivityNode) => {
        result.push(node);
      });
    }

    each(self.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        result.push(node);
      });
    });

    return result;
  }

  getEvidences(formActivity?: Activity) {
    const self = this;
    const result = [];

    if (formActivity && formActivity.nodes) {
      each(formActivity.nodes, (node: ActivityNode) => {
        each(node.predicate.evidence, (evidence: Evidence) => {
          if (evidence.hasValue()) {
            result.push(evidence);
          }
        });
      });
    }

    each(self.activities, (activity: Activity) => {
      each(activity.edges, (triple: Triple<ActivityNode>) => {
        each(triple.predicate.evidence, (evidence: Evidence) => {
          if (evidence.hasValue()) {
            result.push(evidence);
          }
        });
      });
    });

    return result;
  }

  tableCanDisplayEnabledBy(node: ActivityNode) {
    return node.predicate.edge && node.predicate.edge.id === noctuaFormConfig.edge.enabledBy.id;
  }

  tableDisplayExtension(node: ActivityNode) {
    if (node.id === 'mf') {
      return '';
    } else if (node.isComplement) {
      return 'NOT ' + node.predicate.edge.label;
    } else {
      return node.predicate.edge.label;
    }
  }

  updateActivityDisplayNumber() {
    const self = this;

    each(self.activities, (activity: Activity, key) => {
      activity.displayNumber = self.displayNumber + '.' + (key + 1).toString();
    });
  }

  updateProperties() {
    const self = this;

    each(self.activities, (activity: Activity, key) => {
      activity.updateProperties()
    });

    this.sortBy.label = noctuaFormConfig.activitySortField.options[this.sortBy.field]?.label
  }

  private _getGPText(a: Activity): string {
    return a.presentation.gpText.toLowerCase()
  }

  private _getMFText(a: Activity): string {
    if (!a.mfNode) return ''
    return a.mfNode.term.label;
  }
  private _getBPText(a: Activity): string {
    if (!a.bpNode) return ''
    return a.bpNode.term.label;
  }
  private _getCCText(a: Activity): string {
    if (!a.ccNode) return ''
    return a.ccNode.term.label;
  }


}

