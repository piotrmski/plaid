import {Issue} from './issue';

export interface SearchResults {
  expand?: string;
  startAt?: number;
  maxResults?: number;
  total?: number;
  issues?: Issue[];
  warningMessages?: string[];
  names?: {};
  schema?: {};
}
