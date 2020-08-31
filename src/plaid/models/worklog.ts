import {User} from './user';
import {Issue} from './issue';

export interface Worklog {
  self?: string;
  author?: User;
  updateAuthor?: User;
  comment?: string;
  created?: string;
  updated?: string;
  visibility?: any;
  started?: string | number;
  timeSpent?: string;
  timeSpentSeconds?: number;
  id?: string;
  issueId?: string;
  issue?: Issue;

  _column?: number;
  _columns?: number;
  _deleting?: boolean;
}
