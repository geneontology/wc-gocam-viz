import * as EntityDefinition from './../data/config/entity-definition';

import { noctuaFormConfig } from './../noctua-form-config';
import { NoctuaFormConfigService } from './noctua-form-config.service';
import { Activity, ActivityType } from './../models/activity/activity';
import { find, each, chain } from 'lodash';
import { ActivityNode, ActivityNodeType, compareTerm, GoCategory } from './../models/activity/activity-node';
import { Cam, CamOperation } from './../models/activity/cam';
import { Entity } from './../models/activity/entity';
import { Evidence } from './../models/activity/evidence';
import { Predicate } from './../models/activity/predicate';
import { Triple } from './../models/activity/triple';
import { TermsSummary } from './../models/activity/summary';
import moment from 'moment';
import { graph as bbopGraph } from 'bbop-graph-noctua';
import * as dbxrefs from "@geneontology/dbxrefs";


export class NoctuaGraphService {
  curieUtil: any;


  constructor(
    public noctuaFormConfigService: NoctuaFormConfigService) {
  }


  getTermURL(id: string) {
    const self = this;

    if (!id) {
      return ""
    }

    if (id.startsWith('ECO')) {
      return 'http://www.evidenceontology.org/term/' + id;
    } else if (id.startsWith('PMID')) {
      const idAccession = id.split(':');
      if (idAccession.length > 1) {
        return 'https://www.ncbi.nlm.nih.gov/pubmed/' + idAccession[1].trim();
      } else {
        return null;
      }

    } else {
      const dbId = id.split(/:(.+)/, 2);
      if (dbId.length > 1) {
        return dbxrefs.getURL(dbId[0], undefined, dbId[1]);
      }

    }
  }

  getCam(responseData): Cam {
    const cam = new Cam()
    cam.graph = new bbopGraph();
    cam.graph.load_data_basic(responseData);
    cam.id = responseData.id;
    cam.modified = responseData['modified-p'];

    this.getMetadata(cam)
    this.loadCam(cam)

    return cam;
  }



  getMetadata(responseData) {
    const self = this;
    const cam = new Cam()

    cam.graph = new bbopGraph();
    cam.graph.load_data_basic(responseData);

    cam.id = responseData.id;

    const titleAnnotations = cam.graph.get_annotations_by_key('title');
    const commentAnnotations = cam.graph.get_annotations_by_key('comment');
    const stateAnnotations = cam.graph.get_annotations_by_key('state');
    const dateAnnotations = cam.graph.get_annotations_by_key('date');
    //const groupAnnotations = cam.graph.get_annotations_by_key('providedBy');
    // const contributorAnnotations = cam.graph.get_annotations_by_key('contributor');

    //cam.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
    //cam.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);

    if (dateAnnotations.length > 0) {
      cam.date = dateAnnotations[0].value();
    }

    if (titleAnnotations.length > 0) {
      cam.title = titleAnnotations[0].value();
    }

    cam.comments = commentAnnotations.map(c => {
      return c.value();
    })

    return cam;

  }


  loadCam(cam: Cam, publish = true) {
    const self = this;
    const activities = self.graphToActivities(cam.graph);
    const molecules = self.graphToMolecules(cam.graph);

    activities.push(...molecules);

    cam.activities = activities;
    cam.updateProperties()
    cam.causalRelations = self.getCausalRelations(cam);


    cam.applyFilter();
    cam.updateActivityDisplayNumber();
  }



  getNodeInfo(node) {
    const result: any = {};

    each(node.types(), function (srcType) {
      const type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;

      result.id = type.class_id();
      result.label = type.class_label();
      result.classExpression = srcType;
    });

    return result;
  }


  getNodeRootInfo(node): Entity[] {
    const result = node.root_types().map((srcType) => {
      const type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;
      return new Entity(type.class_id(), type.class_label());
    });

    return result;
  }

  getNodeCategoryInfo(rootTypes: Entity[]): GoCategory[] {
    const result = rootTypes.map((rootType) => {
      const category = new GoCategory()
      category.category = rootType.id
      return category
    });

    return result;
  }

  getNodeDate(node) {

    const date = node.get_annotations_by_key('date');

    if (date.length > 0) {
      return date[0].value();
    }

    return null;
  }

  getNodeLocation(node) {
    const result = {
      x: 0,
      y: 0
    };

    const x_annotations = node.get_annotations_by_key('hint-layout-x');
    const y_annotations = node.get_annotations_by_key('hint-layout-y');

    if (x_annotations.length === 1) {
      result.x = parseInt(x_annotations[0].value());
    }

    if (y_annotations.length === 1) {
      result.y = parseInt(y_annotations[0].value());
    }

    return result;
  }

