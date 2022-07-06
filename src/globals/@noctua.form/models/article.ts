import { EntityType } from "./activity/entity";

export class Article {
  entityType = EntityType.ARTICLE
  id: string;
  title: string;
  author?: string;
  date?: string;
  link?: string;
  frequency: number;
}