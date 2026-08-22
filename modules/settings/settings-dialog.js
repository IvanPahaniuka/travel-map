import Spotify from '../spotify/spotify.js';
import Translations from '../translations.js';
import UI from '../ui/ui.js';
import Utils from '../utils.js';

const show = Utils.createSingleExecutor('settings-dialog', async () => {
    const contentElement = document.createElement('div');
    contentElement.className = 'settings-dialog-content';

    const spotifyElement = await createSpotifyElement();
    contentElement.appendChild(spotifyElement);

	const showResult = UI.Dialog.show({
		className: 'settings-dialog',
		title: Translations.get('settings-dialog-title'),
		content: contentElement,
	});

	return showResult.promise;

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