import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Issue} from '../../models/issue';

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
