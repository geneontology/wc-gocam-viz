import { v4 as uuid } from 'uuid';
import { noctuaFormConfig } from './../../noctua-form-config';
import { SaeGraph } from './sae-graph';
import { Activity, ActivityType } from './activity';
import { ActivityNode } from './activity-node';
import { ConnectorRule } from './rules';
import { Entity } from './entity';
import { Triple } from './triple';
import { Evidence } from './evidence';
import { Predicate } from './predicate';
import { cloneDeep } from 'lodash';


export enum ConnectorType {
  ACTIVITY_ACTIVITY = 'ACTIVITY_ACTIVITY',
  ACTIVITY_MOLECULE = 'ACTIVITY_MOLECULE',
  MOLECULE_ACTIVITY = 'MOLECULE_ACTIVITY',
};

export class ConnectorActivity extends SaeGraph<ActivityNode> {
  id: string;
  subject: Activity;
  object: Activity;
  subjectNode: ActivityNode;
  objectNode: ActivityNode;
  predicate: Predicate;
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
    this.rule = new ConnectorRule();
    this.subjectNode = cloneDeep(this.subject.rootNode);
    this.objectNode = this.object.rootNode;
    this.subjectNode.predicate.evidence = predicate.evidence
    this.setConnectorType()
    this.setRule();
    this.setLinkDirection()
  }

  setRule() {
    const self = this;

    if (this.connectorType === ConnectorType.ACTIVITY_MOLECULE) {
      const question = self.edgeToConnectorQuestionAtoM(self.predicate.edge);

      self.rule.directness.directness = question.directness;
    } else if (this.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      const question = self.edgeToConnectorQuestionMtoA(self.predicate.edge);

      self.rule.chemicalRelationship.relation = question.relationship;
      self.rule.effectDirection.direction = question.causalEffect
    } else {
      const question = self.edgeToConnectorQuestion(self.predicate.edge);

      self.rule.activityRelationship.relation = question.relationship;
      self.rule.effectDirection.direction = question.causalEffect;
      self.rule.directness.directness = question.directness;
    }
  }

  addDefaultEvidence() {
    let activity: Activity;
    if (this.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      activity = this.object;
    } else {
      activity = this.subject
    }

    const mfNode = activity.getMFNode()
    const gpNode = activity.getGPNode()
    if (gpNode && mfNode) {
      const edge = activity.getEdge(mfNode.id, gpNode.id)
      this.predicate.evidence = cloneDeep(edge.predicate.evidence)
    }
  }

  checkConnection(value: any) {
    const self = this;

    self.rule.displaySection.causalEffect = true;

    if (value.chemicalRelationship) {
      if (value.chemicalRelationship.name === noctuaFormConfig.chemicalRelationship.options.chemicalRegulates.name) {
        self.rule.displaySection.causalEffect = true;
      } else if (value.chemicalRelationship.name === noctuaFormConfig.chemicalRelationship.options.chemicalSubstrate.name) {
        self.rule.displaySection.causalEffect = false;
      }
    }

    if (value.activityRelationship) {
      if (value.activityRelationship.name === noctuaFormConfig.activityRelationship.options.regulation.name) {
        self.rule.displaySection.directionCausalEffect = true;
      } else if (value.activityRelationship.name === noctuaFormConfig.activityRelationship.options.outputInput.name) {
        self.rule.displaySection.directionCausalEffect = false;
      }
    }

    if (this.connectorType === ConnectorType.ACTIVITY_ACTIVITY) {
      self.predicate.edge = this.getCausalConnectorEdge(value.directness, value.causalEffect, value.activityRelationship);
    } else if (this.connectorType === ConnectorType.ACTIVITY_MOLECULE) {
      self.predicate.edge = this.getCausalConnectorEdgeAtoM(value.directness)
    } else if (this.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      self.predicate.edge = this.getCausalConnectorEdgeMtoA(value.chemicalRelationship, value.causalEffect);
    }

    this.setLinkDirection();
  }

  getCausalConnectorEdge(directness, causalEffect, relationship): Entity {
    let edge = noctuaFormConfig.edge.directlyProvidesInput;

    if (relationship.name === noctuaFormConfig.activityRelationship.options.outputInput.name) {
      edge = noctuaFormConfig.edge.directlyProvidesInput;
    } else if (causalEffect.name === noctuaFormConfig.causalEffect.options.positive.name) {
      if (directness.name === noctuaFormConfig.directness.options.known.name) {
        edge = noctuaFormConfig.edge.positivelyRegulates;
      } else {
        edge = noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect;
      }
    } else if (causalEffect.name === noctuaFormConfig.causalEffect.options.negative.name) {
      if (directness.name === noctuaFormConfig.directness.options.known.name) {
        edge = noctuaFormConfig.edge.negativelyRegulates;
      } else {
        edge = noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect;
      }
    } else if (causalEffect.name === noctuaFormConfig.causalEffect.options.neutral.name) {
      if (directness.name === noctuaFormConfig.directness.options.known.name) {
        edge = noctuaFormConfig.edge.regulates;
      } else {
        edge = noctuaFormConfig.edge.causallyUpstreamOf;
      }
    }

    return Entity.createEntity(edge);
  }

  getCausalConnectorEdgeAtoM(directness): Entity {
    let edge = noctuaFormConfig.edge.hasOutput;

    if (directness.name === noctuaFormConfig.directness.options.chemicalProduct.name) {
      edge = noctuaFormConfig.edge.hasOutput;
    }

    return Entity.createEntity(edge);
  }

  getCausalConnectorEdgeMtoA(relationship, causalEffect): Entity {
    let edge = noctuaFormConfig.edge.isSmallMoleculeActivator;

    if (relationship.name === noctuaFormConfig.chemicalRelationship.options.chemicalRegulates.name) {
      if (causalEffect.name === noctuaFormConfig.causalEffect.options.negative.name) {
        edge = noctuaFormConfig.edge.isSmallMoleculeInhibitor;
      } else if (causalEffect.name === noctuaFormConfig.causalEffect.options.neutral.name) {
        edge = noctuaFormConfig.edge.isSmallMoleculeRegulator;
      }
    } else {
      edge = noctuaFormConfig.edge.hasInput
    }

    const entity = Entity.createEntity(edge);

    if (entity.id === noctuaFormConfig.edge.hasInput.id) {
      entity.label = 'input of'
    }

    return entity
  }

  edgeToConnectorQuestion(edge: Entity) {
    let relationship = noctuaFormConfig.activityRelationship.options.regulation;
    let directness = noctuaFormConfig.directness.options.known;
    let causalEffect = noctuaFormConfig.causalEffect.options.positive;

    if (edge.id === noctuaFormConfig.edge.directlyProvidesInput.id) {
      relationship = noctuaFormConfig.activityRelationship.options.outputInput;
      return { directness, causalEffect, relationship }
    }

    switch (edge.id) {
      case noctuaFormConfig.edge.causallyUpstreamOf.id:
      case noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect.id:
      case noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect.id:
        directness = noctuaFormConfig.directness.options.unknown;
        break;
    }
    switch (edge.id) {
      case noctuaFormConfig.edge.regulates.id:
      case noctuaFormConfig.edge.causallyUpstreamOf.id:
        causalEffect = noctuaFormConfig.causalEffect.options.neutral;
        break;
      case noctuaFormConfig.edge.negativelyRegulates.id:
      case noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect.id:
        causalEffect = noctuaFormConfig.causalEffect.options.negative;
        break;
    }

    return { directness, causalEffect, relationship }
  }

  edgeToConnectorQuestionAtoM(edge: Entity) {
    let directness = noctuaFormConfig.directness.options.chemicalProduct;

    return { directness }
  }

  edgeToConnectorQuestionMtoA(edge: Entity) {
    let relationship = noctuaFormConfig.chemicalRelationship.options.chemicalRegulates
    let causalEffect = noctuaFormConfig.causalEffect.options.positive;

    switch (edge.id) {
      case noctuaFormConfig.edge.hasInput.id:
        relationship = noctuaFormConfig.chemicalRelationship.options.chemicalSubstrate;
        break;
      case noctuaFormConfig.edge.isSmallMoleculeActivator.id:
        causalEffect = noctuaFormConfig.causalEffect.options.positive;
        break;
      case noctuaFormConfig.edge.isSmallMoleculeInhibitor.id:
        causalEffect = noctuaFormConfig.causalEffect.options.negative;
        break;
      case noctuaFormConfig.edge.isSmallMoleculeRegulator.id:
        causalEffect = noctuaFormConfig.causalEffect.options.neutral;
        break;
    }

    return { relationship, causalEffect }
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

}
