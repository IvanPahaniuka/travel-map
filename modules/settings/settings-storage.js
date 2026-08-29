import SpotifyAuthStorage from "../spotify/spotify-auth-storage.js";

const SETTINGS_KEY = 'settings';

/**
 * @typedef {Object} SettingsDataEntry
 * @property {string} url
 * @property {string} [encryption_key]
 * @property {number} [welcome_shown_at]
 */

/**
 * @typedef {Object} Settings
 * @property {SettingsDataEntry[]} data
 */

function createDataEntry(/** @type {SettingsDataEntry} */ entry = {}) {
    return {
        url: typeof entry.url === 'string' ? entry.url : undefined,
        encryption_key: typeof entry.encryption_key === 'string' ? entry.encryption_key : undefined,
        welcome_shown_at: typeof entry.welcome_shown_at === 'number' ? entry.welcome_shown_at : undefined,
    };
}

/**
 * @returns {Settings}
 */
function getSettings() {
    const defaultValue = { data: [{ url: './data/data.json' }] };

    const rawValue = localStorage.getItem(SETTINGS_KEY);
    if (!rawValue) {
        return defaultValue;
    }

    try {
        const settings = JSON.parse(rawValue);
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            return defaultValue;
        }

        const data = Array.isArray(settings.data) ? settings.data : [];
        const result = {
            data: data
                .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
                .map((entry) => createDataEntry({
                    url: entry.url,
                    encryption_key: entry.encryption_key,
                    welcome_shown_at: typeof entry.welcome_shown_at === 'number' ? entry.welcome_shown_at : undefined,
                }))
                .filter((entry) => entry.url || entry.encryption_key || typeof entry.welcome_shown_at === 'number'),
        };

        if (result.data.length === 0) {
            return defaultValue;
        }

        return result;
    } catch {
        return defaultValue;
    }
}

function setSettings(/** @type {Settings | null | undefined} */ nextSettings) {
    const settings = nextSettings && typeof nextSettings === 'object' && !Array.isArray(nextSettings)
        ? nextSettings
        : { data: [] };

    const normalizedSettings = {
        data: Array.isArray(settings.data)
            ? settings.data
                .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
                .map((entry) => createDataEntry({
                    url: entry.url,
                    encryption_key: entry.encryption_key,
                    welcome_shown_at: entry.welcome_shown_at,
                }))
                .filter((entry) => entry.url || entry.encryption_key || typeof entry.welcome_shown_at === 'number')
            : [],
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizedSettings));
}

function clearSettings() {
    localStorage.removeItem(SETTINGS_KEY);
}

const SettingsStorage = {
    Spotify: SpotifyAuthStorage,

    getSettings,
    setSettings,
    clearSettings,
};

export default SettingsStorage;