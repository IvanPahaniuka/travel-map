import { Settings, SettingsDataEntry, SettingsEvents, SettingsStorage } from ".";
import { createEventBus } from "../common/utils";

export function createSettingsStorageInMemory(initialSettings: Settings) {

    let settings: Settings = initialSettings;

    const eventBus = createEventBus<SettingsEvents>();
    const notifyEventListeners = eventBus.notifyEventListeners;
    const addEventListener = eventBus.addEventListener;
    const removeEventListener = eventBus.removeEventListener;

    const copySettings = (settings: Settings): Settings => {
        const dataCopy = settings.data.map(d => ({ ...d } satisfies SettingsDataEntry));
        return {
            ...settings,
            data: dataCopy,
            currentData: dataCopy.find(d => d.id === settings.currentData?.id) ?? null,
        };
    }

    const getSettings = (): Settings => copySettings(settings);
    const setSettings = (newSettings: Settings) => { 
        settings = copySettings(newSettings); 
        notifyEventListeners('changed');
    };
    const clearSettings = () => {
        setSettings({
            data: [],
            currentData: null,
            currentPlaceId: null,
        });
    };

    const SettingsStorageInMemory = {
        getSettings,
        setSettings,
        clearSettings,

        addEventListener,
        removeEventListener,
    } satisfies SettingsStorage;

    return SettingsStorageInMemory;
}