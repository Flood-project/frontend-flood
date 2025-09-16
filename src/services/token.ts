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

const removeAccessToken = (): void => {    
    if (getAccessToken() != null) localStorage.removeItem("accessToken")
}

export { setAccessToken, getAccessToken, removeAccessToken }