import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"

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