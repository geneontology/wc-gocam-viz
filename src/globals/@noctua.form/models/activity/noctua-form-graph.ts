import { find, each, omit, pickBy, mapKeys, mapValues, remove, difference, differenceWith } from 'lodash';
import { ActivityNode } from './activity-node';

export type Edge<EdgeMetadata> = { subjectId: string, objectId: string, metadata: EdgeMetadata };
export interface Graph<Node, EdgeMetadata> {
    _nodes: { [key: string]: Node };
    _edges: { [key: string]: Edge<EdgeMetadata>[] };
}

export const empty = () => ({ _nodes: {}, _edges: {} });

export function addNode<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    node: Node,
    key: string
): Graph<Node, EdgeMetadata> {
    graph._nodes[key] = node;
    graph._edges[key] = [];
    return graph;
}

export function findNode<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    key: string
): Node | null {
    return graph._nodes[key];
}

export function removeNode<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    key: string
) {
    delete graph._nodes[key];
}

export function getNodes<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>
): Record<string, Node> {
    return graph._nodes;
}

export function getEdges<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    id?: string
): Edge<EdgeMetadata>[] {

    if (id) {
        return graph._edges[id];
    }

    const edges: Edge<EdgeMetadata>[] = [];

    Object.keys(graph._edges).forEach((key) => {
        edges.push(...graph._edges[key]);
    });

    return edges;
}

export function addEdge<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    edge: Edge<EdgeMetadata>,
): Graph<Node, EdgeMetadata> {
    graph._edges[edge.subjectId].push(edge);
    return graph;
}

export function findEdge<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    edge: Edge<EdgeMetadata>
): Edge<EdgeMetadata> {
    return find(graph._edges[edge.subjectId], (e: Edge<EdgeMetadata>) => {
        return e.objectId === edge.objectId;
    });
}

export function removeEdge<Node, EdgeMetadata>(
    graph: Graph<Node, EdgeMetadata>,
    edge: Edge<EdgeMetadata>
): Graph<Node, EdgeMetadata> {
    remove(graph._edges[edge.subjectId], (e: Edge<EdgeMetadata>) => {
        return e.objectId === edge.objectId;
    });
    return graph;
}

export function compareNode<Node extends ActivityNode>(a: Node, b: Node) {
    return a.uuid === b.uuid;
}

export function compareTriple<EdgeMetadata>(a: Edge<EdgeMetadata>, b: Edge<EdgeMetadata>) {
    return a.subjectId === b.subjectId && a.objectId === b.objectId;
}


export function addGraph<Node, EdgeMetadata>(
    graph1: Graph<Node, EdgeMetadata>,
    graph2: Graph<Node, EdgeMetadata>,
    toNodeId: string,
    fromNodeId: string
) {
    const keys1 = Object.keys(getNodes(graph1));
    const nodes2 = getNodes(graph2);
    const edges1 = getEdges(graph1);
    const edges2 = getEdges(graph2);

    each(nodes2, (node: Node, key: string) => {
        //   const node = findNode(graph1, key);        
        addNode(graph1, node, key);
    });

    each(edges2, (edge: Edge<EdgeMetadata>) => {
        if (edge.objectId === toNodeId) {

        }
        addEdge(graph1, edge);
    });
}

export function subtractNodes<Node extends ActivityNode, EdgeMetadata>(
    graph1: Graph<Node, EdgeMetadata>,
    graph2: Graph<Node, EdgeMetadata>
): Node[] {
    const keys1 = Object.values(getNodes(graph1));
    const keys2 = Object.values(getNodes(graph2));
    return differenceWith(keys1, keys2, compareNode);
}

export function subtractEdges<Node, EdgeMetadata>(
    graph1: Graph<Node, EdgeMetadata>,
    graph2: Graph<Node, EdgeMetadata>
): EdgeMetadata[] {
    const edges1 = getEdges(graph1);
    const edges2 = getEdges(graph2);
    const edges: Edge<EdgeMetadata>[] = differenceWith(edges1, edges2, compareTriple);

    return edges.map((edge: Edge<EdgeMetadata>) => {
        return edge.metadata;
    });
}

export function subtractGraph<Node, EdgeMetadata>(
    graph1: Graph<Node, EdgeMetadata>,
    graph2: Graph<Node, EdgeMetadata>
): Graph<Node, EdgeMetadata> {
    const result: Graph<Node, EdgeMetadata> = <Graph<Node, EdgeMetadata>>{ _nodes: {}, _edges: {} };
    const keys1 = Object.keys(getNodes(graph1));
    const keys2 = Object.keys(getNodes(graph2));
    const edges1 = getEdges(graph1);
    const edges2 = getEdges(graph2);
    const nodeIds: string[] = difference(keys1, keys2);
    const edgeIds: Edge<EdgeMetadata>[] = differenceWith(edges1, edges2, compareTriple);

    each(nodeIds, (nodeId: string) => {
        const node = findNode(graph1, nodeId);
        addNode(result, node, nodeId);
    });

    each(edgeIds, (edge: Edge<EdgeMetadata>) => {
        // addEdge(result, edge);
    });

    return result;
}
