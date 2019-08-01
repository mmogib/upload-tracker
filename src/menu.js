import { Menu, app } from 'electron'
const isMac = process.platform === 'darwin'
const isDevelopment = process.env.NODE_ENV !== 'production'

const localMenu = [
  // { role: 'appMenu' }
  ...(process.platform === 'darwin'
    ? [
        {
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
            { role: 'quit' }
          ]
        }
      ]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }]
            }
          ]
        : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      isDevelopment ? { role: 'toggledevtools' } : {},
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [{ role: 'close' }])
    ]
  },
  {
    role: 'help',
    label: 'Honeywell',
    submenu: [
      {
        label: 'Website',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal(
            'https://www.honeywellprocess.com/en-US/pages/default.aspx'
          )
        }
      }
    ]
  }
]

const prodMenu = [
  {
    role: 'help',
    label: 'Honeywell',
    submenu: [
      {
        label: 'Website',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal(
            'https://www.honeywellprocess.com/en-US/pages/default.aspx'
          )
        }
      }
    ]
  }
]
const template = isDevelopment ? localMenu : prodMenu
export const menu = Menu.buildFromTemplate(template)
