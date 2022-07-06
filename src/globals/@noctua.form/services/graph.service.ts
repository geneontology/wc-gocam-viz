

import * as ModelDefinition from './../data/config/model-definition';
import * as EntityDefinition from './../data/config/entity-definition';

import { noctuaFormConfig } from './../noctua-form-config';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { Activity, ActivityType } from './../models/activity/activity';
import { find, each, chain, uniq } from 'lodash';
import { CurieService } from './../../@noctua.curie/services/curie.service';
import { ActivityNode, ActivityNodeType, compareTerm } from './../models/activity/activity-node';
import { Cam } from './../models/activity/cam';
import { Entity } from './../models/activity/entity';
import { compareEvidence, compareEvidenceDate, compareEvidenceEvidence, compareEvidenceReference, compareEvidenceWith, Evidence } from './../models/activity/evidence';
import { Predicate } from './../models/activity/predicate';
import { Triple } from './../models/activity/triple';
import { TermsSummary } from './../models/activity/summary';
import { Article } from './../models/article';
import { Contributor, equalContributor } from '../models/contributor';
import * as moment from 'moment';

declare const require: any;

const model = require('bbop-graph-noctua');
const amigo = require('amigo2');


export class NoctuaGraphService {
  linker = new amigo.linker();
  curieUtil: any;


  constructor(
    private curieService: CurieService,
    public noctuaFormConfigService: NoctuaFormConfigService) {

    this.curieUtil = this.curieService.getCurieUtil();
  }


