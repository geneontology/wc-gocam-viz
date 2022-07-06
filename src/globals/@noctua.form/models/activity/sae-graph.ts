
import { ActivityNode, ActivityNodeType } from './activity-node';
import { Triple } from './triple';
import { Predicate } from './predicate';

import {
  Graph,
  Edge,
  addNode,
  removeNode,
  removeEdge,
  addEdge,
  findEdge,
  findNode,
  getNodes,
  getEdges,
  addGraph,
} from './noctua-form-graph';
import { each, find, flatten } from 'lodash';

import { Graph as Graphlib } from 'graphlib';

export class SaeGraph<T extends ActivityNode> {
  numberOfEdges: number;
  graph: Graph<T, Triple<T>>;

  protected graphlib: Graphlib;

  constructor() {
    this.graph = <Graph<T, Triple<T>>>{ _nodes: {}, _edges: {} };
    this.graphlib = new Graphlib();
  }

  get nodes(): T[] {
    const keyNodes = getNodes(this.graph);

    return Object.values(keyNodes);
  }

  get edges(): Triple<T>[] {
    return this.getEdges(null);
  }

  exist(id: string): boolean {
    return id in this.graph._nodes;
  }

  getNode(id: string): T {
    return findNode(this.graph, id);
  }

  getNodes(ids: string[]): T[] {
    const self = this;
    const result: T[] = ids.map((id: string) => {
      return self.getNode(id);
    });

    return result;
  }

  addNode(node: T) {
    this.graphlib.setNode(node.id);
    return addNode(this.graph, node, node.id);
  }

  addNodes(...nodes: T[]) {
    const self = this;

    nodes.forEach((node: T) => {
      self.addNode(node);
    });
  }

  removeNode(node: T) {
    this.graphlib.removeNode(node.id);
    removeNode(this.graph, node.id);
  }

  addEdge(subjectNode: T, objectNode: T, predicate: Predicate) {

    const triple = new Triple(subjectNode, objectNode, predicate);
    const edge: Edge<Triple<T>> = { subjectId: subjectNode.id, objectId: objectNode.id, metadata: triple }

    this.graphlib.setEdge(triple.subject.id, triple.object.id);
    addEdge(this.graph, edge);
  }

  addEdgeById(sourceId: string, objectId: string, predicate: Predicate) {
    const source = this.getNode(sourceId);
    const object = this.getNode(objectId);

    this.addEdge(source, object, predicate);
  }

  editEdge(subjectId, objectId, srcEdge) {
    const destEdge = this.getEdge(subjectId, objectId);

  }

  getEdge(subjectId: string, objectId: string): Triple<T> {
    const srcEdge: Edge<Triple<T>> = { subjectId: subjectId, objectId: objectId, metadata: null };
    const destEdge = findEdge(this.graph, srcEdge);

    return destEdge ? destEdge.metadata : null;
  }

  getEdges(id: string): Triple<T>[] {
    const edges: Edge<Triple<T>>[] = getEdges(this.graph, id);

    return edges?.map((edge: Edge<Triple<T>>) => {
      return edge.metadata;
    });
  }

  removeEdge(subjectNode: T, objectNode: T, predicate: Predicate) {

    const triple = new Triple(subjectNode, objectNode, predicate);
    const edge: Edge<Triple<T>> = { subjectId: subjectNode.id, objectId: objectNode.id, metadata: triple };

    this.graphlib.removeEdge(subjectNode.id, objectNode.id)
    removeEdge(this.graph, edge);
  }

  sourceNodes() {
    const ids = this.graphlib.sources();
    return this.getNodes(ids);
  }


  successors(id: string): T[] {
    const ids = this.graphlib.successors(id) as string[];
    return this.getNodes(ids);
  }

  descendants(id: string) {
    const ids = this._descendantsDFS(id);
    return this.getNodes(ids);
  }

  private _descendantsDFS(id: string) {
    const self = this;
    const down = this.graphlib.successors(id) as string[];

    if (!down) return [];
    return flatten(
      down.concat(down.map(function (u) { return self._descendantsDFS(u); })));
  }

  getTrimmedGraph(startNodeId: string): Graph<T, Triple<T>> {
    const self = this;
    const graph = <Graph<T, Triple<T>>>{ _nodes: {}, _edges: {} };
    const startingEdges = self.getEdges(startNodeId);
    const startingNode = self.getNode(startNodeId);

    addNode(graph, startingNode, startingNode.id);

    each(startingEdges, (triple: Triple<T>) => {
      self._trimGraphDFS(graph, triple.subject, triple.object, triple.predicate, triple.predicate);
    });

    return graph;
  }

  edgeTypeExist(
    id: string,
    edgeId: string,
    subjectType: ActivityNodeType,
    objectType: ActivityNodeType) {
    const self = this;
    const result = find(self.getEdges(id), (triple: Triple<T>) => {
      return triple.predicate.edge.id === edgeId &&
        triple.subject.type === subjectType &&
        triple.object.type === objectType;
    });

    return result;
  }



  private _trimGraphDFS(graph: Graph<T, Triple<T>>,
    subjectNode: T,
    objectNode: T,
    subjectPredicate: Predicate,
    objectPredicate: Predicate) {
    const self = this;
    if (objectNode.hasValue()) {
      const destPredicate = new Predicate(subjectPredicate.edge, objectPredicate.evidence);
      const triple = new Triple(subjectNode, objectNode, destPredicate);
      const edge: Edge<Triple<T>> = { subjectId: subjectNode.id, objectId: objectNode.id, metadata: triple };

      addNode(graph, objectNode, objectNode.id);
      addEdge(graph, edge);
    }

    each(self.getEdges(objectNode.id), (triple: Triple<T>) => {
      self._trimGraphDFS(graph,
        objectNode.hasValue() ? objectNode : subjectNode,
        triple.object,
        objectNode.hasValue() ? triple.predicate : subjectPredicate,
        triple.predicate);
    });
  }


}