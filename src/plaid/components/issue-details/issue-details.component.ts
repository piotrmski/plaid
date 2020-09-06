import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Issue} from '../../models/issue';

/**
 * Dumb component presenting the details of an issue for the worklog panel and issue selector.
 */
@Component({
  selector: 'plaid-issue-details',
  templateUrl: './issue-details.component.html',
  styleUrls: ['./issue-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssueDetailsComponent {
  @Input()
  jiraURL: string;

  @Input()
  issue: Issue;

  getComponents(): string {
    return this.issue.fields.components.map(c => c.name).join(', ');
  }
}
