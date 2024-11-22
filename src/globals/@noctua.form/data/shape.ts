




/**
 * GO domain/range constraint shape is defined as the domain, relationship, and range of a GO shape  expression rule
 */

export interface ShexShapeAssociation {


    /**
     * The domain of the GO shape expression rule, this is the subject of the relationship.
     */
    subject?: string,


    /**
     * The predicate is the relationship between the domain and  range of the GO shape expression rule.
     */
    predicate?: string,


    /**
     * The range of the relationship identified by the Relationship.id parameter (This contains the values can be provided in the object of a statement)
     */
    object?: string[],


    /**
     * for this shape, the relationship in question supports multiple values in the object of the association.
     */
    is_multivalued?: boolean,


    /**
     * None
     */
    is_required?: boolean,


    /**
     * used to determine if this shape is used in the the visual pathway editor or the graphical editor.  Those shapes annotated with like this https://github.com/geneontology/go-shapes/pull/285/files will be exlcuded from the visual pathway editor but still included in the file so this file can be used in the graphical editor as well.
     */
    context?: string,


    /**
     * used to determine if this shape is used in the the visual pathway editor or the graphical editor.  Those shapes annotated with like this
     */
    exclude_from_extensions?: boolean,

}


/**
 * A collection of GO domain/range constraint shapes.  This is primarily used in this schema to allow several  test data objects to be submitted in a single file. 
 */

export interface ShexShapeCollection {


    /**
     * A collectionm of GO domain/range constraint shapes where a GO domain/range constraint shape  is defined as the domain, relationship, and range of a GO shape expression rule.
     */
    goshapes?: ShexShapeAssociation[],

}

