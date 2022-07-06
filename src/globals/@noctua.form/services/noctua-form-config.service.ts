import { noctuaFormConfig } from './../noctua-form-config';
import * as ModelDefinition from './../data/config/model-definition';
import * as ShapeDescription from './../data/config/shape-definition';

import { Activity, ActivityType } from './../models/activity/activity';
import { find, each } from 'lodash';
import * as EntityDefinition from './../data/config/entity-definition';
import { ActivityNode } from './../models/activity/activity-node';
import { Entity } from './../models/activity/entity';
import { Evidence } from './../models/activity/evidence';
import { Predicate } from './../models/activity/predicate';

export class NoctuaFormConfigService {

  constructor() {
  }

  get edges() {
    return noctuaFormConfig.edge;
  }

  get modelState() {
    const options = [
      noctuaFormConfig.modelState.options.development,
      noctuaFormConfig.modelState.options.production,
      noctuaFormConfig.modelState.options.review,
      noctuaFormConfig.modelState.options.closed,
      noctuaFormConfig.modelState.options.delete,
      noctuaFormConfig.modelState.options.internal_test
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get graphLayoutDetail() {
    const options = [
      noctuaFormConfig.graphLayoutDetail.options.activity,
      noctuaFormConfig.graphLayoutDetail.options.detailed,
      noctuaFormConfig.graphLayoutDetail.options.preview
    ];

    return {
      options: options,
      selected: options[0]
    };
  }



  get activitySortField() {
    const options = [
      noctuaFormConfig.activitySortField.options.gp,
      noctuaFormConfig.activitySortField.options.date,
      noctuaFormConfig.activitySortField.options.mf,
      noctuaFormConfig.activitySortField.options.bp,
      noctuaFormConfig.activitySortField.options.cc,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get causalEffect() {
    const options = [
      noctuaFormConfig.causalEffect.options.positive,
      noctuaFormConfig.causalEffect.options.negative,
      noctuaFormConfig.causalEffect.options.neutral
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get findReplaceCategories() {
    const options = [
      noctuaFormConfig.findReplaceCategory.options.term,
      noctuaFormConfig.findReplaceCategory.options.gp,
      noctuaFormConfig.findReplaceCategory.options.reference,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get directness() {
    const options = [
      noctuaFormConfig.directness.options.known,
      noctuaFormConfig.directness.options.unknown,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get directnessActivityMolecule() {
    const options = [
      noctuaFormConfig.directness.options.chemicalProduct
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityRelationship() {
    const options = [
      noctuaFormConfig.activityRelationship.options.regulation,
      noctuaFormConfig.activityRelationship.options.outputInput,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get chemicalRelationship() {
    const options = [
      noctuaFormConfig.chemicalRelationship.options.chemicalRegulates,
      noctuaFormConfig.chemicalRelationship.options.chemicalSubstrate,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  createPredicate(edge: Entity, evidence?: Evidence[]): Predicate {
    const predicate = new Predicate(edge, evidence);

    return predicate;
  }
  createActivityBaseModel(modelType: ActivityType): Activity {
    switch (modelType) {
      case ActivityType.default:
        return ModelDefinition.createActivity(ModelDefinition.activityUnitBaseDescription);
      case ActivityType.bpOnly:
        return ModelDefinition.createActivity(ModelDefinition.bpOnlyAnnotationBaseDescription);
      case ActivityType.ccOnly:
        return ModelDefinition.createActivity(ModelDefinition.ccOnlyAnnotationBaseDescription);
      case ActivityType.molecule:
        return ModelDefinition.createActivity(ModelDefinition.moleculeBaseDescription);
      case ActivityType.proteinComplex:
        return ModelDefinition.createActivity(ModelDefinition.proteinComplexBaseDescription);
    }
  }

  createActivityModel(activityType: ActivityType): Activity {
    switch (activityType) {
      case ActivityType.default:
        return ModelDefinition.createActivity(ModelDefinition.activityUnitDescription);
      case ActivityType.bpOnly:
        return ModelDefinition.createActivity(ModelDefinition.bpOnlyAnnotationDescription);
      case ActivityType.ccOnly:
        return ModelDefinition.createActivity(ModelDefinition.ccOnlyAnnotationDescription);
      case ActivityType.molecule:
        return ModelDefinition.createActivity(ModelDefinition.moleculeDescription);
      case ActivityType.proteinComplex:
        return ModelDefinition.createActivity(ModelDefinition.proteinComplexDescription);
    }
  }

  insertActivityNode(activity: Activity,
    subjectNode: ActivityNode,
    nodeDescription: ShapeDescription.ShapeDescription): ActivityNode {
    return ModelDefinition.insertNode(activity, subjectNode, nodeDescription);
  }

  insertActivityNodeByPredicate(activity: Activity, subjectNode: ActivityNode, bbopPredicateId: string,
    partialObjectNode?: Partial<ActivityNode>): ActivityNode {
    const nodeDescriptions: ModelDefinition.InsertNodeDescription[] = subjectNode.canInsertNodes;
    let objectNode;

    each(nodeDescriptions, (nodeDescription: ModelDefinition.InsertNodeDescription) => {
      if (bbopPredicateId === nodeDescription.predicate.id) {
        if (partialObjectNode && partialObjectNode.hasRootTypes(nodeDescription.node.category)) {
          objectNode = ModelDefinition.insertNode(activity, subjectNode, nodeDescription);
          return false;
        } else if (!partialObjectNode) {
          objectNode = ModelDefinition.insertNode(activity, subjectNode, nodeDescription);
          return false;
        }
      }
    });

    return objectNode;
  }

  findEdge(predicateId) {

    const edge = find(noctuaFormConfig.edge, {
      id: predicateId
    });

    return edge ? Entity.createEntity(edge) : Entity.createEntity({ id: predicateId, label: predicateId });
  }

  getAspect(id) {
    const rootNode = find(noctuaFormConfig.rootNode, { id: id });

    return rootNode ? rootNode.aspect : '';
  }




}
