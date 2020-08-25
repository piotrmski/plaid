export interface Issue {
  expand?: string;
  id?: string;
  self?: string;
  key?: string;
  fields?: {
    components?: {
      name: string;
    }[];
    issuetype?: {
      iconUrl: string;
      name: string;
    };
    parent?: Issue;
    priority?: {
      iconUrl: string;
      name: string;
    };
    summary?: string;
    status?: {
      name: string,
      statusCategory?: {
        colorName: string;
      }
    }
  };
  renderedFields?: {};
  properties?: any;
  names?: {};
  schema?: {};
  transitions?: any[];
  operations?: any;
  editmeta?: any;
  changelog?: any;
  versionedRepresentations?: {};
  fieldsToInclude?: any;
}
