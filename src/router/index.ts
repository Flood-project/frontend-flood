import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"
import LoginTestPage from "../modules/login/view/logintest_page.vue"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: LoginPage
        },
        {
            path: '/users',
            name: 'User',
            component: UserPage
        },
        {
            path: '/logado',
            name: 'Logado',
            component: Usuariologado
        },
        {
            path: '/loginteste',
            name: 'loginteste',
            component: LoginTestPage
        }
    ]
})

export { router }