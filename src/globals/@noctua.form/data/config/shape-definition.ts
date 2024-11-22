import { noctuaFormConfig } from './../../noctua-form-config';
import { Entity } from './../../models/activity/entity';
import * as EntityDefinition from './entity-definition';
import { ActivityNodeDisplay, ActivityNodeType } from './../../models/activity/activity-node';
import { cloneDeep, each, uniqWith } from 'lodash';

import shexJson from './../shapes.json'
import shapeTerms from './../shape-terms.json'
import { ShexShapeAssociation } from '../shape';
import { DataUtils } from './data-utils';

export enum CardinalityType {
    none = 'none',
    oneToOne = 'oneToOne',
    oneToMany = 'oneToMany',
}

export interface ShapeDescription {
    id: string;
    label: string;
    node: ActivityNodeDisplay;
    predicate: Entity;
    cardinality: CardinalityType;
}

export interface PredicateExpression {
    id: string;
    label: string;
    cardinality: number;
}

const addCausalEdges = (edges: Entity[]): ShapeDescription[] => {
    const causalShapeDescriptions: ShapeDescription[] = [];

    each(edges, (edge: Entity) => {
        causalShapeDescriptions.push({
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: `MF ${edge.label} BP`,
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isKey: true,
                relationEditable: true,
                weight: 10,
            },
            predicate: edge,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription);
    });

    return causalShapeDescriptions;
};

export function compareRange(a, b) {
    return a.id === b.id;
}

export const getShexJson = (subjectIds: string[], excludeFromExtensions = true) => {
    const pred = []
    const lookupTable = DataUtils.genTermLookupTable();
    const shapes = shexJson.goshapes as ShexShapeAssociation[];
    subjectIds.forEach((subjectId: string) => {
        const subjectShapes = DataUtils.getSubjectShapes(shapes, subjectId, excludeFromExtensions);
        if (subjectShapes) {
            const entities = DataUtils.getRangeLabels(subjectShapes, lookupTable)

            pred.push(...entities)
        }
    });

    return uniqWith(pred, compareRange) as any

    // return pred
}


