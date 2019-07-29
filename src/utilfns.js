const fs = require('fs')
const path = require('path')

/** Retrieve file paths from a given folder and its subfolders. */
export const getFilePaths = folderPath => {
  const entryPaths = fs
    .readdirSync(folderPath)
    .map(entry => path.join(folderPath, entry))
  const filePaths = entryPaths.filter(entryPath =>
    fs.statSync(entryPath).isFile()
  )
  const dirPaths = entryPaths.filter(
    entryPath => !filePaths.includes(entryPath)
  )
  const dirFiles = dirPaths.reduce(
    (prev, curr) => prev.concat(getFilePaths(curr)),
    []
  )
  return [...filePaths, ...dirFiles]
}

export const getFileProps = filePath => {
  const name = path.basename(filePath)
  const ext = path.extname(filePath)
  const size = formatBytes(fs.statSync(filePath).size)
  return {
    filePath,
    name,
    ext,
    size,
    data: {}
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
