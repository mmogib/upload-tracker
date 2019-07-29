import { ipcRenderer as ipc } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    folder: []
  },
  mutations: {
    setFolder: (state, payload) => {
      state.folder = { ...payload }
    }
  },
  actions: {
    APP_INIT: ({ commit }) => {
      ipc.send('get-last-folder')
      ipc.on('got-folder', (e, folder) => {
        commit('setFolder', folder)
      })
    },
    ADD_FOLDER: (_, payload) => {
      ipc.send('new-folder', payload)
    }
  }
})
