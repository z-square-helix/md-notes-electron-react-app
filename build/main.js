const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const dialog = electron.dialog;
const fs = require('fs');
const isDev = require('electron-is-dev');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({width: 1150, height: 600, titleBarStyle: 'hidden'});
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);

  const template = [
        {
          label: 'File',
          submenu: [
              {
                  label: 'Open Folder',
                  accelerator: 'CmdOrCtrl+O',
                  click() {
                      openDir();
                  },
              },
              {
                  label: 'Open File',
                accelerator: 'CmdOrCtrl+M',
                click() {
                    openFile();
                },
              },
              {
                  label: 'Save File',
                  accelerator: 'CmdOrCtrl+S',
                  click() {
                      mainWindow.webContents.send('save-file');
                  },
              },
            ],
          },
          {
              label: 'Edit',
              submenu: [
                  { role: 'undo' },
                  { role: 'redo' },
                  { type: 'separator' },
                  { role: 'cut' },
                  { role: 'copy' },
                  { role: 'paste' },
                  { role: 'pasteandmatchstyle' },
                  { role: 'delete' },
                  { role: 'selectall' },
              ],
          },
          {
              label: 'View',
              submenu: [
                  { role: 'reload' },
                  { role: 'forcereload' },
                  { role: 'toggledevtools' },
                  { type: 'separator' },
                  { role: 'resetzoom' },
                  { role: 'zoomin' },
                  { role: 'zoomout' },
                  { type: 'separator' },
                  { role: 'togglefullscreen' },
              ],
          },
          {
              role: 'window',
              submenu: [
                  { role: 'minimize' },
                  { role: 'close' },
              ],
          },
          {
              role: 'help',
              submenu: [
                  {
                      label: 'Learn More',
                      click() { require('electron').shell.openExternal('https://electronjs.org') },
                  },
              ],
          },
          {
              label: 'Developer',
              submenu: [
                  {
                      label: 'Toggle Developer Tools',
                      accellerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                      click() { mainWindow.webContents.toggleDevTools(); },
                  },
              ],
          },
      ];

      if (process.platform === 'darwin') {
          template.unshift({
              label: app.getName(),
              submenu: [
                  { role: 'about' },
                  { type: 'separator' },
                  { role: 'services' },
                  { type: 'separator' },
                  { role: 'hide' },
                  { role: 'hideothers' },
                  { role: 'unhide' },
                  { type: 'separator' },
                  { role: 'quit' },
              ],
          });

          // Edit menu
          template[2].submenu.push(
              { type: 'separator' },
              {
                  label: 'Speech',
                  submenu: [
                      { role: 'startspeaking' },
                      { role: 'stopspeaking' },
                  ],
              },
          );

          // Window menu
          template[4].submenu = [
              { role: 'close' },
              { role: 'minimize' },
              { role: 'zoom' },
              { type: 'separator' },
              { role: 'front' },
          ];
      }


  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.setAboutPanelOptions({
    applicationName: "Dope Notes",
    applicationVersion: "0.0.1",
  })

  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Open files
function openFile() {
    const files = dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{
            name: 'Markdown', extensions: ['md', 'markdown', 'txt'],
        }],
    });

    // If no files
    if (!files) return;

    const file = files[0];
    const fileContent = fs.readFileSync(file).toString();
    mainWindow.webContents.send('new-file', fileContent);
}

// Opens directory
function openDir() {
    const directory = dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (!directory) return;

    const dir = directory[0];
    mainWindow.webContents.send('new-dir', dir);
}
