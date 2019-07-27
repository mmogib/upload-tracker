import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

new Vue({
  store,
  vuetify,
  render: h => h(App),
  created() {
    store.dispatch('APP_INIT')
  }
}).$mount('#app')
