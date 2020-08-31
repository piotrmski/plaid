import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {PlaidComponent} from './plaid.component';
import {GridComponent} from './components/grid/grid.component';
import {WorklogPanelComponent} from './components/worklog-panel/worklog-panel.component';
import {AuthInterceptor} from './core/auth/auth.interceptor';
import {ConnectionIssueResolverComponent} from './components/connection-issue-resolver/connection-issue-resolver.component';
import {FormsModule} from '@angular/forms';
import {DateRangePickerComponent} from './components/date-range-picker/date-range-picker.component';
import {GridBackgroundComponent} from './components/grid-background/grid-background.component';
import {RefreshButtonComponent} from './components/refresh-buton/refresh-button.component';
import {ExtHrefDirective} from './directives/ext-href.directive';
import {NgxElectronModule} from 'ngx-electron';
import {AuthStatusComponent} from './components/auth-status/auth-status.component';
import {ZoomControlsComponent} from './components/zoom-controls/zoom-controls.component';
import {CurrentTimeMarkerComponent} from './components/current-time-marker/current-time-marker.component';
import {WorklogEditorComponent} from './components/worklog-editor/worklog-editor.component';
import {DatePickerCloudComponent} from './components/date-picker-cloud/date-picker-cloud.component';
import {SettingsComponent} from './components/settings/settings.component';
import {LostConnectionModalComponent} from './components/connection-issue-resolver/lost-connection-modal/lost-connection-modal.component';
import {LoginModalComponent} from './components/connection-issue-resolver/login-modal/login-modal.component';
import {ErrorModalComponent} from './components/connection-issue-resolver/error-modal/error-modal.component';
import {IssuePickerCloudComponent} from './components/issue-picker-cloud/issue-picker-cloud.component';
import {IssueDetailsComponent} from './components/issue-details/issue-details.component';
import {IssueListItemComponent} from './components/issue-picker-cloud/issue-list-item/issue-list-item.component';

@NgModule({
  declarations: [
    PlaidComponent,
    GridComponent,
    WorklogPanelComponent,
    ConnectionIssueResolverComponent,
    DateRangePickerComponent,
    DatePickerCloudComponent,
    GridBackgroundComponent,
    RefreshButtonComponent,
    ExtHrefDirective,
    AuthStatusComponent,
    ZoomControlsComponent,
    CurrentTimeMarkerComponent,
    WorklogEditorComponent,
    SettingsComponent,
    LostConnectionModalComponent,
    LoginModalComponent,
    ErrorModalComponent,
    IssuePickerCloudComponent,
    IssueDetailsComponent,
    IssueListItemComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    NgxElectronModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [PlaidComponent]
})
export class PlaidModule {
}
