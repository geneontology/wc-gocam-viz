import { orderBy } from "lodash";
import { Article } from "../article";
import { Contributor } from "../contributor";
import { ActivityNode } from "./activity-node";
import { Entity } from "./entity";
import { Evidence } from "./evidence";

export class CamSummary<T extends Entity | Evidence | ActivityNode | Article | Contributor> {
  label: string
  shorthand: string
  count: number = 0;
  frequency = 0
  tooltip = ''
  nodes: T[] = [];

  constructor(label?: string, shorthand?: string) {
    this.label = label ? label : null
    this.shorthand = shorthand ? shorthand : null
  }

  getSortedNodes() {
    return orderBy(this.nodes, ['frequency'], ['desc'])
  }

  append(node: T) {
    this.nodes.push(node)
    this.count = this.nodes.length
    if (node instanceof ActivityNode) {
      this.tooltip += `${node.term.label} (${node.term.id}) \n`
    } else if (node instanceof Evidence) {
      this.tooltip += `${node.evidence.label} (${node.evidence.id}) \n
                        ${node.referenceEntity.label} \n
                        ${node.withEntity.label} \n`
    }
  }
}

export class TermsSummary {
  bp = new CamSummary<ActivityNode>('Biological Process', 'BP');
  cc = new CamSummary<ActivityNode>('Cellular Component', 'CC');
  mf = new CamSummary<ActivityNode>('Molecular Function', 'MF');
  gp = new CamSummary<ActivityNode>('Gene Product', 'GP');
  other = new CamSummary<ActivityNode>('Other');
  evidences = new CamSummary<Evidence>('Evidence(Full)');
  evidenceEcos = new CamSummary<Entity>('Evidence Codes');
  references = new CamSummary<Entity>('Reference');
  withs = new CamSummary<Entity>('With/From');
  papers = new CamSummary<Article>('PMID Papers');
  contributors = new CamSummary<Contributor>('Contribution');
  relations = new CamSummary<Entity>('Relations');
  dates = new CamSummary<Entity>('Dates');

  allTerms: ActivityNode[] = [];
  nodes = [];
  coverage: number;

  constructor() {
    this.nodes = [
      this.mf, this.bp, this.cc,
    ]
  }

}