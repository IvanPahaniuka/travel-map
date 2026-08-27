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

function getEncryptionKey() {
    return localStorage.getItem('encryption_key');
}
function setEncryptionKey(/** @type {string | null} */ encryptionKey) {
    localStorage.setItem('encryption_key', encryptionKey);
}
function clearEncryptionKey() {
    localStorage.removeItem('encryption_key');
}

const SettingsStorage = {
    Spotify: SpotifyAuthStorage,

    getDataUrl,
    setDataUrl,
    clearDataUrl,

    getEncryptionKey,
    setEncryptionKey,
    clearEncryptionKey,
};

export default SettingsStorage;