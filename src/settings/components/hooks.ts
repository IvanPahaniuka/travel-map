import { useEffect, useState } from "react";
import SettingsStorage, { Settings } from "..";

export const useSettings = (): Settings => {
    const [settings, setSettings] = useState<Settings>(() => SettingsStorage.getSettings());

    useEffect(() => {
        const onSettingsChanged = () => {
            setSettings(SettingsStorage.getSettings()); 
        };
        SettingsStorage.addEventListener('changed', onSettingsChanged);
        onSettingsChanged();

        return () => {
            SettingsStorage.removeEventListener('changed', onSettingsChanged);
        };
    }, []);

    return settings;
};