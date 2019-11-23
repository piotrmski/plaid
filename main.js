const {app, BrowserWindow, Menu} = require('electron');
const url = require("url");
const path = require("path");
const {autoUpdater} = require("electron-updater");

let window;

function createWindow () {
  Menu.setApplicationMenu(null);

  autoUpdater.checkForUpdatesAndNotify();

  window = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 400,
    minHeight: 200,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    delete details.requestHeaders['User-Agent'];
    callback({cancel: false, requestHeaders: details.requestHeaders});
  });

  window.loadURL(
    url.format({
      pathname: path.join(__dirname, '/build/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  window.on('closed', function () {
    window = null;
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (window === null) createWindow();
});
