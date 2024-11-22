import { v4 as uuid } from 'uuid';
import { noctuaFormConfig } from './../../noctua-form-config';
import { SaeGraph } from './sae-graph';
import { Activity, ActivityType } from './activity';
import { ActivityNode } from './activity-node';
import { ConnectorRule } from './connector-rule';
import { Entity } from './entity';
import { Evidence } from './evidence';
import { Predicate } from './predicate';
import { cloneDeep, find } from 'lodash';



export enum ConnectorState {
  creation = 1,
  editing
}

export enum ConnectorType {
  ACTIVITY_ACTIVITY = 'activity',
  ACTIVITY_MOLECULE = 'activityMolecule',
  MOLECULE_ACTIVITY = 'moleculeActivity',
};

export class ConnectorActivity extends SaeGraph<ActivityNode> {
  id: string;
  subject: Activity;
  object: Activity;
  subjectNode: ActivityNode;
  objectNode: ActivityNode;
  predicate: Predicate;
  state: ConnectorState;
  rule: ConnectorRule;
  connectorType: ConnectorType
  reverseEdge = false;

  graphPreview = {
    nodes: [],
    edges: []
  };

  constructor(subject: Activity, object: Activity, predicate: Predicate) {
    super();
    this.id = uuid();

    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
    this.setConnectorType()
    this.rule = new ConnectorRule(this.connectorType);
    this.subjectNode = cloneDeep(this.subject.rootNode);
    this.objectNode = this.object.rootNode;
    this.subjectNode.predicate.evidence = predicate.evidence

    this.setRule();
    this.setLinkDirection()
    this.createGraph();
  }

  setRule() {
    const self = this;
    const question = self.edgeToConnectorQuestion(self.predicate.edge);

    if (question) {

      Object.entries(question).forEach(entry => {
        const [key, value] = entry;
        const id = (value as string).split(':');
        self.rule[key] = noctuaFormConfig[id[0]][id[1]]
      });
    } else {
      self.rule.relationship = null;
      self.rule.directness = null;
      self.rule.effectDirection = null;
    }

  }

  addDefaultEvidence() {
    let activity: Activity;
    if (this.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      activity = this.object;
    } else {
      activity = this.subject
    }

    const mfNode = activity.mfNode
    const gpNode = activity.gpNode
    if (gpNode && mfNode) {
      const edge = activity.getEdge(mfNode.id, gpNode.id)
      this.predicate.evidence = cloneDeep(edge.predicate.evidence)
    }
  }

  checkConnection(value: any) {
    const self = this;

    self.rule.displaySection.effectDirection = true;

    if (value.relationship) {
      switch (value.relationship.id) {
        case noctuaFormConfig.activityRelationship.regulation.id:
          self.rule.displaySection.effectDirection = true;
          self.rule.displaySection.directness = true;
          break;
        case noctuaFormConfig.activityRelationship.constitutivelyUpstream.id:
        case noctuaFormConfig.activityRelationship.providesInputFor.id:
        case noctuaFormConfig.activityRelationship.removesInputFor.id:
          self.rule.displaySection.effectDirection = false;
          self.rule.displaySection.directness = false;
          break;
        case noctuaFormConfig.activityRelationship.undetermined.id:
          self.rule.displaySection.effectDirection = true;
          self.rule.displaySection.directness = false;
          break;
        case noctuaFormConfig.moleculeActivityRelationship.regulates.id:
          self.rule.displaySection.effectDirection = true;
          self.rule.displaySection.directness = false;
          break;
        case noctuaFormConfig.moleculeActivityRelationship.substrate.id:
          self.rule.displaySection.effectDirection = false;
          self.rule.displaySection.directness = false;
          break;
        case (noctuaFormConfig.activityMoleculeRelationship.product.id):
          self.rule.displaySection.effectDirection = false;
          self.rule.displaySection.directness = false;
          break;
      }
    }

    self.predicate.edge = this.getCausalConnectorEdge(
      value.relationship?.id,
      self.rule.displaySection.effectDirection && value.effectDirection ? value.effectDirection.id : null,
      self.rule.displaySection.directness && value.directness ? value.directness.id : null);

    self.prepareSave(value);
    this.setLinkDirection();
  }

