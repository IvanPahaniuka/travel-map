import Spotify from '../spotify/spotify.js';
import Translations from '../translations.js';
import UI from '../ui/ui.js';
import Utils from '../utils.js';
import SettingsStorage from './settings-storage.js';

const show = Utils.createSingleExecutor('settings-dialog', async () => {
    const initialDataUrl = SettingsStorage.getDataUrl();
    const contentElement = document.createElement('div');
    contentElement.className = 'settings-dialog-content';

    const dataUrlElement = createDataUrlElement();
    contentElement.appendChild(dataUrlElement);

    const spotifyElement = await createSpotifyElement();
    contentElement.appendChild(spotifyElement);

	const showResult = UI.Dialog.show({
		className: 'settings-dialog',
		title: Translations.get('settings-dialog-title'),
		content: contentElement,
	});

    const result = await showResult.promise;
    if (SettingsStorage.getDataUrl() !== initialDataUrl) {
        window.location.reload();
    }

	return result;

    function createDataUrlElement() {
        const dataUrlGroupElement = document.createElement('div');
        dataUrlGroupElement.className = 'settings-data-url-group';

        const labelElement = document.createElement('label');
        labelElement.className = 'settings-data-url-label';
        labelElement.textContent = 'Data URL';

        const inputElement = document.createElement('input');
        inputElement.className = 'settings-data-url-input';
        inputElement.type = 'url';
        inputElement.value = SettingsStorage.getDataUrl() || '';
        inputElement.addEventListener('change', () => {
            const dataUrl = inputElement.value.trim();
            if (dataUrl) {
                SettingsStorage.setDataUrl(dataUrl);
            } else {
                SettingsStorage.clearDataUrl();
            }
        });

        labelElement.htmlFor = inputElement.id = 'settings-data-url-input';
        dataUrlGroupElement.append(labelElement, inputElement);
        return dataUrlGroupElement;
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