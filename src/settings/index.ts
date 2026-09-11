import Utils, { Events, Event, EventListener, EventBus } from "../common/utils";

const SETTINGS_KEY = 'settings';
const DEFAULT_DATA_URL = './data/data.json';

export type SettingsDataEntry = {
    id: number;
    url: string;
    encryptionKey: string;
    welcomeShownAt?: number;
}

export type Settings = {
    data: SettingsDataEntry[];
    currentData: SettingsDataEntry | null;
    currentPlaceId: string | null; 
}

export type SettingsEvents = {
    'changed': [],
};
export type SettingsEvent = Event<SettingsEvents>;
export type SettingsEventListener<TEvent extends SettingsEvent = SettingsEvent> = EventListener<SettingsEvents, TEvent>;

export type SettingsStorage = {
    getSettings: () => Settings,
    setSettings: (settings: Settings) => void,
    clearSettings: () => void,

    addEventListener: EventBus<SettingsEvents>['addEventListener'],
    removeEventListener: EventBus<SettingsEvents>['removeEventListener'],
}

let isApplySharedSettingsFromQueryActive = false;
function applySharedSettingsFromQuery() {
    if (isApplySharedSettingsFromQueryActive === true) {
        return;
    }

    isApplySharedSettingsFromQueryActive = true;
    try {
        const params = new URLSearchParams(window.location.search);

        const dataUrl = params.get('data_url');
        const encryptionKey = params.get('encryption_key');
        const currentPlaceId = params.get('current_place_id');

        if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
            return;
        }

        const settings = SettingsStorage.getSettings();

        let dataEntry = settings.data.find(d => d.url === dataUrl);
        if (dataEntry) {
            dataEntry.encryptionKey = encryptionKey ?? dataEntry.encryptionKey;
        } else {
            let newId = 1;
            while (settings.data.some(d => d.id === newId)) { newId++; }
            dataEntry = {
                id: newId,
                url: dataUrl,
                encryptionKey: encryptionKey ?? '',
            };
            settings.data.push(dataEntry);
        }

        settings.currentData = dataEntry;
        settings.currentPlaceId = currentPlaceId;

        SettingsStorage.setSettings(settings);

        params.delete('data_url');
        params.delete('encryption_key');
        params.delete('current_place_id');

        const queryString = params.toString();
        const url = new URL(window.location.href);
        url.search = queryString;
        window.history.replaceState({}, '', url);
    } finally {
        isApplySharedSettingsFromQueryActive = false;
    }
}

export function createShareUrl(settings: Settings): string {
    const shareUrl = new URL(window.location.href);

    if (!settings.currentData) {
        return shareUrl.toString();
    }

    appendValuesToUrl(shareUrl, 'data_url', settings.currentData.url);
    appendValuesToUrl(shareUrl, 'encryption_key', settings.currentData.encryptionKey);

    if (settings.currentPlaceId !== null) {
        appendValuesToUrl(shareUrl, 'current_place_id', settings.currentPlaceId);
    }

    return shareUrl.toString();

    function appendValuesToUrl(url: URL, paramName: string, values: string[] | string | null) {
        const normalizedValues = Array.isArray(values)
            ? values.filter((value) => typeof value === 'string').map((value) => value)
            : typeof values === 'string'
            ? [values]
            : [];

        url.searchParams.delete(paramName);

        normalizedValues.forEach((value) => {
            url.searchParams.append(paramName, value);
        });
    }
}

let currentPlaceId: string | null = null;
function getSettings(): Settings {
    applySharedSettingsFromQuery();

    const defaultDataEntry = { id: 1, url: DEFAULT_DATA_URL, encryptionKey: '' };
    const defaultValue: Settings = { 
        data: [defaultDataEntry], 
        currentData: defaultDataEntry, 
        currentPlaceId: currentPlaceId,
    };

    const rawValue = localStorage.getItem(SETTINGS_KEY);
    if (!rawValue) {
        return defaultValue;
    }

    try {
        const parsedSettings = JSON.parse(rawValue);
        if (!parsedSettings || typeof parsedSettings !== 'object' || parsedSettings === null || Array.isArray(parsedSettings)) {
            return defaultValue;
        }

        const parsedData: any[] = Array.isArray(parsedSettings.data) ? parsedSettings.data : [];
        const data: SettingsDataEntry[] = parsedData
            .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
            .map((entry) => ({
                id: entry.id,
                url: entry.url ?? '',
                encryptionKey: entry.encryption_key ?? '',
                welcomeShownAt: typeof entry.welcome_shown_at === 'number'
                    ? entry.welcome_shown_at
                    : undefined,
            }))
            .filter((entry) =>
                typeof entry.id === 'number' && entry.id > 0
                && typeof entry.url === 'string'
                && typeof entry.encryptionKey === 'string'
                && (typeof entry.welcomeShownAt === 'number' || typeof entry.welcomeShownAt === 'undefined')
            );

        const currentDataId: number | null = typeof parsedSettings.current_data_id === 'number' 
            ? parsedSettings.current_data_id
            : null;

        const currentData = data.find(d => d.id === currentDataId) ?? null;
        
        const result: Settings = {
            data: data,
            currentData: currentData,
            currentPlaceId: currentPlaceId,
        };

        return result;
    } catch {
        return defaultValue;
    }
}

function setSettings(settings: Settings) {
    const normalizedSettings = {
        data: Array.isArray(settings.data)
            ? settings.data.map((entry) => ({
                id: entry.id,
                url: entry.url,
                encryption_key: entry.encryptionKey,
                welcome_shown_at: entry.welcomeShownAt,
            }))
            : [],
        current_data_id: settings.currentData?.id ?? null,
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizedSettings));
    currentPlaceId = settings.currentPlaceId;

    notifyEventListeners('changed');
}

function clearSettings() {
    setSettings({
        data: [],
        currentData: null,
        currentPlaceId: null,
    });
}

const eventBus = Utils.createEventBus<SettingsEvents>();
const notifyEventListeners = eventBus.notifyEventListeners;
const addEventListener = eventBus.addEventListener;
const removeEventListener = eventBus.removeEventListener;

const SettingsStorage = {
    getSettings,
    setSettings,
    clearSettings,

    addEventListener,
    removeEventListener,
} satisfies SettingsStorage;

export default SettingsStorage;