import vpeJson from '../../data/vpe-decision.json'


export function getVPEEdge(relationship: string, effectDirection?: string, directness?: string): string | undefined {
  const tree = vpeJson['tree'];
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