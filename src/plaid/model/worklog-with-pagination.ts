import {Worklog} from './worklog';

export interface WorklogWithPagination {
  startAt?: number;
  maxResults?: number;
  total?: number;
  worklogs?: Worklog[];
}
