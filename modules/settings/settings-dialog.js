import Spotify from '../spotify/spotify.js';
import Encryption from '../encryption.js';
import Translations from '../translations.js';
import UI from '../ui/ui.js';
import Utils from '../utils.js';
import SettingsStorage from './settings-storage.js';

const show = Utils.createSingleExecutor('settings-dialog', async () => {
    const initialDataUrl = SettingsStorage.getDataUrls()?.[0];
    const initialEncryptionKey = SettingsStorage.getEncryptionKeys()?.[0];

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

    if (SettingsStorage.getDataUrls()?.[0] !== initialDataUrl) {
        window.location.reload();
    }
    if (SettingsStorage.getEncryptionKeys()?.[0] !== initialEncryptionKey) {
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
        inputElement.value = SettingsStorage.getDataUrls()?.[0] || '';
        inputElement.addEventListener('change', () => {
            const dataUrl = inputElement.value.trim();
            if (dataUrl) {
                SettingsStorage.setDataUrls([dataUrl]);
            } else {
                SettingsStorage.clearDataUrls();
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
        inputElement.value = SettingsStorage.getEncryptionKeys()?.[0] || '';
        inputElement.addEventListener('change', () => {
            const encryptionKey = inputElement.value;
            if (encryptionKey) {
                SettingsStorage.setEncryptionKeys([encryptionKey]);
            } else {
                SettingsStorage.clearEncryptionKeys();
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