import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"
import LoginTestPage from "../modules/login/view/logintest_page.vue"
import Home_catalog from "../modules/catalog/view/home_catalog.vue"
import Admin_catalog from "../modules/catalog/view/admin/admin_catalog.vue"

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
        },
        {
            path: '/catalogo',
            name: 'catalogo',
            component: Home_catalog
        },
        {
            path: '/admin/catalog',
            name: 'catalogo_admin',
            component: Admin_catalog
        }
    ]
})

export { router }