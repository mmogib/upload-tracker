import { ipcRenderer as ipc } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    files: []
  },
  mutations: {
    setFiles: (state, payload) => {
      state.files = [...payload]
    },
    addFile: (state, payload) => {
      state.files = [...state.files, payload]
    }
  },
  actions: {
    APP_INIT: ({ commit }) => {
      ipc.send('get-files')
      ipc.on('file-saved', () => {
        console.log('file saved in bg')
      })
      ipc.on('got-files', (e, files) => {
        commit('setFiles', files)
      })
    },
    ADD_FILE: ({ state, commit }, payload) => {
      if (state.files.filter(v => v.name === payload.name).length === 0) {
        ipc.send('new-file', payload)
        commit('addFile', payload)
      }
    }
  }
})
