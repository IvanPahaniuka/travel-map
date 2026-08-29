import SpotifyAuthStorage from "../spotify/spotify-auth-storage.js";

function normalizeValues(/** @type {string | string[] | null | undefined} */ value) {
    const values = Array.isArray(value) ? value : [value];
    return values
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function getDataUrls() {
    const rawValue = localStorage.getItem('data_urls');
    if (!rawValue) {
        return [];
    }

    try {
        return normalizeValues(JSON.parse(rawValue));
    } catch {
        return normalizeValues(rawValue);
    }
}
function setDataUrls(/** @type {string | string[] | null} */ dataUrls) {
    const values = normalizeValues(dataUrls);
    if (!values.length) {
        clearDataUrls();
        return;
    }

    localStorage.setItem('data_urls', JSON.stringify(values));
}

function clearDataUrls() {
    localStorage.removeItem('data_urls');
}

function getEncryptionKeys() {
    const rawValue = localStorage.getItem('encryption_keys');
    if (!rawValue) {
        return [];
    }

    try {
        return normalizeValues(JSON.parse(rawValue));
    } catch {
        return normalizeValues(rawValue);
    }
}
function setEncryptionKeys(/** @type {string | string[] | null} */ encryptionKeys) {
    const values = normalizeValues(encryptionKeys);
    if (!values.length) {
        clearEncryptionKeys();
        return;
    }

    localStorage.setItem('encryption_keys', JSON.stringify(values));
}

function clearEncryptionKeys() {
    localStorage.removeItem('encryption_keys');
}

const SettingsStorage = {
    Spotify: SpotifyAuthStorage,

    getDataUrls,
    setDataUrls,
    clearDataUrls,

    getEncryptionKeys,
    setEncryptionKeys,
    clearEncryptionKeys,
};

export default SettingsStorage;