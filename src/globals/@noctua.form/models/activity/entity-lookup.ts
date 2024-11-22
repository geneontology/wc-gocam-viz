export class EntityLookup {
  category: string;
  requestParams: any;
  results: any = [];

  constructor(category?: string, requestParams?: any) {
    this.category = category;
    this.requestParams = requestParams;
  }

}
