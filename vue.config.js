module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        appId: 'omarm.upload.tracker.app',
        productName: 'Upload Tracker',
        icon: './src/assets/icon.png',
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'ia32']
            }
          ]
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true
        },

        publish: {
          provider: 'github',
          owner: 'mmogib',
          repo: 'upload-tracker',
          vPrefixedTagName: true,
          token: process.env.GH_TOKEN,
          //private: true,
          releaseType: 'release',
          publishAutoUpdate: true
        }
      }
    }
  }
}
