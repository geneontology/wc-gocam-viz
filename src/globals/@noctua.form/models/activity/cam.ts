import { noctuaFormConfig } from './../../noctua-form-config';
import { Activity, ActivitySortField } from './activity'
import { ActivityNode, ActivityNodeType } from './activity-node';
import { Group } from '../group';
import { Contributor } from '../contributor';
import { Evidence } from './evidence';
import { Triple } from './triple';
import { Entity } from './entity';
import { each, find, orderBy } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';

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

export class Cam {
  title: string;
  state: any;
  groups: Group[] = [];
  contributors: Contributor[] = [];
  groupId: any;
  expanded = false;
  model: any;
  causalRelations: Triple<Activity>[] = [];
  sortBy: CamSortBy = new CamSortBy();
  date: string;
  modified = false;
  modifiedStats = new CamStats();


  graph;

  // bbop managers 
  baristaClient;
  engine;
  manager;

  // Display 

  /**
   * Used for HTML id attribute
   */
  displayId: string;
  moreDetail = false;

  displayType;

  private _filteredActivities: Activity[] = [];
  private _activities: Activity[] = [];
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

  get activities() {
    const direction = this.sortBy.ascending ? 'asc' : 'desc';
    switch (this.sortBy?.field) {
      case ActivitySortField.DATE:
        return orderBy(this._activities, ['date', this._getGPText], [direction, direction]);
      case ActivitySortField.MF:
        return orderBy(this._activities, [this._getMFText, this._getGPText], [direction, direction]);
      case ActivitySortField.BP:
        return orderBy(this._activities, [this._getBPText, this._getGPText], [direction, direction]);
      case ActivitySortField.CC:
        return orderBy(this._activities, [this._getCCText, this._getGPText], [direction, direction]);
      default:
        return orderBy(this._activities, [this._getGPText], [direction, direction])
    }
  }

  set activities(srcActivities: Activity[]) {
    each(srcActivities, (activity: Activity) => {
      const prevActivity = this.findActivityById(activity.id);

      if (prevActivity) {
        activity.expanded = prevActivity.expanded;
      }
    });

    this._activities = srcActivities;
  }

  updateSortBy(field: ActivitySortField, label: string) {
    this.sortBy.field = field
    this.sortBy.label = label
  }

  toggleExpand() {
    this.expanded = !this.expanded;
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

    each(self._activities, (activity: Activity) => {
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

  updateProperties() {
    const self = this;

    each(self.activities, (activity: Activity, key) => {
      activity.updateProperties()
    });

    this.sortBy.label = noctuaFormConfig.activitySortField.options[this.sortBy.field]?.label
  }

  private _getGPText(a: Activity): string {
    return a.gpNode?.term.label.toLowerCase() || ''
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

