# Plaid

Plaid lets you get a better overview of your Jira work logs. See your work logs laid out on a weekly calendar and never struggle searching for gaps in your hours again.

## Change log

### 0.1

- initial release

## Installation

### Windows

#### Portable

Download and unpack the latest release from the [releases](https://github.com/piotrmski/plaid/releases) page. Run the executable and you're good to go.

#### Installer

Installer with updater for Windows is on the way.

### Linux

Application will soon be avaliable from Flathub and Snapcraft.

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

Building and packaging instructions will soon be added.

## Roadmap

Planned functionality includes:
- changing first day of the week,
- viewing single days,
- changing zoom level
- setting hour markers for beginnings and ends of work days,
- automatic refreshing,
- displaying overlapping logs side by side,
- adding and editing work logs within the application.
