import { app, BrowserWindow, screen, dialog, ipcMain, Menu } from 'electron';

import * as storage from 'electron-json-storage';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

let settings = null;

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

function createWindow(): BrowserWindow {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 600, // size.width,
    height: 600, //size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false, // false if you want to run e2e test with Spectron
    },
    resizable: false,
  });

  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, '/../node_modules/electron')),
    });
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    win.loadURL(
      url.format({
        pathname: path.join(__dirname, pathIndex),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    setTimeout(createWindow, 400);
    setMainMenu();
    loadSettings();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}

function loadSettings() {
  // console.log('path', path);
  storage.get('settings', function (error, data) {
    if (error) throw error;

    settings = data;
    console.log('loadSettings', settings);

    if (JSON.stringify(settings) === '{}') {
      console.log('settings not found -> creating...');
      saveDefaultSettings();
    }
  });
}

function saveDefaultSettings() {
  settings = {
    serverName: 'aws-svr-028',
    scriptsPath: 'c:\\scripts',
    scripts: [
      {
        name: 'check-tr.bat',
        desc: 'Check task runner status',
      },
      {
        name: 'install-tr.bat',
        desc: 'Install task runner',
      },
      {
        name: 'delete-tr.bat',
        desc: 'Remove task runner',
      },
    ],
  };

  storage.set('settings', settings);
}

function setMainMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Runner',
          // accelerator: 'Shift+CmdOrCtrl+H',
          click() {
            win.webContents.send('navigate-to', 'home');
          },
        },
        {
          label: 'Settings',
          // accelerator: 'Shift+CmdOrCtrl+H',
          click() {
            win.webContents.send('navigate-to', 'settings');
          },
        },
        { type: 'separator' },
        { role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CommandOrControl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CommandOrControl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CommandOrControl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CommandOrControl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CommandOrControl+V',
          role: 'paste',
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          accelerator: 'Shift+CmdOrCtrl+H',
          click() {
            dialog.showMessageBox({
              title: 'About Script Runner',
              type: 'info',
              message: 'Script Runner v1.0.0 - 2022.\r\n',
            });
          },
        },
      ],
    },
  ] as any;
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This function will output the lines from the cmd
// and will return the full combined output
// as well as exit code when it's done (using the callback).
async function runCmd(command, args, callback) {
  var output;
  var child = child_process.spawn(command, args, {
    shell: true,
  });
  // You can also use a variable to save the output for when the script closes later
  child.on('error', (error) => {
    dialog.showMessageBox({
      title: 'Cmd Error',
      type: 'error',
      message: 'Error occured.\r\n' + error,
    });
  });

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => {
    //Here is the output
    output = data.toString();
    console.log(output);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data) => {
    // Return some data to the renderer process with the mainprocess-response ID
    win.webContents.send('cmd-output', data);
    //Here is the output from the command
    console.log(data);
  });

  child.on('close', (code) => {
    //Here you can get the exit code of the script
    /* switch (code) {
          case 0:

              dialog.showMessageBox({
                  title: 'Action Result',
                  type: 'info',
                  message: output + '\r\n'
              });

              break;
      } */

    win.webContents.send('cmd-output', output);
  });
}

ipcMain.handle('send-request', async (event, data) => {
  console.log('handle send-request', data, settings);

  await runCmd(
    'psexec',
    [
      `-nobanner \\\\${settings.serverName} ${settings.scriptsPath}\\${data.script} ${data.docNum}`,
    ],
    null
  );
});

ipcMain.on('load-settings', (event, data) => {
  console.log('handle load settings', data, settings);

  event.sender.send('load-settings-resp', settings);
});

ipcMain.on('update-settings', (event, data) => {
  console.log('handle update settings', data);

  storage.set('settings', data, (err) => {
    let status = 'success';
    if (err) {
      status = 'error';
    } else {
      settings = data;
    }

    event.sender.send('update-settings-resp', status);
  });
});
