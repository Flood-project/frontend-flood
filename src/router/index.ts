import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"
import LoginTestPage from "../modules/login/view/logintest_page.vue"
import Home_catalog from "../modules/catalog/view/home_catalog.vue"
import Admin_catalog from "../modules/catalog/view/admin/admin_catalog.vue"
import { getAccessToken, getRefreshToken, removeAccessTokens, setAccessToken } from "../services/token"
import { getClaims, isTokenExpired } from "../services/jwt_decoder"
import { RefreshMethod } from "../modules/login/repository/login_repository"
import Logs_page from "../modules/catalog/view/admin/logs_page.txt"
import Forgot_password from "../modules/login/view/forgot_password.vue"
import Acionamentos_page from "../modules/catalog/view/admin/acionamentos_page.vue"
import Buchas_page from "../modules/catalog/view/admin/buchas_page.vue"
import Bases_page from "../modules/catalog/view/admin/bases_page.vue"

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
            meta: { requiresAuth: true, role: 3 }
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
            path: '/',
            name: 'logintest',
            component: LoginTestPage
        },
        {
            path: '/catalogo',
            name: 'catalogo',
            component: Home_catalog,
            meta: { requiresAuth: true, role: 2} //apenas grupo usuário 2 com token pode acessar a rota
        },
        {
            path: '/admin/catalog',
            name: 'catalogo_admin',
            component: Admin_catalog,
            meta: { requiresAuth: true, role: 1 }
        },
        {
            path: '/admin/users',
            name: 'user_managment',
            component: UserPage,
            meta: { requiresAuth: true, role: 3}
        },
        {
            path: '/esqueci-minha-senha',
            name: 'esqueci_senha',
            component: Forgot_password
        },
        {
            path: '/admin/acionamentos',
            name: 'acionamentos_admin',
            component: Acionamentos_page,
            meta: { requiresAuth: true, role: 1}
        },
        {
            path: '/admin/buchas',
            name: 'buchas_admin',
            component: Buchas_page,
            meta: { requiresAuth: true, role: 1}
        },
        {
            path: '/admin/bases',
            name: 'bases_admin',
            component: Bases_page,
            meta: { requiresAuth: true, role: 1}
        }
        // {
        //     path: "/admin/logs",
        //     name: 'logs',
        //     component: Logs_page,
        //     meta: { requiresAuth: true, role: 1}
        // }
    ]
})

//antes de cada rota verifica
router.beforeEach(async (to, from) => {
    var claims = getClaims();
    let accessToken = getAccessToken();

    if (to.path === '/') {
        return true;
    }
    
    if(to.meta.requiresAuth && !accessToken) {
        removeAccessTokens();
        return '/'
      
    }

    if (accessToken && isTokenExpired(accessToken)) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            removeAccessTokens();
            return '/'
        }

        try {
            const newToken = await RefreshMethod(refreshToken)
            setAccessToken(newToken);
            accessToken = newToken
            claims = getClaims();
        } catch (error) {
            removeAccessTokens();
            return '/'
        }
    }

    if(to.meta.role && claims?.id_user_group !== to.meta.role) {
        return {
            name: 'Login' //ou para página forbidden
        }
    }
    return true;
})

export { router }