  getTermURL(id: string) {
    const self = this;

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
      return self.linker.url(id);
    }
  }


  getMetadata(responseData) {
    const self = this;
    const noctua_graph = model.graph;
    const cam = new Cam()

    cam.graph = new noctua_graph();
    cam.graph.load_data_basic(responseData);

    cam.id = responseData.id;
    cam.model = Object.assign({}, {
      modelInfo: this.noctuaFormConfigService.getModelUrls(cam.id)
    });
    cam.modified = responseData['modified-p'];

    const titleAnnotations = cam.graph.get_annotations_by_key('title');
    const stateAnnotations = cam.graph.get_annotations_by_key('state');
    const dateAnnotations = cam.graph.get_annotations_by_key('date');
    const groupAnnotations = cam.graph.get_annotations_by_key('providedBy');
    const contributorAnnotations = cam.graph.get_annotations_by_key('contributor');

    cam.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
    cam.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);

    if (dateAnnotations.length > 0) {
      cam.date = dateAnnotations[0].value();
    }

    if (titleAnnotations.length > 0) {
      cam.title = titleAnnotations[0].value();
    }

    if (stateAnnotations.length > 0) {
      cam.state = self.noctuaFormConfigService.findModelState(stateAnnotations[0].value());
    }

    return cam;

  }


  loadCam(cam: Cam) {
    const self = this;
    const activities = self.graphToActivities(cam.graph);

    const molecules = self.graphToMolecules(cam.graph);

    activities.push(...molecules);

    cam.activities = activities;
    cam.causalRelations = self.getCausalRelations(cam);
    self.getActivityLocations(cam)


    cam.updateProperties()
  }

  getNodeInfo(node) {
    const result: any = {};

    each(node.types(), function (srcType) {
      const type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;

      result.id = type.class_id();
      result.label = type.class_label();
      result.classExpression = type;
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
    const result = {
      uuid: objectId,
      date: self.getNodeDate(node),
      term: new Entity(nodeInfo.id, nodeInfo.label, self.linker.url(nodeInfo.id), objectId),
      rootTypes: self.getNodeRootInfo(node),
      classExpression: nodeInfo.classExpression,
      location: self.getNodeLocation(node),
      isComplement: self.getNodeIsComplement(node),
    };

    return new ActivityNode(result);
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

        if (groupAnnotations.length > 0) {
          //evidence.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);
        }

        if (contributorAnnotations.length > 0) {
          // evidence.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
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
    this.addSummaryEvidences(camGraph, termsSummary)

    return termsSummary
  }

  addSummaryEvidences(camGraph, termsSummary: TermsSummary) {
    const self = this;
    const evidences: Evidence[] = [];
    const frequency = {};
    const contributors = [];
    const relations: string[] = [];

    each(camGraph.all_edges(), (bbopEdge) => {
      const bbopPredicateId = bbopEdge.predicate_id();
      const evidence = self.edgeToEvidence(camGraph, bbopEdge);

      relations.push(bbopPredicateId)
      frequency[bbopPredicateId] = frequency[bbopPredicateId] ? frequency[bbopPredicateId] + 1 : 1;
      termsSummary.relations.frequency++;

      evidence.forEach((evidence: Evidence) => {
        evidences.push(evidence)
        const evidenceHash = evidence.evidence.id + evidence.referenceEntity.id + evidence.withEntity.id
        frequency[evidence.evidence.id] = frequency[evidence.evidence.id] ? frequency[evidence.evidence.id] + 1 : 1;
        frequency[evidenceHash] = frequency[evidenceHash] ? frequency[evidenceHash] + 1 : 1;
        frequency[evidence.referenceEntity.id] = frequency[evidence.referenceEntity.id] ? frequency[evidence.referenceEntity.id] + 1 : 1;
        frequency[evidence.withEntity.id] = frequency[evidence.withEntity.id] ? frequency[evidence.withEntity.id] + 1 : 1;
        frequency[evidence.date] = frequency[evidence.date] ? frequency[evidence.date] + 1 : 1;
        evidence.contributors.map((contributor: Contributor) => {
          frequency[contributor.orcid] = frequency[contributor.orcid] ? frequency[contributor.orcid] + 1 : 1;
          termsSummary.contributors.frequency++;
          contributors.push(contributor)
        });

        termsSummary.evidences.frequency++;
        termsSummary.evidenceEcos.frequency++;
        termsSummary.dates.frequency++;


        if (evidence.referenceEntity.id) {
          termsSummary.references.frequency++;
        }

        if (evidence.withEntity.id) {
          termsSummary.withs.frequency++;
        }

        if (evidence.referenceEntity?.label.trim().startsWith('PMID')) {
          termsSummary.papers.frequency++;
        }
      })
    });

    const uniqueRelations = uniq(relations)

    const uniqueDates = chain(evidences)
      .uniqWith(compareEvidenceDate)
      .value();

    const uniqueEvidence = chain(evidences)
      .uniqWith(compareEvidence)
      .value();

    const uniqueEvidenceEco = chain(evidences)
      .uniqWith(compareEvidenceEvidence)
      .value();

    const uniqueReference = chain(evidences)
      .uniqWith(compareEvidenceReference)
      .value();

    const uniqueWith = chain(evidences)
      .uniqWith(compareEvidenceWith)
      .value();

    const uniqueContributors = chain(contributors)
      .uniqWith(equalContributor)
      .value();

    each(uniqueDates, (evidence: Evidence) => {
      const dateEntity = new Entity(evidence.date, evidence.formattedDate)
      dateEntity.frequency = frequency[evidence.date]
      termsSummary.dates.append(dateEntity)
    })

    each(uniqueRelations, (relationId: string) => {
      const edge = self.noctuaFormConfigService.findEdge(relationId);
      edge.frequency = frequency[relationId]
      termsSummary.relations.append(edge)
    })

    each(uniqueEvidence, (evidence: Evidence) => {
      const evidenceHash = evidence.evidence.id + evidence.referenceEntity.id + evidence.withEntity.id
      evidence.frequency = frequency[evidenceHash]
      termsSummary.evidences.append(evidence)
    })

    each(uniqueEvidenceEco, (evidence: Evidence) => {
      evidence.evidence.frequency = frequency[evidence.evidence.id]
      termsSummary.evidenceEcos.append(evidence.evidence)
    })

    each(uniqueReference, (evidence: Evidence) => {
      evidence.referenceEntity.frequency = frequency[evidence.evidence.id]
      termsSummary.references.append(evidence.referenceEntity)
    })

    each(uniqueWith, (evidence: Evidence) => {
      evidence.withEntity.frequency = frequency[evidence.evidence.id]
      termsSummary.withs.append(evidence.withEntity)
    })

    each(uniqueReference, (evidence: Evidence) => {
      if (evidence.referenceEntity && evidence.referenceEntity?.id.trim().startsWith('PMID')) {
        const article = new Article()
        article.id = evidence.referenceEntity.id.trim()
        article.frequency = frequency[evidence.referenceEntity.id]
        termsSummary.papers.append(article)
      }
    })

    each(uniqueContributors, (contributor: Contributor) => {
      contributor.frequency = frequency[contributor.orcid]
      termsSummary.contributors.append(contributor)
    })
  }

  getActivityPreset(subjectNode: Partial<ActivityNode>, objectNode: Partial<ActivityNode>, predicateId, bbopSubjectEdges): Activity {
    const self = this;
    let activityType = ActivityType.default;

    if ((predicateId === noctuaFormConfig.edge.partOf.id ||
      predicateId === noctuaFormConfig.edge.locatedIn.id ||
      predicateId === noctuaFormConfig.edge.isActiveIn.id) &&
      subjectNode.hasRootType(EntityDefinition.GoMolecularEntity)) {

      activityType = ActivityType.ccOnly;
    } else if (subjectNode.term.id === noctuaFormConfig.rootNode.mf.id) {
      each(bbopSubjectEdges, function (subjectEdge) {
        if (find(noctuaFormConfig.causalEdges, { id: subjectEdge.predicate_id() })) {
          activityType = ActivityType.bpOnly;
        }
      });
    } else if (objectNode.hasRootType(EntityDefinition.GoProteinContainingComplex)) {
      activityType = ActivityType.proteinComplex;
    }

    return self.noctuaFormConfigService.createActivityBaseModel(activityType);
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
        subjectActivityNode.classExpression = subjectNode.classExpression;
        subjectActivityNode.setIsComplement(subjectNode.isComplement);
        subjectActivityNode.uuid = bbopSubjectId;
        self._graphToActivityDFS(camGraph, activity, subjectEdges, subjectActivityNode);
        activity.id = bbopSubjectId;

        activity.postRunUpdateCompliment();

        // if (environment.isGraph) {
        activity.postRunUpdate();
        // }

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
          const activity: Activity = self.noctuaFormConfigService.createActivityBaseModel(ActivityType.molecule);
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
        const edges = [...noctuaFormConfig.causalEdges, ...noctuaFormConfig.moleculeEdges];
        const causalEdge = <Entity>find(edges, {
          id: predicateId
        });

        if (causalEdge) {
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
        }
      });
    });

    return triples;
  }



  getActivityLocations(cam: Cam) {
    const locations = localStorage.getItem(`activityLocations-${cam.id}`);

    if (locations) {
      const activityLocations = JSON.parse(locations)
      cam.activities.forEach((activity: Activity) => {
        const activityLocation = find(activityLocations, { id: activity.id })
        if (activityLocation) {
          activity.position.x = activityLocation.x;
          activity.position.y = activityLocation.y
        }
      })
    }
  }

  setActivityLocations(cam: Cam) {
    const locations = cam.activities.map((activity: Activity) => {
      return {
        id: activity.id,
        x: activity.position.x,
        y: activity.position.y
      }
    })
    localStorage.setItem(`activityLocations-${cam.id}`, JSON.stringify(locations));
  }


  private _graphToActivityDFS(camGraph, activity: Activity, bbopEdges, subjectNode: ActivityNode) {
    const self = this;

    each(bbopEdges, (bbopEdge) => {
      const bbopPredicateId = bbopEdge.predicate_id();
      const bbopObjectId = bbopEdge.object_id();
      const evidence = self.edgeToEvidence(camGraph, bbopEdge);
      const partialObjectNode = self.nodeToActivityNode(camGraph, bbopObjectId);
      const objectNode = this._insertNode(activity, bbopPredicateId, subjectNode, partialObjectNode);

      activity.updateEntityInsertMenu();

      if (objectNode) {
        const triple: Triple<ActivityNode> = activity.getEdge(subjectNode.id, objectNode.id);
        if (triple) {
          triple.object.uuid = partialObjectNode.uuid;
          triple.object.term = partialObjectNode.term;
          triple.object.date = partialObjectNode.date;
          triple.object.classExpression = partialObjectNode.classExpression;
          triple.object.setIsComplement(partialObjectNode.isComplement);
          triple.predicate.isComplement = triple.object.isComplement;
          triple.predicate.evidence = evidence;
          triple.predicate.uuid = bbopEdge.id();
          self._graphToActivityDFS(camGraph, activity, camGraph.get_edges_by_subject(bbopObjectId), triple.object);
        }
      }
    });

    return activity;
  }

  private _insertNode(activity: Activity, bbopPredicateId: string, subjectNode: ActivityNode,
    partialObjectNode: Partial<ActivityNode>): ActivityNode {
    const nodeDescriptions: ModelDefinition.InsertNodeDescription[] = subjectNode.canInsertNodes;
    let objectNode;

    each(nodeDescriptions, (nodeDescription: ModelDefinition.InsertNodeDescription) => {
      if (bbopPredicateId === nodeDescription.predicate.id) {
        if (partialObjectNode.hasRootTypes(nodeDescription.node.category)) {
          objectNode = ModelDefinition.insertNode(activity, subjectNode, nodeDescription);
          return false;
        }
      }
    });

    return objectNode;
  }




  private _compareSources(a: any, b: any) {
    return (a.value() > b.value()) ? -1 : 1;
  }

}