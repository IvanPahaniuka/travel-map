import { FC, useEffect, useRef } from "react";
import { TravelData } from "../travel-data";
import { Dialog } from "../common/dialog";
import SettingsStorage from "../settings/settings-storage";

export type WelcomeDialogProps = {
    welcomeData?: TravelData['welcome'];
}

export const WelcomeDialog: FC<WelcomeDialogProps> = ({ welcomeData }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (typeof welcomeData !== 'object' || !dialogRef.current) {
            return;
        }

        const settings = SettingsStorage.getSettings();
        const lastWelcomeShownAt = settings.data[0].welcomeShownAt;

        if (typeof lastWelcomeShownAt !== 'number' || Date.now() - lastWelcomeShownAt > 30 * 60 * 1000) {
            dialogRef.current.showModal();
        }

        settings.data[0].welcomeShownAt = Date.now();
        SettingsStorage.setSettings(settings);
    }, [welcomeData]);

    return (
        <Dialog
            ref={dialogRef}
            header={welcomeData?.title}
            message={welcomeData?.message}
            showCloseButton={true}
        />
    );
}