// ORDER MATTERS A LOT
// What can you insert
export const canInsertEntity = {
    [ActivityNodeType.GoMolecularEntity]: [
        <ShapeDescription>{
            label: 'Add part of (Protein Complex)',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(GP) part of (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 3,
                isKey: false,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'Add located in (CC)',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoCellularComponent,
                category: [EntityDefinition.GoCellularComponent],
                label: '(GP) located in (CC)',
                aspect: 'C',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 10,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.locatedIn,
            cardinality: CardinalityType.oneToMany
        },
    ],

    [ActivityNodeType.GoProteinContainingComplex]: [
        <ShapeDescription>{
            label: 'Add has part (Gene Product)',
            id: ActivityNodeType.GoMolecularEntity,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(Protein Complex) has part (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                weight: 3,
                isKey: false,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasPart,
            cardinality: CardinalityType.oneToMany
        },
    ],
    [ActivityNodeType.GoMolecularFunction]: [
        <ShapeDescription>{
            label: 'Add enabled by Protein Complex',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: <ActivityNodeDisplay>{
                id: EntityDefinition.GoProteinContainingComplex.id,
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            },
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add enabled by GP',
            id: ActivityNodeType.GoMolecularEntity,
            node: <ActivityNodeDisplay>{
                id: EntityDefinition.GoMolecularEntity.id,
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            },
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add part of (BP)',
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: '(MF) part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                weight: 10,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add occurs in (CC)',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoCellularComponent,
                category: [EntityDefinition.GoCellularComponent],
                label: '(MF) occurs in (CC)',
                aspect: 'C',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 20,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add occurs in (Cell Type)',
            id: ActivityNodeType.GoCellTypeEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellTypeEntity],
                type: ActivityNodeType.GoCellTypeEntity,
                label: 'occurs in (Cell Type)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: false,
                weight: 30,

            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add occurs in (Anatomy)',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'occurs in (Anatomy)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add occurs in (Organism)',
            id: ActivityNodeType.GoOrganism,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoOrganism,
                label: 'part of (Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 50,
            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add Has Input (Chemical/Protein Containing Complex)',
            id: ActivityNodeType.GoChemicalEntityHasInput,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoChemicalEntity, EntityDefinition.GoProteinContainingComplex],
                type: ActivityNodeType.GoChemicalEntityHasInput,
                label: 'has input (Chemical/Protein Containing Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 4,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasInput,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'Add Has Output (Chemical/Protein Containing Complex)',
            id: ActivityNodeType.GoChemicalEntityHasOutput,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoChemicalEntity, EntityDefinition.GoProteinContainingComplex],
                type: ActivityNodeType.GoChemicalEntityHasOutput,
                label: 'has output (Chemical/Protein Containing Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 5,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasOutput,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'Add Happens During (Biological Phase)',
            id: ActivityNodeType.GoBiologicalPhase,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoBiologicalPhase, EntityDefinition.UberonStage],
                type: ActivityNodeType.GoBiologicalPhase,
                label: 'happens during (Biological Phase)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 3,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.happensDuring,
            cardinality: CardinalityType.oneToOne
        },

        <ShapeDescription>{
            label: 'Add has part (Subfunction)',
            id: ActivityNodeType.GoMolecularFunction,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoMolecularFunction,
                category: [EntityDefinition.GoMolecularFunction],
                label: 'has part (Subfunction)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 100,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasPart,
            cardinality: CardinalityType.oneToMany
        },

        // Causal Edges
        ...addCausalEdges([
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithin),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOf),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithinPositiveEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithinNegativeEffect),
        ])
    ],
    [ActivityNodeType.GoBiologicalProcess]: [
        <ShapeDescription>{
            label: 'Add part of (BP)',
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoBiologicalProcess],
                type: ActivityNodeType.GoBiologicalProcess,
                label: 'part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 10,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add occurs in (CC)',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellularComponent],
                type: ActivityNodeType.GoCellularComponent,
                aspect: 'C',
                label: 'occurs in (CC)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 20
            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add Has Input (Chemical/Anatomical Entity/Protein Containing Complex)',
            id: ActivityNodeType.GoChemicalEntityHasInput,
            node: <ActivityNodeDisplay>{
                category: [
                    EntityDefinition.GoChemicalEntity,
                    EntityDefinition.GoAnatomicalEntity,
                    EntityDefinition.GoProteinContainingComplex
                ],
                type: ActivityNodeType.GoChemicalEntityHasInput,
                label: 'Has Input (Chemical/Anatomical Entity/Protein Containing Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 14,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasInput,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'Add Has Output (Chemical/Anatomical Entity/Protein Containing Complex)',
            id: ActivityNodeType.GoChemicalEntityHasInput,
            node: <ActivityNodeDisplay>{
                category: [
                    EntityDefinition.GoChemicalEntity,
                    EntityDefinition.GoAnatomicalEntity,
                    EntityDefinition.GoProteinContainingComplex
                ],
                type: ActivityNodeType.GoChemicalEntityHasOutput,
                label: 'Has Output (Chemical/Anatomical Entity/Protein Containing Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 14,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasOutput,
            cardinality: CardinalityType.oneToMany
        },
    ],
    [ActivityNodeType.GoCellularComponent]: [
        <ShapeDescription>{
            label: 'Add part of (CC)',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellularComponent],
                type: ActivityNodeType.GoCellularComponent,
                aspect: 'C',
                label: 'part of (CC)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 20,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add part of (Cell Type)',
            id: ActivityNodeType.GoCellTypeEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellTypeEntity],
                type: ActivityNodeType.GoCellTypeEntity,
                label: 'part of (Cell Type)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 30,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add part of (Anatomy)',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (Anatomy)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add part of (Organism)',
            id: ActivityNodeType.GoOrganism,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoOrganism,
                label: 'part of (Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 50,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add Existence Overlaps (BP/Phase/Stage)',
            id: ActivityNodeType.BPPhaseStageExistenceOverlaps,
            node: <ActivityNodeDisplay>{
                category: [
                    EntityDefinition.GoBiologicalProcess,
                    EntityDefinition.UberonStage,
                ],
                type: ActivityNodeType.BPPhaseStageExistenceOverlaps,
                label: 'existence overlaps (BP/Phase/Stage)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 60,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.existenceOverlaps,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'Add Existence Starts and Ends During (BP/Phase/Stage)',
            id: ActivityNodeType.BPPhaseStageExistenceStartsEnds,
            node: <ActivityNodeDisplay>{
                category: [
                    EntityDefinition.GoBiologicalProcess,
                    EntityDefinition.UberonStage
                ],
                type: ActivityNodeType.BPPhaseStageExistenceStartsEnds,
                label: 'Add Existence Starts and Ends During (BP/Phase/Stage)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 61,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.existenceStartsEndsDuring,
            cardinality: CardinalityType.oneToMany
        },
    ],
    [ActivityNodeType.GoCellTypeEntity]: [
        <ShapeDescription>{
            label: 'Add part of (Anatomy)',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (Anatomy)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'Add part of (Organism)',
            id: ActivityNodeType.GoOrganism,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoOrganism,
                label: 'part of (Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 50,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        }
    ],
    [ActivityNodeType.GoAnatomicalEntity]: [
        <ShapeDescription>{
            label: 'Add part of (Organism)',
            id: ActivityNodeType.GoOrganism,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoOrganism,
                label: 'part of (Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 50,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        }
    ],
    [ActivityNodeType.GoChemicalEntity]: [
        <ShapeDescription>{
            label: 'Add located in (CC)',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellularComponent],
                type: ActivityNodeType.GoCellularComponent,
                aspect: 'C',
                label: 'located in (CC)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 20,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.locatedIn,
            cardinality: CardinalityType.oneToOne
        },
    ]
};



