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
            component: UserPage,
            meta: { requiresAuth: true }
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
            component: Home_catalog,
            meta: { requiresAuth: true, role: 1} //apenas grupo usuário 1 com token pode acessar a rota
        },
        {
            path: '/admin/catalog',
            name: 'catalogo_admin',
            component: Admin_catalog
        }
    ]
})

//antes de cada rota verifica
router.beforeEach(async (to, from) => {
    const claims = getClaims();
    let accessToken = getAccessToken();

    if (to.name === "loginteste") {
        return true;
    }
    
    if(to.meta.requiresAuth && !accessToken) {
        return {
            name: 'loginteste'
        }
    }

    if (!accessToken) {
        removeAccessTokens();
        return {
            name: 'loginteste'
        }
    }

    if (isTokenExpired(accessToken)) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            removeAccessTokens();
            return {
                name: 'loginteste'
            }
        }

        try {
            const newToken = await RefreshMethod(refreshToken)
            setAccessToken(newToken);
            accessToken = newToken
        } catch (error) {
            removeAccessTokens();
            return {
                name: 'loginteste'
            }
        }
    }

    if(to.meta.role && claims?.id_user_group !== 1) {
        return {
            name: 'Login' //ou para página forbidden
        }
    }
})

export { router }