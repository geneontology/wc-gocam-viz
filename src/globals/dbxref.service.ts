import { load as yamlLoad } from 'js-yaml';
import { DB_XREFS_URL } from './constants';

interface EntityType {
  type_name: string;
  url_syntax: string;
}

interface DBXref {
  database: string;
  synonyms?: string[];
  entity_types: EntityType[];
}

export class DBXrefService {
  private url = DB_XREFS_URL;
  private dbxrefs: DBXref[] | null = null;
  private isInitialized = false;
  private hasInitError = false;

  constructor() {
  }

  public getURL(database: string, entityType: string | undefined, id: string): string | undefined {
    if (!this.dbxrefs) {
      throw new Error('Database not initialized. Call init() first');
    }

    let db = this.dbxrefs.filter(elt =>
      elt.database.toLowerCase() === database.toLowerCase() ||
      (elt.synonyms && elt.synonyms.includes(database))
    );

    if (!db || db.length === 0) {
      console.warn("@geneontology/dbxrefs: database ", database, " not found for requested id ", id);
      return undefined;
    }

    let entity;
    if (entityType) {
      entity = db[0].entity_types.filter(elt => elt.type_name.toLowerCase() === entityType.toLowerCase());
    } else {
      entity = [db[0].entity_types[0]];
    }

    if (!entity || entity.length === 0) {
      console.warn("@geneontology/dbxrefs: entity ", entityType, " not found in database ", database);
      return undefined;
    }

    entity = entity[0];
    return entity.url_syntax.replace("[example_id]", id);
  }

  public async init(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      this.dbxrefs = yamlLoad(text) as DBXref[];
      this.isInitialized = true;
    } catch (error) {
      this.hasInitError = true;
      this.isInitialized = true;
      throw error;
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public hasError(): boolean {
    return this.hasInitError;
  }

  public getDBXrefs(): DBXref[] | null {
    return this.dbxrefs;
  }
}