import {
    ActivityNode,
    ActivityNodeDisplay,
    GoCategory,
    categoryToClosure
} from './../../models/activity/activity-node';

import * as EntityDefinition from './entity-definition';
import { EntityLookup } from './../..//models/activity/entity-lookup';
import { Predicate } from './../../models/activity/predicate';
import { Entity } from './../../models/activity/entity';

const baseRequestParams = {
    defType: 'edismax',
    indent: 'on',
    qt: 'standard',
    wt: 'json',
    rows: '50',
    start: '0',
    packet: '1',
    callback_type: 'search',
    //fl: ['annotation_class'],
    qf: [
        'annotation_class^3',
        'annotation_class_label_searchable^5.5',
        'description_searchable^1',
        'comment_searchable^0.5',
        'synonym_searchable^1',
        'alternate_id^1',
        'isa_closure^1',
        'isa_closure_label_searchable^1'
    ],
    _: Date.now()
};

export const toGOCategory = (rootTypes: Entity[]): GoCategory[] => {
    const result = rootTypes.map((rootType) => {
        const category = new GoCategory()
        category.category = rootType.id
        return category
    });

    return result;
}

export const getTermLookup = (goCategories: GoCategory[]) => {
    let termLookup = null;
    if (goCategories && goCategories.length > 0) {
        const fqTermCategory = categoryToClosure(goCategories);
        termLookup = new EntityLookup(null,
            Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
                fq: [
                    'document_category:"ontology_class"',
                    fqTermCategory
                ],
            })
        );
    }

    return termLookup;
}

export const generateBaseTerm = (goCategories: GoCategory[], override: Partial<ActivityNodeDisplay> = {}): ActivityNode => {
    const activityNode = new ActivityNode();
    const predicate = new Predicate(null);
    const fqTermCategory = categoryToClosure(goCategories);
    const fqEvidenceCategory = categoryToClosure([EntityDefinition.GoEvidence]);
    activityNode.overrideValues(override);

    predicate.setEvidenceMeta('eco', Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
        fq: [
            'document_category:"ontology_class"',
            fqEvidenceCategory
        ],
    }));

    activityNode.predicate = predicate;

    if (goCategories && goCategories.length > 0) {
        activityNode.termLookup = new EntityLookup(null,
            Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
                fq: [
                    'document_category:"ontology_class"',
                    fqTermCategory
                ],
            })
        );
    }

    return activityNode;
};

export const setTermLookup = (activityNode: ActivityNode, goCategories: GoCategory[]) => {
    if (goCategories && goCategories.length > 0) {
        const fqTermCategory = categoryToClosure(goCategories);
        activityNode.termLookup = new EntityLookup(null,
            Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
                fq: [
                    'document_category:"ontology_class"',
                    fqTermCategory
                ],
            })
        );
    }
}


export const setEvidenceLookup = (predicate: Predicate): void => {
    const fqEvidenceCategory = categoryToClosure([EntityDefinition.GoEvidence]);

    predicate.setEvidenceMeta('eco', Object.assign({}, JSON.parse(JSON.stringify(baseRequestParams)), {
        fq: [
            'document_category:"ontology_class"',
            fqEvidenceCategory
        ],
    }));
};

