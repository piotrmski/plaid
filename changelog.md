# Change log

## 0.3

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
