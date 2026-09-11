import { FC, useEffect, useRef } from "react";
import { TravelData } from "../travel-data";
import { Dialog } from "../common/dialog";
import SettingsStorage from "../settings";

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

        if (settings.currentData === null) {
            return;
        }

        const lastWelcomeShownAt = settings.currentData.welcomeShownAt;

        if (typeof lastWelcomeShownAt !== 'number' || Date.now() - lastWelcomeShownAt > 30 * 60 * 1000) {
            dialogRef.current.showModal();
        }

        settings.currentData.welcomeShownAt = Date.now();
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