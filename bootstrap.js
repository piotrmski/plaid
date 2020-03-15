const {app, BrowserWindow} = require('electron');
const {autoUpdater} = require('electron-updater');
const windowStateKeeper = require('electron-window-state');

let checkedForUpdate = false;

function createWindow(dev) {
  if (!checkedForUpdate) { // Check for update once in the process (if subsequent windows are opened, don't check again)
    autoUpdater.checkForUpdatesAndNotify(); // Note to self: don't mess that one up!
    checkedForUpdate = true;
  }

  const windowState = windowStateKeeper({
    defaultWidth: 1400,
    defaultHeight: 800
  });

  const window = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 400,
    minHeight: 200,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  // Strip User-Agent request headers due to restrictions in Jira REST API:
  // https://confluence.atlassian.com/jirakb/rest-api-calls-with-a-browser-user-agent-header-may-fail-csrf-checks-802591455.html
  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['User-Agent'];
    callback({cancel: false, requestHeaders: details.requestHeaders});
  });

  if (dev) {
    window.webContents.openDevTools();
    window.loadURL('http://localhost:4300');
  } else {
    window.setMenu(null);
    window.loadFile('build/index.html');
  }
  windowState.manage(window);
  window.show();
}

module.exports = function(dev) {
  app.allowRendererProcessReuse = true;
  if (app.requestSingleInstanceLock()) {
    app.on('ready', () => createWindow(dev));
    app.on('second-instance', () => createWindow(dev));
    app.on('window-all-closed', () => app.quit());
  } else {
    console.log('Opened new window in primary process');
    app.quit();
  }
};
