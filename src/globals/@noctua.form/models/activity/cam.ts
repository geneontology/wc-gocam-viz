import { noctuaFormConfig } from './../../noctua-form-config';
import { Activity, ActivitySortField, ActivityType } from './activity'
import { Group } from '../group';
import { Contributor } from '../contributor';
import { Triple } from './triple';
import { Entity } from './entity';
import { each, find, groupBy } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';

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

  groupActivitiesByProcess() {
    const groupedActivities = groupBy(this.activities, (activity: Activity) => {
      if (activity.activityType === ActivityType.molecule) {
        return 'Small Molecules';
      }

      return activity.bpNode ? activity.bpNode.term.label : 'No Process Assigned'
    })

    return groupedActivities;
  }

  findActivityById(id) {
    const self = this;

    return find(self.activities, (activity) => {
      return activity.id === id;
    });
  }

  updateProperties() {
    const self = this;

    each(self.activities, (activity: Activity, key) => {
      activity.updateProperties()
    });

    this.sortBy.label = noctuaFormConfig.activitySortField.options[this.sortBy.field]?.label
  }

}

