# Change log

## 1.0

**1.0.2**

- updated API endpoints for issue and worklog services (thanks [cafesao](https://github.com/cafesao)!)

**1.0.1**

- fixed user self URI containing `:`
- sped up automatic reconnecting 
- disabled closing edit modal while saving
- pressing Enter in edit modal comment box will result in putting in new line; holding Ctrl while pressing Enter will
  save the entry
- tweaked labels
- updated dependencies

**1.0.0**

- added the ability to add new worklog entries
- added the ability to delete existing worklog entries
- keyboard navigation in worklog entry editor form is now possible
- worklog entry editor now has issue picker (for new entries only) which features:
  - ability to browse through issues, which were recently added or had recently changed status,
  - selecting, adding and removing favorites
  - searching by string in issue text or by issue key
- added issue status to worklog entry panel
- reorganized top bar
- updated dependencies 

## 0.5

**0.5.2**

- optimized loading work logs

**0.5.1**

- upon lost connection, automatic reconnection attempts will now be made in 30 second intervals (cancellable by hovering
  the mouse over the "Reconnect" button
- working hours in settings are now presented as time inputs instead of dropdowns
- inputs and text areas now have context menus
- credentials now can't be changed after pressing "Log in"
- work log editing now gets blocked after pressing "Save"
- "Save" button in the work log editor is now slightly wider to lower misclick rate
- updated dependencies

**0.5.0**

![Settings](https://raw.githubusercontent.com/piotrmski/plaid/master/changelog-screenshots/settings.png)

- added settings dropdown containing:
  - the working window start size and position,
  - option to hide weekends,
  - periodic refreshing option,
  - dark mode toggle,
- changed appearance of calendar header
- added gray background to outside of the working window
- fixed Jira Cloud integration
- fixed a bug causing edited work log to visually disappear after saving
- prevented key repetition in keyboard shortcuts
- updated dependencies

## 0.4

**0.4.0**

![Editor](https://raw.githubusercontent.com/piotrmski/plaid/master/changelog-screenshots/editor.png)

- added work log editor
- fixed Jira Cloud integration
- fixed potential crash at launch
- minor style tweaks
- updated dependencies

## 0.3

**0.3.2**

- window size and position is now persistent
- fixed bug occurring when multiple windows are opened, causing subsequent windows to launch slowly and logged out

**0.3.1**

- zooming tweaks:
  - zooming with buttons and keyboard shortcuts is now by slightly smaller increments,
  - zooming with low precision mouse wheel is now by significantly smaller increments,
  - zooming with high precision touch pad is now smooth
- added shortcuts:
  - Ctrl _ to zoom out (in addition to Ctrl -),
  - F4 to go to previous week,
  - F6 to go to next week,
- labeled most buttons
- swapped places of zoom in and out buttons
- tweaked opening week picker to show the month which monday of current week is in instead of sunday
- updated dependencies

**0.3.0**

![Dark mode, current time marker](https://raw.githubusercontent.com/piotrmski/plaid/master/changelog-screenshots/0.3.png)

- added zooming (with buttons, Ctrl +, Ctrl -, or Ctrl mousewheel)
- added current time marker
- added dark theme (on Windows available by setting default app mode to dark in personalization settings, on GNU/Linux currently unavailable)
- on login screen now https:// is prepended to URL if protocol was not specified
- added warning to the login screen not to use http
- minor visual tweaks
- improved performance
- updated dependencies

## 0.2

**0.2.1**

![Long worklogs](https://raw.githubusercontent.com/piotrmski/plaid/master/changelog-screenshots/long-logs.png)

- worklogs longer and lower than valid now don't break the layout

**0.2.0**

![Overlaps](https://raw.githubusercontent.com/piotrmski/plaid/master/changelog-screenshots/overlap.png)

- overlapping logs now appear side by side
- changed appearance of logs for better clarity and contrast
- F5 and Ctrl+R now refresh work logs
- bug fixes
  - date picker now responds to current date change
  - fix for error in dev console appearing when loading work logs

## 0.1

**0.1.2**

- added VisualElementsManifest.xml (Windows only)

**0.1.1**

- published for Windows, Snapcraft

**0.1.0**

- initial release
