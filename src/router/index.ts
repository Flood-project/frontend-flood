import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"
import LoginTestPage from "../modules/login/view/logintest_page.vue"
import Home_catalog from "../modules/catalog/view/home_catalog.vue"
import Admin_catalog from "../modules/catalog/view/admin/admin_catalog.vue"
import Edit_product from "../modules/catalog/view/admin/edit_product.vue"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: LoginPage,
            meta: {
                requiresAuth: false
            }
        },
        {
            path: '/users',
            name: 'User',
            component: UserPage,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/logado',
            name: 'Logado',
            component: Usuariologado,
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/testlogin',
            name: 'logintest',
            component: LoginTestPage
        },
        {
            path: '/catalog',
            name: 'catalog',
            component: Home_catalog
        },
        {
            path: '/admin/catalog',
            name: 'catalogo_admin',
            component: Admin_catalog
        },
    ]
})

router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            next()
        } else {
            next('/login')
        }
    } else {
        next();
    }
})

export { router }