  getNodeIsComplement(node) {
    let result = true;

    if (node) {
      each(node.types(), function (in_type) {
        const t = in_type.type();
        result = result && (t === 'complement');
      });
    }

    return result;
  }

  nodeToActivityNode(graph, objectId): Partial<ActivityNode> {
    const self = this;

    const node = graph.get_node(objectId);
    if (!node) {
      return null;
    }
    const nodeInfo = self.getNodeInfo(node);
    const rootTypes = self.getNodeRootInfo(node);
    const result = {
      id: objectId,
      uuid: objectId,
      date: self.getNodeDate(node),
      term: new Entity(nodeInfo.id, nodeInfo.label, self.getTermURL(nodeInfo.id), objectId),
      rootTypes: rootTypes,
      category: self.getNodeCategoryInfo(rootTypes),
      classExpression: nodeInfo.classExpression,
      location: self.getNodeLocation(node),
      isComplement: self.getNodeIsComplement(node),
    };

    return new ActivityNode(result);
  }


  edgeComments(edge): string[] {

    const commentAnnotations = edge.get_annotations_by_key('comment');

    return commentAnnotations.map(c => {
      return c.value();
    })

  }

  edgeToEvidence(graph, edge): Evidence[] {

    const self = this;
    const evidenceAnnotations = edge.get_annotations_by_key('evidence');
    const result = [];

    each(evidenceAnnotations, function (evidenceAnnotation) {
      const annotationId = evidenceAnnotation.value();
      const annotationNode = graph.get_node(annotationId);
      const evidence = new Evidence();

      evidence.edge = new Entity(edge.predicate_id(), '');
      evidence.uuid = annotationNode.id();
      if (annotationNode) {

        const nodeInfo = self.getNodeInfo(annotationNode);
        evidence.setEvidence(new Entity(nodeInfo.id,
          nodeInfo.label,
          self.getTermURL(nodeInfo.id)), nodeInfo.classExpression);

        const sources = annotationNode.get_annotations_by_key('source');
        const withs = annotationNode.get_annotations_by_key('with');
        const contributorAnnotations = annotationNode.get_annotations_by_key('contributor');
        const groupAnnotations = annotationNode.get_annotations_by_key('providedBy');

        const date = self.getNodeDate(annotationNode);
        const formattedDate = (moment as any)(date, 'YYYY-MM-DD')
        evidence.date = date
        evidence.formattedDate = formattedDate.format('ll');

        if (sources.length > 0) {
          const sorted = sources.sort(self._compareSources)
          evidence.reference = sorted.map((source) => {
            return source.value();
          }).join('| ')
          const referenceUrl = self.getTermURL(evidence.reference);
          evidence.referenceEntity = new Entity(evidence.reference, evidence.reference, referenceUrl, evidence.uuid)
        }

        if (withs.length > 0) {
          evidence.with = withs[0].value();
          evidence.withEntity = new Entity(evidence.with, evidence.with, null, evidence.uuid)
        }


        result.push(evidence);
      }
    });

    return result;
  }


  isStartEdge(subjectNode, predicateId) {
    return predicateId === noctuaFormConfig.edge.enabledBy.id ||
      ((predicateId === noctuaFormConfig.edge.partOf.id ||
        predicateId === noctuaFormConfig.edge.locatedIn.id ||
        predicateId === noctuaFormConfig.edge.contributesTo.id ||
        predicateId === noctuaFormConfig.edge.isActiveIn.id) &&

        subjectNode.hasRootType(EntityDefinition.GoMolecularEntity))
  }

