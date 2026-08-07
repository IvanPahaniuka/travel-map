
const SpotifyAuthStorage = {
    getAccessToken: () => {
        const accessToken = localStorage.getItem('spotify_access_token') || '';
        const expiresAtStr = localStorage.getItem('spotify_access_token_expires_at');
        const expiresAt = expiresAtStr ? Number(expiresAtStr) : 0;
        return [accessToken, expiresAt];
    },
    saveAccessToken: (accessToken, expiresIn) => {
        const expiresAt = String(Date.now() + expiresIn * 1000);

        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_access_token_expires_at', expiresAt);
    },
    clearAccessToken: () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_access_token_expires_at');
    },

    getRefreshToken: () => {
        return localStorage.getItem('spotify_refresh_token') || '';
    },
    saveRefreshToken: (refreshToken) => {
        localStorage.setItem('spotify_refresh_token', refreshToken);
    },
    clearRefreshToken: () => {
        localStorage.removeItem('spotify_refresh_token');
    },

    getAuthCodeVerifier: () => {
        return localStorage.getItem('spotify_auth_code_verifier') || '';
    },
    saveAuthCodeVerifier: (codeVerifier) => {
        localStorage.setItem('spotify_auth_code_verifier', codeVerifier);
    },
    clearAuthCodeVerifier: () => {
        localStorage.removeItem('spotify_auth_code_verifier');
    },

    getAuthState: () => {
        return localStorage.getItem('spotify_auth_state') || '';
    },
    saveAuthState: (state) => {
        localStorage.setItem('spotify_auth_state', state);
    },
    clearAuthState: () => {
        localStorage.removeItem('spotify_auth_state');
    },

}

export default SpotifyAuthStorage;





