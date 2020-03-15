const {app, BrowserWindow} = require('electron');
const {autoUpdater} = require('electron-updater');

let checkedForUpdate = false;

function createWindow(dev) {
  if (!checkedForUpdate) {
    autoUpdater.checkForUpdatesAndNotify();
    checkedForUpdate = true;
  }

  const window = new BrowserWindow({
    width: 1400,
    height: 800,
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