  getVPEEdge(relationship: string, effectDirection?: string, directness?: string): string | undefined {
    const tree = noctuaFormConfig.decisionTree;
    if (tree[relationship]) {
      if (tree[relationship].edge) {
        return tree[relationship].edge;
      } else if (effectDirection && tree[relationship][effectDirection]) {
        if (tree[relationship][effectDirection].edge) {
          return tree[relationship][effectDirection].edge;
        } else if (directness && tree[relationship][effectDirection][directness]) {
          return tree[relationship][effectDirection][directness].edge;
        }
      }
    }
    return undefined;
  }

  getCausalConnectorEdge(relationship, effectDirection, directness): Entity {
    const predicateId = this.getVPEEdge(relationship, effectDirection, directness)

    const entity = find(noctuaFormConfig.allEdges, {
      id: predicateId
    });
    const edge = entity ? Entity.createEntity(entity) : Entity.createEntity({ id: predicateId, label: predicateId });

    if (edge.id === noctuaFormConfig.edge.hasInput.id) {
      edge.label = 'input of'
    }

    return edge
  }

  getInputs(edge: string): any {
    const tree = noctuaFormConfig.decisionTree;
    for (const relationship in tree) {
      if (tree[relationship].edge === edge) {
        return { relationship };
      } else if (typeof tree[relationship] === 'object') {
        for (const effectDirection in tree[relationship]) {
          if (tree[relationship][effectDirection].edge === edge) {
            return { relationship, effectDirection };
          } else if (typeof tree[relationship][effectDirection] === 'object') {
            for (const directness in tree[relationship][effectDirection]) {
              if (tree[relationship][effectDirection][directness].edge === edge) {
                return { relationship, effectDirection, directness };
              }
            }
          }
        }
      }
    }
    return null;
  }

  edgeToConnectorQuestion(edge: Entity) {

    const question = this.getInputs(edge.id)
    return question
  }

  setConnectorType() {
    if (this.subject.activityType !== ActivityType.molecule && this.object.activityType !== ActivityType.molecule) {
      this.connectorType = ConnectorType.ACTIVITY_ACTIVITY
    } else if (this.subject.activityType !== ActivityType.molecule && this.object.activityType === ActivityType.molecule) {
      this.connectorType = ConnectorType.ACTIVITY_MOLECULE
    } else if (this.subject.activityType === ActivityType.molecule && this.object.activityType !== ActivityType.molecule) {
      this.connectorType = ConnectorType.MOLECULE_ACTIVITY
    }
  }


  setLinkDirection() {
    this.predicate.isReverseLink = (this.connectorType === ConnectorType.MOLECULE_ACTIVITY
      && this.predicate.edge.id === noctuaFormConfig.edge.hasInput.id);
  }

  createGraph(srcEvidence?: Evidence[]) {
    const self = this;
    const evidence = srcEvidence ? srcEvidence : self.predicate.evidence;

    self.addNodes(self.subjectNode, self.objectNode);
    self.addEdge(self.subjectNode, self.objectNode, new Predicate(self.predicate.edge, evidence));
  }

  prepareSave(value) {
    const self = this;

    const evidence: Evidence[] = value.evidenceFormArray.map((evidence: Evidence) => {
      const result = new Evidence();

      result.uuid = evidence.uuid;
      result.evidence = new Entity(evidence.evidence.id, evidence.evidence.label);
      result.reference = evidence.reference;
      result.with = evidence.with;

      return result;
    });

    this.predicate.evidence = evidence;

    // this.createGraph(evidence);
  }

}
