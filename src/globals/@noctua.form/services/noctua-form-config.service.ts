import { noctuaFormConfig } from './../noctua-form-config';
import * as ModelDefinition from './../data/config/model-definition';
import * as ShapeDescription from './../data/config/shape-definition';

import { Activity, ActivityType } from './../models/activity/activity';
import { find, filter, each } from 'lodash';

import * as ShapeUtils from './../data/config/shape-utils';
import { ActivityNode, GoCategory } from './../models/activity/activity-node';
import { Entity, RootTypes } from './../models/activity/entity';
import { Evidence } from './../models/activity/evidence';
import { Predicate } from './../models/activity/predicate';
import { DataUtils } from '../data/config/data-utils';
import shexJson from './../data/shapes.json';
import taxonDataset from './../data/taxon-dataset.json';

export class NoctuaFormConfigService {
  speciesList = []
  termLookupTable
  shapePredicates: string[];

  constructor() {
    this.termLookupTable = DataUtils.genTermLookupTable();
    this.shapePredicates = DataUtils.getPredicates(shexJson.goshapes, null, null, false);
    this.speciesList = this.generateSpeciesList()
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
      noctuaFormConfig.graphLayoutDetail.options.detailed,
      noctuaFormConfig.graphLayoutDetail.options.simple,
      noctuaFormConfig.graphLayoutDetail.options.preview
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get evidenceDBs() {
    const options = [
      noctuaFormConfig.evidenceDB.options.pmid,
      noctuaFormConfig.evidenceDB.options.doi,
      noctuaFormConfig.evidenceDB.options.goRef,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityType() {
    const options = [
      noctuaFormConfig.activityType.options.default,
      noctuaFormConfig.activityType.options.bpOnly,
      noctuaFormConfig.activityType.options.ccOnly,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activitySortField() {
    const options = [
      noctuaFormConfig.activitySortField.options.gp,
      noctuaFormConfig.activitySortField.options.date
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get bpOnlyEdges() {
    const options = [
      noctuaFormConfig.edge.causallyUpstreamOfOrWithin,
      noctuaFormConfig.edge.causallyUpstreamOf,
      noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect,
      noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect,
      noctuaFormConfig.edge.causallyUpstreamOfOrWithinPositiveEffect,
      noctuaFormConfig.edge.causallyUpstreamOfOrWithinNegativeEffect,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get ccOnlyEdges() {
    const options = [
      noctuaFormConfig.edge.partOf,
      noctuaFormConfig.edge.locatedIn,
      noctuaFormConfig.edge.isActiveIn,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get graphDisplayDefaultEdges() {
    const options = [
      noctuaFormConfig.edge.enabledBy,
      noctuaFormConfig.edge.partOf,
      noctuaFormConfig.edge.occursIn,
      noctuaFormConfig.edge.hasInput
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get effectDirection() {
    const options = [
      noctuaFormConfig.effectDirection.positive,
      noctuaFormConfig.effectDirection.negative
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
      noctuaFormConfig.directness.direct,
      noctuaFormConfig.directness.indirect,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityRelationship() {
    const options = [
      noctuaFormConfig.activityRelationship.regulation,
      noctuaFormConfig.activityRelationship.constitutivelyUpstream,
      noctuaFormConfig.activityRelationship.providesInputFor,
      noctuaFormConfig.activityRelationship.removesInputFor,
      noctuaFormConfig.activityRelationship.undetermined
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityMoleculeRelationship() {
    const options = [
      noctuaFormConfig.activityMoleculeRelationship.product,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get moleculeActivityRelationship() {
    const options = [
      noctuaFormConfig.moleculeActivityRelationship.regulates,
      noctuaFormConfig.moleculeActivityRelationship.substrate,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  isAllowedEdge(id: string) {
    return noctuaFormConfig.allowedPathwayViewerEdges.some(e => e.id === id);
  }

  generateSpeciesList() {
    const result = new Set<string>()
    taxonDataset.forEach(taxon => {
      if (taxon.species_code) {
        result.add(taxon.species_code)
      }
    })

    return [...result]
  }

  getGeneShorthand(geneName: string) {

    for (let suffix of this.speciesList) {
      geneName = geneName.replace(new RegExp(`${suffix}$`, 'i'), "").trim();
    }

    return geneName;

  }

  createPredicate(edge: Entity, evidence?: Evidence[]): Predicate {
    const predicate = new Predicate(edge, evidence);

    ShapeUtils.setEvidenceLookup(predicate);

    return predicate;
  }

  //For reading the table
  createActivityBaseModel(modelType: ActivityType, rootNode: ActivityNode): Activity {

    const baseNode = ModelDefinition.rootNodes[modelType];

    if (!baseNode) return;
    const node = { ...baseNode, ...rootNode }

    return ModelDefinition.createBaseActivity(modelType, node as ActivityNode);
  }

  // For the form
  createActivityModel(activityType: ActivityType): Activity {
    switch (activityType) {
      case ActivityType.default:
        return ModelDefinition.createActivityShex(ModelDefinition.activityUnitDescription);
      case ActivityType.bpOnly:
        return ModelDefinition.createActivityShex(ModelDefinition.bpOnlyAnnotationDescription);
      case ActivityType.ccOnly:
        return ModelDefinition.createActivityShex(ModelDefinition.ccOnlyAnnotationDescription);
      case ActivityType.molecule:
        return ModelDefinition.createActivityShex(ModelDefinition.moleculeDescription);
      case ActivityType.proteinComplex:
        return ModelDefinition.createActivityShex(ModelDefinition.proteinComplexDescription);
      case ActivityType.simpleAnnoton:
        return ModelDefinition.createActivityShex(ModelDefinition.simpleAnnotonDescription);
    }
  }

  addActivityNodeShex(activity: Activity,
    subjectNode: ActivityNode,
    predExpr: ShapeDescription.PredicateExpression,
    objectNode: Partial<ActivityNode>): ActivityNode {
    return ModelDefinition.addNodeShex(activity, subjectNode, predExpr, objectNode);
  }

  insertActivityNodeShex(activity: Activity,
    subjectNode: ActivityNode,
    predExpr: ShapeDescription.PredicateExpression,
    objectId: string = null): ActivityNode {
    return ModelDefinition.insertNodeShex(activity, subjectNode, predExpr, objectId);
  }

  insertActivityNodeByPredicate(activity: Activity, subjectNode: ActivityNode, bbopPredicateId: string,
    partialObjectNode?: Partial<ActivityNode>): ActivityNode {
    const predExprs: ShapeDescription.PredicateExpression[] = subjectNode.canInsertNodes;


    let objectNode;

    /*  each(predExprs, (predExpr: ShapeDescription.PredicateExpression) => {
       if (bbopPredicateId === predExpr.id) {
         if (partialObjectNode && partialObjectNode.hasRootTypes(predExpr.node.category)) {
           objectNode = ModelDefinition.insertNodeShex(activity, subjectNode, predExpr);
           return false;
         } else if (!partialObjectNode) {
           objectNode = ModelDefinition.insertNodeShex(activity, subjectNode, predExpr);
           return false;
         }
       }
     }); */

    return objectNode;
  }

  findEdge(predicateId) {

    const edge = find(noctuaFormConfig.allEdges, {
      id: predicateId
    });

    return edge ? Entity.createEntity(edge) : Entity.createEntity({ id: predicateId, label: predicateId });
  }

  getAspect(id) {
    const rootNode = find(noctuaFormConfig.rootNode, { id: id });

    return rootNode ? rootNode.aspect : '';
  }

  getModelId(url: string) {
    return 'gomodel:' + url.substr(url.lastIndexOf('/') + 1);
  }

  getIndividalId(url: string) {
    return 'gomodel:' + url.substr(url.lastIndexOf('/') + 2);
  }

}
