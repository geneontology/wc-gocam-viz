export enum ErrorType {
  general = 'general',
  cardinality = 'cardinality',
  relation = 'relation'
}

export enum ErrorLevel {
  warning = 'warning',
  error = 'error'
}

export class ActivityError {

  constructor(
    public category: ErrorLevel,
    public type: ErrorType,
    public message: string,
    public meta?) {
  }
}