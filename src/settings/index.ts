import SpotifyAuthStorage from "../spotify/spotify-auth-storage";

const SETTINGS_KEY = 'settings';

export type SettingsDataEntry = {
    url: string;
    encryptionKey: string;
    welcomeShownAt?: number;
}

export type Settings = {
    data: SettingsDataEntry[];
}


function applySharedSettingsFromQuery() {
    const params = new URLSearchParams(window.location.search);

    const dataUrls = params.getAll('data_urls');
    const encryptionKeys = params.getAll('encryption_keys');

    if (dataUrls.length === 0) {
        return;
    }

    SettingsStorage.setSettings({
        data: [{
            url: dataUrls[0],
            encryptionKey: encryptionKeys[0] ?? '',
        }]
    });

    params.delete('data_urls');
    params.delete('encryption_keys');

    const queryString = params.toString();
    const url = new URL(window.location.href);
    url.search = queryString;
    window.history.replaceState({}, '', url);
}


function getSettings(): Settings {
    applySharedSettingsFromQuery();

    const defaultValue: Settings = { data: [{ url: './data/data.json', encryptionKey: '' }] };

    const rawValue = localStorage.getItem(SETTINGS_KEY);
    if (!rawValue) {
        return defaultValue;
    }

    try {
        const settings = JSON.parse(rawValue);
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            return defaultValue;
        }

        const data: any[] = Array.isArray(settings.data) ? settings.data : [];
        const result = {
            data: data
                .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
                .map((entry) => ({
                    url: entry.url,
                    encryptionKey: entry.encryption_key ?? '',
                    welcomeShownAt: typeof entry.welcome_shown_at === 'number'
                        ? entry.welcome_shown_at
                        : undefined,
                }))
                .filter((entry) =>
                    typeof entry.url === 'string' && entry.url.length > 0
                    && typeof entry.encryptionKey === 'string'
                    && ['number', 'undefined'].includes(typeof entry.welcomeShownAt)
                ),
        };

        if (result.data.length === 0) {
            return defaultValue;
        }

        return result;
    } catch {
        return defaultValue;
    }
}

function setSettings(settings: Settings) {
    const normalizedSettings = {
        data: Array.isArray(settings.data)
            ? settings.data.map((entry) => ({
                url: entry.url,
                encryption_key: entry.encryptionKey,
                welcome_shown_at: entry.welcomeShownAt,
            }))
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