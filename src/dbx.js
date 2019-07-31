ipc.on('open-drop-auth', openAuthWindow)
ipc.on(
  'get-dbx-user',
  (
    e,
    token = '1Sk7V4zT_dAAAAAAAAAAoESbOr2LrrBVrbuU-gz5xQCPWvnR3lzBxxztuUem35_a'
  ) => {
    const code = 'ROmm0uk_Gq0AAAAAAABGN4pWiF1Tj8iAZbX1wi2thDg'

    /*const data = {
      code,
      grant_type: 'authorization_code'
    }
    axios
      .post(
        'https://api.dropboxapi.com/oauth2/token',
        {},
        {
          auth: {
            username: 'sc1gww4tiflfjgf',
            password: '007taptx7uxjl5y'
          },
          params: {
            ...data
          }
        }
      )
      .then(res => console.log(res.data))
      .catch(err => console.log(err))
    /*dbx = new Dropbox({ accessToken: token, fetch: axios })
    
    dbx
      .filesListFolder({ path: '/' })
      .then(function(response) {
        console.log('FILES_FETCHED', response)
      })
      .catch(function(err) {
        console.log(err)
      })
*/

    axios
      .post(
        'https://api.dropboxapi.com/2/users/get_current_account',
        JSON.stringify(null),
        {
          headers: {
            Authorization:
              'Bearer ROmm0uk_Gq0AAAAAAABGOCcydmLI8zvmPriGZBgBRTVRsX0VxtNosXFm3nhwNLJb',
            'Content-Type': 'application/json'
          }
        }
      )
      .then(res => console.log(res.data))
      .catch(err => console.log('axios err', err))
  }
)

function openAuthWindow(
  e,
  link = 'https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=sc1gww4tiflfjgf'
) {
  authWindow = new BrowserWindow({
    alwaysOnTop: true,
    minimizable: false,
    height: 480,
    width: 720,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  authWindow.loadURL(link)
  authWindow.once('ready-to-show', function() {
    authWindow.show()
  })
}
