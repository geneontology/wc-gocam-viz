export class Rule {
  name: string;
  label: string;
  description: string
  url: string;

  constructor(name?: string, label?: string, description?: string, url?: string) {
    this.name = name;
    this.label = label;
    this.description = description;
    this.url = url;
  }

}