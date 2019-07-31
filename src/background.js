'use strict'

import { app, protocol, BrowserWindow, ipcMain as ipc, dialog } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

import Datastore from 'nedb'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { getFilePaths, getFileProps } from './utilfns'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
const dbFile = isDevelopment
  ? path.resolve(__dirname, 'database.db')
  : path.join(process.env['APPDATA'], '/.uploadtracker/database.db')
let db = new Datastore({
  filename: dbFile,
  autoload: true,
  timestampData: true
})
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 960,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipc.on('new-folder', (e, file) => {
  const paths = getFilePaths(file.path)
  const files = paths.map(v => getFileProps(v))
  db.update(
    { id: 'lastFolder' },
    { $set: { id: 'lastFolder', folder: file.path, type: 'info' } },
    {
      upsert: true
    },
    err => {
      if (err) {
        showError(err)
      } else {
        db.findOne({ folder: file.path, type: 'data' }).exec((err, docs) => {
          if (!err) {
            if (!docs) {
              db.insert({ folder: file.path, files, type: 'data' }, err => {
                if (!err) {
                  e.sender.send('folder-saved')
                }
              })
            } else {
              e.sender.send('got-folder', docs)
            }
          } else {
            showError(err)
          }
        })
      }
    }
  )
})

ipc.on('get-last-folder', e => {
  db.findOne({ id: 'lastFolder' }).exec((err, lastFolder) => {
    if (!err) {
      if (lastFolder) {
        db.findOne({ folder: lastFolder.folder, type: 'data' }).exec(
          (error, docs) => {
            if (!error) {
              e.sender.send('got-folder', docs)
            } else {
              showError(error)
            }
          }
        )
      } else {
        e.sender.send('got-folder', {})
      }
      //e.sender.send('got-folder', docs)
    } else {
      showError(err)
    }
  })
})

ipc.on('update-file', (e, { id, files }) => {
  db.update(
    { _id: id },
    { $set: { files: files } },
    {
      upsert: false
    },
    err => {
      if (!err) {
        e.sender.send('folder-saved')
      }
    }
  )
})

ipc.on('upload-file', (e, file) => {
  axios
    .post(
      'https://content.dropboxapi.com/2/files/upload',
      fs.readFileSync(file.filePath),
      {
        headers: {
          Authorization:
            'Bearer ROmm0uk_Gq0AAAAAAABGOjKDxqw4z00UqarPqreEOZ5x-_5J4NuNXeNLFlHiKVvw',
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${file.name}`,
            mode: 'add',
            autorename: true,
            mute: false,
            strict_conflict: false
          })
        }
      }
    )
    .then(res => e.sender.send('upload-finished'))
    .catch(err => showError(err))
})

const showError = err => {
  dialog.showMessageBox(win, {
    title: 'Error Message',
    type: 'error',
    buttons: [],
    message: err
  })
}

/*
git fetch origin
git reset --hard origin/master

*/
