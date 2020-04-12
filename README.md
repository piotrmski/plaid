# Plaid

![Screenshot](https://raw.githubusercontent.com/piotrmski/plaid/master/screenshot.png)

Plaid lets you get a better overview of your Jira work logs. See your work logs neatly laid out and never struggle to search for gaps in your hours again. Edit them by dragging them across the calendar.

## New in 0.4

- Work logs can now be edited within Plaid (adding and deleting will come in future versions as well)
- Fixed Jira Cloud integration

See full change log in `changelog.md`

## Installation

### Windows

Download the installer from the latest [release](https://github.com/piotrmski/plaid/releases). Run the executable, and you're good to go. Your application will automatically update to newer releases.

### GNU/Linux

Application is available to install from Snapcraft:

```
sudo snap install plaid
```

Release on Flathub is planned for future.

## Development

Make sure you have `npm` installed on your system and available globally. Then install the dependencies:

```
npm install
```

At this point you can start debugging the application by serving the Angular project:

```
npm run serve-dev
```

and in a separate terminal running Electron:

```
npm run start-dev
```

### Building

To build the Angular project to `./build`, run:

```
npm run build
```

The built project can then be run without packaging:

```
npm run start
```

After building, you can also package the project for the current platform to `./dist`:

```
npm run package
```

## Roadmap

Planned functionality includes:
- **adding and editing work logs within the application**,
- hiding weekends,
- viewing single days,
- setting hour markers for beginnings and ends of work days,
- periodic refreshing.
