import {
    ActivityNode,
    ActivityNodeType,
    ActivityNodeDisplay,
    GoCategory,
    categoryToClosure
} from './../../models/activity/activity-node';
import { Predicate } from './../../models/activity/predicate';

export const GoProteinContainingComplex = {
    id: ActivityNodeType.GoProteinContainingComplex,
    category: 'GO:0032991',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCellularComponent = {
    id: ActivityNodeType.GoCellularComponent,
    category: 'GO:0005575',
    categoryType: 'isa_closure',
    suffix: `OR NOT ${GoProteinContainingComplex.categoryType}:"${GoProteinContainingComplex.category}"`,
} as GoCategory;

export const GoAllCellularComponent = {
    id: ActivityNodeType.GoCellularComponent,
    category: 'GO:0005575',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCellularAnatomical = {
    id: ActivityNodeType.GoCellularAnatomical,
    category: 'GO:0110165',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoBiologicalProcess = {
    id: ActivityNodeType.GoBiologicalProcess,
    category: 'GO:0008150',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoMolecularFunction = {
    id: ActivityNodeType.GoMolecularFunction,
    category: 'GO:0003674',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoMolecularEntity = {
    id: ActivityNodeType.GoMolecularEntity,
    category: 'CHEBI:33695',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoChemicalEntity = {
    id: ActivityNodeType.GoChemicalEntity,
    category: 'CHEBI:24431',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoEvidence = {
    id: ActivityNodeType.GoEvidence,
    category: 'ECO:0000352',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoEvidenceNode = {
    id: ActivityNodeType.GoEvidence,
    category: 'ECO:0000000',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoCellTypeEntity = {
    id: ActivityNodeType.GoCellTypeEntity,
    category: 'CL:0000003',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoAnatomicalEntity = {
    id: ActivityNodeType.GoAnatomicalEntity,
    category: 'CARO:0000000',
    categoryType: 'isa_closure',
} as GoCategory;

export const GoOrganism = {
    id: ActivityNodeType.GoOrganism,
    category: 'NCBITaxon',
    categoryType: 'idspace',
} as GoCategory;

export const GoBiologicalPhase = {
    id: ActivityNodeType.GoBiologicalPhase,
    category: 'GO:0044848',
    categoryType: 'isa_closure',
} as GoCategory;

export const UberonStage = {
    id: ActivityNodeType.UberonStage,
    category: 'UBERON:0000105',
    categoryType: 'isa_closure',
} as GoCategory;

export const generateBaseTerm = (goCategories: GoCategory[], override: Partial<ActivityNodeDisplay> = {}): ActivityNode => {
    const activityNode = new ActivityNode();
    const predicate = new Predicate(null);

    activityNode.predicate = predicate;


    activityNode.overrideValues(override);

    return activityNode;
};

