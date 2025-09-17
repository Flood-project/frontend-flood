import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "./token";

interface CustomClaims {
    registeredClaims: {};
    IdUser: number;
    email: string;
    userGroup: number;
    type: string
}

interface CustomRefreshTokenClaims {
    IdUser: number;
    type: string
    registeredClaims: {};
}

function getClaims(): CustomClaims | null { //recebe as claims do token
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    try {
        const decodedTokenClaims = jwtDecode<CustomClaims>(token);
        console.log('claims: ', decodedTokenClaims);
        return decodedTokenClaims;
    } catch (error) {
        console.log("Erro ao decodificar token ", error)
        return null;
    }
}

function isTokenExpired(refreshToken: string): boolean { //recebe as claims do refresh token e define se o token foi expirado
    try {
        const decodedRefreshTokenClaims = jwtDecode<CustomRefreshTokenClaims>(refreshToken);
        console.log('refresh claims decoded: ', decodedRefreshTokenClaims);
        
        if (!decodedRefreshTokenClaims.exp) {
            return true
        } 

        const now = Math.floor(Date.now() / 1000)
        return decodedRefreshTokenClaims.exp < now;
    } catch {
        return true;
    }
}

export { getClaims, isTokenExpired }