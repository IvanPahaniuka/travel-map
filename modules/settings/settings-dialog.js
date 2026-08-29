import Spotify from '../spotify/spotify.js';
import Encryption from '../encryption.js';
import Translations from '../translations.js';
import UI from '../ui/ui.js';
import Utils from '../utils.js';
import SettingsStorage from './settings-storage.js';

const show = Utils.createSingleExecutor('settings-dialog', async () => {
    const settings = SettingsStorage.getSettings();
    const initialDataUrl = settings.data[0].url;
    const initialEncryptionKey = settings.data[0].encryption_key;

    const contentElement = document.createElement('div');
    contentElement.className = 'settings-dialog-content';

    const dataUrlElement = createDataUrlElement();
    contentElement.appendChild(dataUrlElement);

    const encryptionKeyElement = createEncryptionKeyElement();
    contentElement.appendChild(encryptionKeyElement);

    const spotifyElement = await createSpotifyElement();
    contentElement.appendChild(spotifyElement);

	const showResult = UI.Dialog.show({
		className: 'settings-dialog',
		title: Translations.get('settings-dialog-title'),
		content: contentElement,
	});

    const result = await showResult.promise;

    const nextSettings = SettingsStorage.getSettings();
    if (nextSettings.data[0].url !== initialDataUrl) {
        window.location.reload();
    }
    if (nextSettings.data[0].encryption_key !== initialEncryptionKey) {
        window.location.reload();
    }

	return result;

    function createDataUrlElement() {
        const dataUrlGroupElement = document.createElement('div');
        dataUrlGroupElement.className = 'settings-input-group settings-data-url-group';

        const labelElement = document.createElement('label');
        labelElement.className = 'settings-input-label settings-data-url-label';
        labelElement.textContent = 'Data URL';

        const inputElement = document.createElement('input');
        inputElement.className = 'settings-input settings-data-url-input';
        inputElement.type = 'url';
        inputElement.value = SettingsStorage.getSettings().data[0]?.url || '';
        inputElement.addEventListener('change', () => {
            const dataUrl = inputElement.value.trim();
            const currentSettings = SettingsStorage.getSettings();
            const entry = currentSettings.data[0] || { url: '' };
            if (dataUrl) {
                SettingsStorage.setSettings({ data: [{ ...entry, url: dataUrl }] });
            } else {
                SettingsStorage.setSettings({ data: [{ ...entry, url: '' }] });
            }
        });

        labelElement.htmlFor = inputElement.id = 'settings-data-url-input';
        dataUrlGroupElement.append(labelElement, inputElement);
        return dataUrlGroupElement;
    }

    function createEncryptionKeyElement() {
        const encryptionKeyGroupElement = document.createElement('div');
        encryptionKeyGroupElement.className = 'settings-input-group settings-encryption-key-group';

        const labelElement = document.createElement('label');
        labelElement.className = 'settings-input-label settings-encryption-key-label';
        labelElement.textContent = 'Encryption Key';

        const inputElement = document.createElement('input');
        inputElement.className = 'settings-input settings-encryption-key-input';
        inputElement.type = 'password';
        inputElement.value = SettingsStorage.getSettings().data[0]?.encryption_key || '';
        inputElement.addEventListener('change', () => {
            const encryptionKey = inputElement.value;
            const currentSettings = SettingsStorage.getSettings();
            const entry = currentSettings.data[0] || { encryption_key: undefined };
            if (encryptionKey) {
                SettingsStorage.setSettings({ data: [{ ...entry, encryption_key: encryptionKey }] });
            } else {
                SettingsStorage.setSettings({ data: [{ ...entry, encryption_key: undefined }] });
            }
        });

        labelElement.htmlFor = inputElement.id = 'settings-encryption-key-input';

        const encryptButtonElement = UI.Button.createElement({
            className: 'settings-input-button settings-encryption-key-button',
            autofocus: false,
            color: 'secondary',
            variant: 'outlined',
            onClick: () => {
                if (!inputElement.value) {
                    inputElement.focus();
                    return;
                }

                const fileInputElement = document.createElement('input');
                fileInputElement.type = 'file';
                fileInputElement.addEventListener('change', async () => {
                    const file = fileInputElement.files?.[0];
                    if (!file) {
                        return;
                    }

                    const encryptedData = await Encryption.encrypt(
                        new Uint8Array(await file.arrayBuffer()),
                        inputElement.value,
                    );
                    const downloadUrl = URL.createObjectURL(new Blob([encryptedData]));
                    const downloadElement = document.createElement('a');
                    downloadElement.href = downloadUrl;
                    downloadElement.download = `${file.name}.encrypted`;
                    downloadElement.click();
                    URL.revokeObjectURL(downloadUrl);
                });
                fileInputElement.click();
            }
        });

        encryptButtonElement.innerHTML = UI.Icons.LockFile;

        encryptionKeyGroupElement.append(labelElement, inputElement, encryptButtonElement);
        return encryptionKeyGroupElement;
    }

    async function createSpotifyElement() {

        const spotifyGroupElement = document.createElement('div');
        spotifyGroupElement.className = 'settings-spotify-group';
        
        const spotifyLogoElement = document.createElement('img');
        spotifyLogoElement.className = 'settings-spotify-logo';
        spotifyLogoElement.src = Spotify.icons.FullLogoGreen;
        spotifyLogoElement.alt = 'Spotify';
        spotifyGroupElement.appendChild(spotifyLogoElement);

        const isSpotifyAuthorized = await Spotify.isAuthorized();  
        const spotifyButtonElement = isSpotifyAuthorized
            ? UI.Button.createElement({
                className: 'settings-spotify-button',
                color: 'primary',
                variant: 'contained',
                text: Translations.get('settings-spotify-button-logout'),
                onClick: () => { 
                    Spotify.logout().then(() => { window.location.reload(); });
                },
            })
            : UI.Button.createElement({
                className: 'settings-spotify-button',
                color: 'primary',
                variant: 'contained',
                text: Translations.get('settings-spotify-button-authorize'),
                onClick: () => { 
                    Spotify.authorize();
                },
            });

        spotifyGroupElement.appendChild(spotifyButtonElement);
        
        return spotifyGroupElement;
    } 
}, true);

const SettingsDialog = {
    show
};

export default SettingsDialog;