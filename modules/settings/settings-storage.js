import SpotifyAuthStorage from "../spotify/spotify-auth-storage.js";

function getDataUrl() {
    return localStorage.getItem('data_url');
}
function setDataUrl(/** @type {string | null} */ dataUrl) {
    localStorage.setItem('data_url', dataUrl);
}
function clearDataUrl() {
    localStorage.removeItem('data_url');
}

const SettingsStorage = {
    Spotify: SpotifyAuthStorage,

    getDataUrl,
    setDataUrl,
    clearDataUrl,
};

export default SettingsStorage;