import { Entity } from "./activity/entity";

export interface GOlrResponse {
  id: string;
  label: string;
  link: string;
  description: string;
  isObsolete: boolean;
  replacedBy: string;
  rootTypes: Entity[];
  xref: string;
  notAnnotatable: boolean;
  neighborhoodGraphJson: string;
}