  getTerms(camGraph): TermsSummary {
    const self = this;
    const termsSummary = new TermsSummary()
    const nodes = []
    const frequency = {}

    each(camGraph.all_nodes(), (bbopNode) => {
      const node = self.nodeToActivityNode(camGraph, bbopNode.id());
      node.id = node.uuid;
      nodes.push(node)
      frequency[node.term.id] = frequency[node.term.id] ? frequency[node.term.id] + 1 : 1;


      if (node.hasRootType(EntityDefinition.GoMolecularEntity)) {
        termsSummary.gp.frequency++;
      } else if (node.hasRootType(EntityDefinition.GoMolecularFunction)) {
        termsSummary.mf.frequency++;
      } else if (node.hasRootType(EntityDefinition.GoBiologicalProcess)) {
        termsSummary.bp.frequency++;
      } else if (node.hasRootType(EntityDefinition.GoCellularComponent)) {
        termsSummary.cc.frequency++;
      } else if (node.hasRootType(EntityDefinition.GoEvidenceNode)) {
        // continue
      } else {
        termsSummary.other.frequency++;
      }
    });

    const uniqueNodes = chain(nodes)
      .uniqWith(compareTerm)
      .value();

    each(uniqueNodes, (node: ActivityNode) => {
      node.frequency = frequency[node.term.id]

      if (node.hasRootType(EntityDefinition.GoMolecularEntity)) {
        node.type = ActivityNodeType.GoMolecularEntity
        termsSummary.gp.append(node)
      } else if (node.hasRootType(EntityDefinition.GoMolecularFunction)) {
        node.type = ActivityNodeType.GoMolecularFunction
        termsSummary.mf.append(node)
      } else if (node.hasRootType(EntityDefinition.GoBiologicalProcess)) {
        node.type = ActivityNodeType.GoBiologicalProcess
        termsSummary.bp.append(node)
      } else if (node.hasRootType(EntityDefinition.GoCellularComponent)) {
        node.type = ActivityNodeType.GoCellularComponent
        termsSummary.cc.append(node)
      } else if (node.hasRootType(EntityDefinition.GoEvidenceNode)) {
        // continue
      } else {
        termsSummary.other.append(node)
      }
    })

    termsSummary.allTerms = uniqueNodes

    return termsSummary
  }



  getActivityPreset(subjectNode: Partial<ActivityNode>, objectNode: Partial<ActivityNode>, predicateId, bbopSubjectEdges): Activity {
    const self = this;
    let activityType = ActivityType.default;

    if ((predicateId === noctuaFormConfig.edge.partOf.id ||
      predicateId === noctuaFormConfig.edge.locatedIn.id ||
      predicateId === noctuaFormConfig.edge.contributesTo.id ||
      predicateId === noctuaFormConfig.edge.isActiveIn.id) &&
      subjectNode.hasRootType(EntityDefinition.GoMolecularEntity)) {

      activityType = ActivityType.ccOnly;
    } else if (subjectNode.term.id === noctuaFormConfig.rootNode.mf.id) {
      each(bbopSubjectEdges, function (subjectEdge) {
        if (find(noctuaFormConfig.bpOnlyCausalEdges, { id: subjectEdge.predicate_id() })) {
          activityType = ActivityType.bpOnly;
        }
      });
    } else if (objectNode.hasRootType(EntityDefinition.GoProteinContainingComplex)) {
      activityType = ActivityType.proteinComplex;
    }

    return self.noctuaFormConfigService.createActivityBaseModel(activityType, subjectNode as ActivityNode);
  }


  graphToActivities(camGraph): Activity[] {
    const self = this;
    const activities: Activity[] = [];

    each(camGraph.all_edges(), (bbopEdge) => {
      const bbopSubjectId = bbopEdge.subject_id();
      const bbopObjectId = bbopEdge.object_id();
      const subjectNode = self.nodeToActivityNode(camGraph, bbopSubjectId);
      const objectNode = self.nodeToActivityNode(camGraph, bbopObjectId);

      if (self.isStartEdge(subjectNode, bbopEdge.predicate_id())) {

        const subjectEdges = camGraph.get_edges_by_subject(bbopSubjectId);
        const activity: Activity = self.getActivityPreset(subjectNode, objectNode, bbopEdge.predicate_id(), subjectEdges);
        const subjectActivityNode = activity.rootNode;

        subjectActivityNode.term = subjectNode.term;
        subjectActivityNode.date = subjectNode.date;
        subjectActivityNode.category = subjectNode.category;
        subjectActivityNode.rootTypes = subjectNode.rootTypes;
        subjectActivityNode.classExpression = subjectNode.classExpression;
        subjectActivityNode.setIsComplement(subjectNode.isComplement);
        subjectActivityNode.uuid = bbopSubjectId;
        self._graphToActivityDFS(camGraph, activity, subjectEdges, subjectActivityNode);
        activity.id = bbopSubjectId;

        activity.postRunUpdateCompliment();

        activity.postRunUpdate();

        activities.push(activity);
      }
    });

    return activities;

  }

  graphToMolecules(camGraph): Activity[] {
    const self = this;
    const activities: Activity[] = [];

    each(camGraph.all_nodes(), (bbopNode) => {
      const subjectNode = self.nodeToActivityNode(camGraph, bbopNode.id());

      if (subjectNode.hasRootType(EntityDefinition.GoChemicalEntity) && !subjectNode.hasRootType(EntityDefinition.GoMolecularEntity)) {
        const subjectEdges = camGraph.get_edges_by_subject(bbopNode.id())
        const objectEdges = camGraph.get_edges_by_object(bbopNode.id())

        const hasEnabledBy = find(objectEdges, (edge) => {
          return edge.predicate_id() === noctuaFormConfig.edge.enabledBy.id
        })

        if (!hasEnabledBy) {
          const activity: Activity = self.noctuaFormConfigService.createActivityBaseModel(ActivityType.molecule, subjectNode as ActivityNode);
          const subjectActivityNode = activity.rootNode;

          subjectActivityNode.term = subjectNode.term;
          subjectActivityNode.date = subjectNode.date;
          subjectActivityNode.classExpression = subjectNode.classExpression;
          subjectActivityNode.uuid = bbopNode.id();
          activity.id = bbopNode.id();
          self._graphToActivityDFS(camGraph, activity, subjectEdges, subjectActivityNode);
          //activity.postRunUpdate();
          activities.push(activity);
        }
      }

    });

    return activities
  }


