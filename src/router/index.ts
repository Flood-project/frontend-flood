import { createRouter, createWebHistory } from "vue-router"
import LoginPage from "../modules/login/view/login_page.vue"
import UserPage from "../modules/user/view/user_page.vue"
import Usuariologado from "../Usuariologado.vue"
import LoginTestPage from "../modules/login/view/logintest_page.vue"
import Home_catalog from "../modules/catalog/view/home_catalog.vue"
import Admin_catalog from "../modules/catalog/view/admin/admin_catalog.vue"
import Edit_product from "../modules/catalog/view/admin/edit_product.vue"
import { getAccessToken, getRefreshToken, removeAccessTokens, setAccessToken } from "../services/token"
import { getClaims, isTokenExpired } from "../services/jwt_decoder"
import { RefreshMethod } from "../modules/login/repository/login_repository"

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
            path: '/testlogin',
            name: 'logintest',
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
            component: Admin_catalog,
            meta: { requiresAuth: true, role: 1 }
        },
        {
            path: '/admin/users',
            name: 'user_managment',
            component: UserPage
        }
    ]
})

//antes de cada rota verifica
router.beforeEach(async (to, from) => {
    var claims = getClaims();
    let accessToken = getAccessToken();

    if (to.name === "loginteste") {
        return true;
    }
    
    if(to.meta.requiresAuth && !accessToken) {
        removeAccessTokens();
        return {
            name: 'loginteste'
        }
    }

    if (accessToken && isTokenExpired(accessToken)) {
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
            claims = getClaims();
        } catch (error) {
            removeAccessTokens();
            return {
                name: 'loginteste'
            }
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