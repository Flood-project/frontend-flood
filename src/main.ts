import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router/index'
import vuetify from 'vuetify'

createApp(App)
.use(router)
.use(Vuetify)
.mount('#app')
