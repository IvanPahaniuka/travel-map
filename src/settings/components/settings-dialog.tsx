import './settings-dialog.css';

import Spotify from '../../spotify';
import Encryption from '../../encryption';
import Translations from '../../translations';
import SettingsStorage, { Settings } from '../settings-storage';
import { ChangeEventHandler, FC, Ref, Suspense, use, useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { Dialog } from '../../common/dialog';
import { Button } from '../../common/button';
import Icons from '../../common/icons';
import SpotifyIcons from '../../spotify/components/spotify-icons';
import { Loader } from '../../common/loader';
import Utils from '../../common/utils';

export type SettingsDialogProps = {
    ref?: Ref<HTMLDialogElement>;
};

const SettingsDialogContent: FC<{ settings: Settings, isSpotifyAuthorized: boolean | null }> = ({ settings, isSpotifyAuthorized }) => {

    const onDataUrlChanged = useCallback<ChangeEventHandler<HTMLInputElement, HTMLInputElement>>((event) => {
        const dataUrl = event.target.value.trim();
        const currentSettings = SettingsStorage.getSettings();
        const entry = currentSettings.data[0];
        if (dataUrl) {
            SettingsStorage.setSettings({ data: [{ ...entry, url: dataUrl }] });
        } else {
            SettingsStorage.setSettings({ data: [{ ...entry, url: '' }] });
        }
    }, []);

    const onEncryptionKeyChanged = useCallback<ChangeEventHandler<HTMLInputElement, HTMLInputElement>>((event) => {
        const encryptionKey = event.target.value;
        const currentSettings = SettingsStorage.getSettings();
        const entry = currentSettings.data[0];
        if (encryptionKey) {
            SettingsStorage.setSettings({ data: [{ ...entry, encryptionKey: encryptionKey }] });
        } else {
            SettingsStorage.setSettings({ data: [{ ...entry, encryptionKey: '' }] });
        }
    }, []);

    const onEncryptClick = useCallback(() => {
        const currentSettings = SettingsStorage.getSettings();
        const encryptionKey = currentSettings.data[0].encryptionKey;
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.addEventListener('change', async () => {
            const file = fileInputElement.files?.[0];
            if (!file) {
                return;
            }

            const encryptedData = await Encryption.encrypt(
                new Uint8Array(await file.arrayBuffer()),
                encryptionKey,
            );
            const downloadUrl = URL.createObjectURL(new Blob([encryptedData]));
            const downloadElement = document.createElement('a');
            downloadElement.href = downloadUrl;
            downloadElement.download = `${file.name}.encrypted`;
            downloadElement.click();
            URL.revokeObjectURL(downloadUrl);
        });
        fileInputElement.click();
    }, []);

    const onSpotifyLoginClick = useCallback(() => { 
        Spotify.authorize();
    }, []);

    const onSpotifyLogoutClick = useCallback(() => { 
        Spotify.logout().then(() => { window.location.reload(); });
    }, []);

    return (
        <div className='settings-dialog-content'>
            <div className='settings-input-group settings-data-url-group'>
                <label 
                    className='settings-input-label settings-data-url-label'
                    htmlFor='settings-data-url-input'
                    children={Translations.get('settings-dialog-data-url-label')}
                />
                <input
                    id='settings-data-url-input'
                    className='settings-input settings-data-url-input'
                    type='url'
                    value={settings.data[0].url}
                    onChange={onDataUrlChanged}
                />
            </div>

            <div className='settings-input-group settings-encryption-key-group'>
                <label
                    className='settings-input-label settings-encryption-key-label'
                    htmlFor='settings-encryption-key-input'
                    children={Translations.get('settings-dialog-encryption-key-label')}
                />

                <input
                    id='settings-encryption-key-input'
                    className='settings-input settings-encryption-key-input'
                    type='password'
                    value={settings.data[0].encryptionKey}
                    onChange={onEncryptionKeyChanged}
                />

                <Button
                    className='settings-input-button settings-encryption-key-button'
                    autoFocus={false}
                    color='secondary'
                    variant='outlined'
                    onClick={onEncryptClick}
                    children={<Icons.LockFile/>}
                />
            </div>

            <div className='settings-spotify-group'>
                <img
                    className='settings-spotify-logo'
                    src={SpotifyIcons.FullLogoGreen}
                    alt='Spotify'
                />

                <Button
                    className='settings-spotify-button'
                    color='primary'
                    variant='contained'
                    {...(isSpotifyAuthorized === true
                        ? {
                            onClick: onSpotifyLogoutClick,
                            children: Translations.get('settings-spotify-button-logout'),
                        } 
                        : isSpotifyAuthorized === false
                        ? {
                            onClick: onSpotifyLoginClick,
                            children: Translations.get('settings-spotify-button-authorize'),
                        } 
                        : {
                            disabled: true,
                            children: (<Loader />),
                        } 
                    )}
                />
            </div>
        </div>
    );
};

export const SettingsDialog: FC<SettingsDialogProps> = ({ ref }) => {
    const [settings, setSettings] = useState<Settings>(() => SettingsStorage.getSettings());
    
    const [isSpotifyAuthorized, setIsSpotifyAuthorized] = useState<boolean | null>(null);

    const dialogRefCallback = useCallback((dialog: HTMLDialogElement | null) => {
        if (!dialog) {
            return;
        }

        let observer = new MutationObserver(function(mutations)  {
            const settings = SettingsStorage.getSettings();
            if (dialog.open) {
                setSettings(settings);
                Spotify.isAuthorized().then(setIsSpotifyAuthorized);
            } else {
                if (settings.data[0].url !== settings.data[0].url) {
                    window.location.reload();
                }
                if (settings.data[0].encryptionKey !== settings.data[0].encryptionKey) {
                    window.location.reload();
                }
            }
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })

        return () => {
            observer.disconnect();
        };
    }, []);
    const dialogRef = Utils.useMergedRef(ref, dialogRefCallback);

    return (
        <Dialog
            ref={dialogRef}
            className='settings-dialog'
            header={Translations.get('settings-dialog-title')}
            showCloseButton={true}
        >
            <SettingsDialogContent 
                settings={settings}
                isSpotifyAuthorized={isSpotifyAuthorized}
            />
        </Dialog>
    );
}