
const SpotifyAuthStorage = {
    getAccessToken: () => {
        const accessToken = localStorage.getItem('spotify_access_token') || '';
        const updatedAtStr = localStorage.getItem('spotify_access_token_updated_at');
        const updatedAt = updatedAtStr ? Number(updatedAtStr) : 0;
        return [accessToken, updatedAt];
    },
    setAccessToken: (accessToken) => {
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_access_token_updated_at', Date.now());
    },
    clearAccessToken: () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_access_token_updated_at');
    },

    getRefreshToken: () => {
        return localStorage.getItem('spotify_refresh_token') || '';
    },
    setRefreshToken: (refreshToken) => {
        localStorage.setItem('spotify_refresh_token', refreshToken);
    },
    clearRefreshToken: () => {
        localStorage.removeItem('spotify_refresh_token');
    },

    getAuthCodeVerifier: () => {
        return localStorage.getItem('spotify_auth_code_verifier') || '';
    },
    setAuthCodeVerifier: (codeVerifier) => {
        localStorage.setItem('spotify_auth_code_verifier', codeVerifier);
    },
    clearAuthCodeVerifier: () => {
        localStorage.removeItem('spotify_auth_code_verifier');
    },

    getAuthState: () => {
        return localStorage.getItem('spotify_auth_state') || '';
    },
    setAuthState: (state) => {
        localStorage.setItem('spotify_auth_state', state);
    },
    clearAuthState: () => {
        localStorage.removeItem('spotify_auth_state');
    },

}

export default SpotifyAuthStorage;