  getCausalRelations(cam: Cam) {
    const self = this;
    const triples: Triple<Activity>[] = [];
    each(cam.activities, (subjectActivity: Activity) => {
      each(cam.graph.get_edges_by_subject(subjectActivity.id), (bbopEdge) => {
        const predicateId = bbopEdge.predicate_id();
        const evidence = self.edgeToEvidence(cam.graph, bbopEdge);
        const objectId = bbopEdge.object_id();
        const objectInfo = self.nodeToActivityNode(cam.graph, objectId);
        const edges = noctuaFormConfig.allEdges
        const causalEdge = this.noctuaFormConfigService.findEdge(predicateId)

        if (objectInfo.hasRootType(EntityDefinition.GoMolecularFunction)
          || objectInfo.hasRootType(EntityDefinition.GoChemicalEntity)) {
          const objectActivity = cam.findActivityById(objectId);
          const predicate = new Predicate(causalEdge, evidence)

          if (causalEdge.id === noctuaFormConfig.edge.hasInput.id) {
            predicate.isReverseLink = true;
            predicate.reverseLinkTitle = 'input of'
          }
          const triple = new Triple<Activity>(subjectActivity, objectActivity, predicate);

          if (triple.subject && triple.object) {
            triples.push(triple);
          }
        }
      });
    });

    return triples;
  }


  private _graphToActivityDFS(camGraph, activity: Activity, bbopEdges, subjectNode: ActivityNode) {
    const self = this;

    for (const bbopEdge of bbopEdges) {

      const bbopPredicateId = bbopEdge.predicate_id();

      const allowedPredicate = this.noctuaFormConfigService.shapePredicates.find((predicate) => {
        return predicate === bbopPredicateId;
      });

      const predExpr = this.noctuaFormConfigService.termLookupTable[bbopPredicateId];

      if (!allowedPredicate || !predExpr) continue


      const causalEdgeIds = noctuaFormConfig.causalEdges.map(edge => edge.id);

      let result = this.noctuaFormConfigService.shapePredicates.filter(
        item => !causalEdgeIds.includes(item));

      if (activity.activityType === ActivityType.bpOnly && subjectNode.term.id === noctuaFormConfig.rootNode.mf.id) {
        result = [...result, ...noctuaFormConfig.bpOnlyCausalEdges.map(edge => edge.id)]
      }

      if (!result.includes(bbopPredicateId)) continue;



      const bbopObjectId = bbopEdge.object_id();
      const evidence = self.edgeToEvidence(camGraph, bbopEdge);
      const comments = self.edgeComments(bbopEdge);
      const partialObjectNode = self.nodeToActivityNode(camGraph, bbopObjectId);
      //const objectNode = this._insertNode(activity, bbopPredicateId, subjectNode, partialObjectNode);
      const objectNode = this.noctuaFormConfigService.addActivityNodeShex(activity, subjectNode, predExpr, partialObjectNode);
      activity.updateShapeMenuShex();

      if (objectNode) {
        const triple: Triple<ActivityNode> = activity.getEdge(subjectNode.id, objectNode.id);
        if (triple) {
          triple.object.id = partialObjectNode.id;
          triple.object.uuid = partialObjectNode.uuid;
          triple.object.term = partialObjectNode.term;
          triple.object.date = partialObjectNode.date;
          triple.object.category = partialObjectNode.category;
          triple.object.rootTypes = partialObjectNode.rootTypes;
          triple.object.classExpression = partialObjectNode.classExpression;
          triple.object.setIsComplement(partialObjectNode.isComplement);
          triple.predicate.isComplement = triple.object.isComplement;
          triple.predicate.evidence = evidence;
          triple.predicate.comments = comments;
          triple.predicate.uuid = bbopEdge.id();
          self._graphToActivityDFS(camGraph, activity, camGraph.get_edges_by_subject(bbopObjectId), triple.object);
        }
      }
    }

    return activity;
  }

  private _compareSources(a: any, b: any) {
    return (a.value() > b.value()) ? -1 : 1;
  }

}