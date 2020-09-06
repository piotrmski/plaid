import {Injectable} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorklogState {
  private fetching = new BehaviorSubject<boolean>(false);
  private worklogs = new BehaviorSubject<Worklog[]>([]);

  getFetching$(): Observable<boolean> {
    return this.fetching.asObservable();
  }

  setFetching(fetching: boolean) {
    this.fetching.next(fetching);
  }

  getWorklogs$(): Observable<Worklog[]> {
    return this.worklogs.asObservable();
  }

  setWorklogs(worklogs: Worklog[]) {
    this.worklogs.next(worklogs);
  }

  addOrUpdateWorklog(updatedWorklog: Worklog): void {
    const worklogs: Worklog[] = this.worklogs.getValue();
    const updatedWorklogIndex: number = worklogs.findIndex(worklog => worklog.id === updatedWorklog.id);
    if (updatedWorklogIndex > -1) {
      worklogs[updatedWorklogIndex] = updatedWorklog;
    } else {
      worklogs.push(updatedWorklog);
    }
    this.worklogs.next([...worklogs]);
  }

  deleteWorklog(worklogId: string) {
    this.worklogs.next(this.worklogs.getValue().filter(worklog => worklog.id !== worklogId));
  }
}
