import { jwtDecode } from "jwt-decode";
import { getAccessToken, getRefreshToken } from "./token";

interface CustomClaims {
    exp: number;
    iat: number;
    id_user_group: number;
    email: string;
    userGroup: number;
    type: string
}

interface CustomRefreshTokenClaims {
    exp: number;
    iat: number;
    IdUser: number;
    type: string;
}

function getClaims(): CustomClaims | null {
    const token = getAccessToken();
    if (!token) {
        return null;
    }

    try {
        const decodedTokenClaims = jwtDecode<CustomClaims>(token);
        return decodedTokenClaims;
    } catch (error) {
        return null;
    }
}

function getClaimsRefreshToken(): CustomRefreshTokenClaims | null {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }

    try {
        const decodedRefreshTokenClaims = jwtDecode<CustomRefreshTokenClaims>(refreshToken);
        return decodedRefreshTokenClaims;
    } catch (error) {
        console.log("Erro ao decodificar refresh token ", error)
        return null;
    }
}

function isTokenExpired(token: string | null): boolean {
    if (!token) {
        console.log('Nenhum token foi encontrado.');
        return true;
    }

    try {
        const decodedClaim = jwtDecode<{ exp?: number }>(token)
        const expiration = decodedClaim?.exp;
        if (!expiration) {
            console.log('Token sem exp.');
            return true;
        }
        
        const now = Math.floor(Date.now() / 1000)
    
        return expiration < now;
    } catch {
        return true;
    }
}

export { getClaims, getClaimsRefreshToken, isTokenExpired }