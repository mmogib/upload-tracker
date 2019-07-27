'use strict'

import { writeFile, createReadStream, createWriteStream } from 'fs'
import { promisify } from 'util'
import path from 'path'
import * as latex from 'node-latex'

import { app, protocol, BrowserWindow, ipcMain as ipc, dialog, screen } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import { autoUpdater } from 'electron-updater'
import * as log from 'electron-log'

import {
  parse_examdoc,
  examDocument,
  partials,
  initial_state,
  get_or_create_db,
  save_exam,
  get_item,
  update_item,
  save_item,
  shuffle_exam,
  add_answer_key,
  add_answer_counts
} from './backend/examparser/'
import { template_exam } from './backend/handlers/template_exam'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, db
const dbFile = isDevelopment
  ? path.resolve(__dirname, 'database.db')
  : path.join(process.env['APPDATA'], '/.shuffler/database.db')

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })
function createWindow() {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  win = new BrowserWindow({ width, height })

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
    db = get_or_create_db(dbFile)
    createWindow()
  }
})

//-------------------------------------------------------------------
// Logging
//
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.autoDownload = false
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

const fix = (val, digits = 2) => {
  const mult = Math.pow(10, digits)
  return Math.round(mult * val) / mult
}
const sendStatusToWindow = text => {
  log.info(text)
  win.webContents.send('update-message', text)
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...')
})
autoUpdater.on('update-available', info => {
  sendStatusToWindow('Update available.')
  win.webContents.send('update-available', 'yes')
})
autoUpdater.on('update-not-available', info => {
  sendStatusToWindow('Update not available.')
})
autoUpdater.on('error', err => {
  sendStatusToWindow('Error in auto-updater. ' + err)
})
autoUpdater.on('download-progress', progressObj => {
  const downloadObj = {
    rate: fix(parseFloat(progressObj.bytesPerSecond) / 1000, 2),
    percent: fix(parseFloat(progressObj.percent), 2),
    transferred: fix(parseFloat(progressObj.transferred) / 1000000, 2),
    total: fix(parseFloat(progressObj.total) / 1000000, 2)
  }
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  sendStatusToWindow(log_message)
  win.webContents.send('download-progressing', downloadObj)
})
autoUpdater.on('update-downloaded', info => {
  sendStatusToWindow('Update downloaded')
  autoUpdater.quitAndInstall()
})
ipc.on('download-update', (e, msg) => {
  sendStatusToWindow('Sarting download .... ' + msg)
  autoUpdater.downloadUpdate()
})
///////// end of autoUpdate

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  db = get_or_create_db(dbFile)
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 10000)
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

//// main events
ipc.on('get-init-state', async e => {
  const state = await initial_state(db)
  e.sender.send('state-initiated', state)
})

const donwloadexam = async (e, examObj, examplePartials) => {
  const exam = shuffle_exam(examObj)
  const partials = add_answer_counts(exam, add_answer_key(exam, examplePartials))
  const saveFile = promisify(writeFile)
  try {
    const template = examDocument(partials)
    const examFile = await parse_examdoc(exam, template)
    dialog.showSaveDialog(
      win,
      {
        title: 'Save LaTeX',
        filters: [{ name: 'LaTeX', extensions: ['tex'] }]
      },
      async filename => {
        if (filename) {
          await saveFile(filename, examFile)
          e.sender.send('set-latex-file-path', filename)
        }
        e.sender.send('not-busy')
      }
    )
  } catch (error) {
    if (error !== undefined) {
      dialog.showErrorBox('Error Saving', error.message || error)
      e.sender.send('not-busy')
    }
  }
}
ipc.on('download-exam', donwloadexam)

ipc.on('save-exam', (e, exam) => {
  dialog.showSaveDialog(
    win,
    {
      title: 'Save Exam Setting',
      filters: [{ name: 'Exam File', extensions: ['exdb'] }]
    },
    async filename => {
      if (filename) {
        try {
          const examdb = get_or_create_db(filename)
          await save_exam(examdb, { ...exam, name: filename })
          await save_item(db, { name: filename, path: filename, project: true })
          e.sender.send('exam-saved')
          e.sender.send('add-project', { name: filename, path: filename })
        } catch (error) {
          if (error !== undefined) {
            dialog.showErrorBox('Error Saving', error.message || error)
            e.sender.send('not-busy')
          }
        }
      } else {
        e.sender.send('not-busy')
      }
    }
  )
})

ipc.on('open-exam', e => {
  dialog.showOpenDialog(
    win,
    {
      title: 'Save Exam Setting',
      filters: [{ name: 'Exam File', extensions: ['exdb'] }]
    },
    async filename => {
      if (filename) {
        try {
          const examdb = get_or_create_db(path.resolve(filename[0]))
          const { exam, examPartials } = await get_item(examdb)
          const exm = {
            name: 'current_exam',
            exam,
            examPartials
          }
          e.sender.send('exam-opened', exm)
        } catch (error) {
          if (error !== undefined) {
            dialog.showErrorBox('Error', error.message || error)
            e.sender.send('not-busy')
          }
        }
      } else {
        e.sender.send('not-busy')
      }
    }
  )
})

ipc.on('save-setting', async (e, setting) => {
  try {
    await update_item(db, { ...setting, name: 'setting' })
    e.sender.send('setting-saved')
  } catch (error) {
    dialog.showErrorBox('Error', error.message || error)
    e.sender.send('not-busy')
  }
})

ipc.on('save-as-default', async (e, exam) => {
  try {
    await update_item(db, { ...exam })
    e.sender.send('default-saved')
  } catch (error) {
    dialog.showErrorBox('Error', error.message || error)
    e.sender.send('not-busy')
  }
})

ipc.on('load-project', async (e, filename) => {
  try {
    const examdb = get_or_create_db(path.resolve(filename))
    const { exam, examPartials } = await get_item(examdb)
    const exm = {
      name: 'current_exam',
      exam,
      examPartials
    }
    e.sender.send('exam-opened', exm)
  } catch (error) {
    if (error !== undefined) {
      dialog.showErrorBox('Error', error.message || error)
      e.sender.send('not-busy')
    }
  }
})

ipc.on('download-template-exam', async e => {
  const exam = template_exam
  const saveFile = promisify(writeFile)
  try {
    const template = examDocument(partials)
    const examFile = await parse_examdoc(exam, template)
    dialog.showSaveDialog(
      win,
      {
        title: 'Save LaTeX',
        filters: [{ name: 'LaTeX', extensions: ['tex'] }]
      },
      async filename => {
        if (filename) {
          await saveFile(filename, examFile)
        }
        e.sender.send('not-busy')
      }
    )
  } catch (error) {
    if (error !== undefined) {
      dialog.showErrorBox('Error Saving', error.message || error)
      e.sender.send('not-busy')
    }
  }
})

ipc.on('close-app', () => {
  app.quit()
})
ipc.on('update-app', () => {
  sendStatusToWindow('message from update-app')
})
