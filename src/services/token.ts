const setAccessToken = (accessToken: string): void => {
    localStorage.setItem("accessToken", accessToken);
}

const getAccessToken = (): string | null => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
        return null;
    }
    return token;
}

const setRefreshToken = (refreshToken: string): void => {
    localStorage.setItem("refreshToken", refreshToken)
}

const getRefreshToken = (): string | null => {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) {
        return null;
    }

    return refreshToken;
}

const hasTokens = (): boolean | null => {
    if (!getAccessToken && !getRefreshToken) {
        return null
    }

    return true
}

const removeAccessTokens = (): void => {    
    if (getAccessToken() != null) {
        localStorage.removeItem("accessToken")
    }

    if (getRefreshToken() != null) {
        localStorage.removeItem("refreshToken")
    }
}

export { setAccessToken, getAccessToken, setRefreshToken, getRefreshToken, hasTokens, removeAccessTokens }