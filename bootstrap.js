const {app, BrowserWindow, Menu} = require('electron');
const {autoUpdater} = require('electron-updater');
const {getNewWindowRect, getNewWindowMaximized, saveWindowState} = require('./window-state');

let firstWindowCreated = false;

// Workaround for https://github.com/electron/electron/issues/23664
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function createWindow(dev) {
  if (!firstWindowCreated) { // Check for update once in the process (if subsequent windows are opened, don't check again)
    autoUpdater.checkForUpdatesAndNotify(); // Note to self: don't mess that one up!
  }

  const windowRect = getNewWindowRect({
    defaultWidth: 1400,
    defaultHeight: 800,
    isFirstWindow: !firstWindowCreated
  });

  const window = new BrowserWindow({
    width: windowRect.width,
    height: windowRect.height,
    x: windowRect.x,
    y: windowRect.y,
    minWidth: 400,
    minHeight: 200,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false
    }
  });

  window.on('close', () => {
    saveWindowState(window.getNormalBounds(), window.isMaximized());
  });

  // Strip User-Agent request headers due to restrictions in Jira REST API:
  // https://confluence.atlassian.com/jirakb/rest-api-calls-with-a-browser-user-agent-header-may-fail-csrf-checks-802591455.html
  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['User-Agent'];
    callback({cancel: false, requestHeaders: details.requestHeaders});
  });

  window.webContents.addListener('context-menu', (e, params) => {
    if (params.isEditable || params.inputFieldType !== 'none') {
      Menu.buildFromTemplate([
        {
          label: 'Undo',
          role: 'undo',
          enabled: params.editFlags.canUndo
        }, {
          label: 'Redo',
          role: 'redo',
          enabled: params.editFlags.canRedo
        }, {
          type: 'separator',
        }, {
          label: 'Cut',
          role: 'cut',
          enabled: params.editFlags.canCut
        }, {
          label: 'Copy',
          role: 'copy',
          enabled: params.editFlags.canCopy
        }, {
          label: 'Paste',
          role: 'paste',
          enabled: params.editFlags.canPaste
        }, {
          label: 'Select all',
          role: 'selectAll',
          enabled: params.editFlags.canSelectAll
        }
      ]).popup();
    }
  });

  if (dev) {
    window.webContents.openDevTools();
    window.loadURL('http://localhost:4300');
  } else {
    window.setMenu(null);
    window.loadFile('build/index.html');
  }
  if (getNewWindowMaximized(!firstWindowCreated)) {
    window.maximize();
  }
  window.show();
  firstWindowCreated = true;
}

module.exports = function(dev) {
  if (app.requestSingleInstanceLock()) {
    app.on('ready', () => createWindow(dev));
    app.on('second-instance', () => createWindow(dev));
    app.on('window-all-closed', () => app.quit());
  } else {
    console.log('Opened new window in primary process');
    app.quit();
  }
};
