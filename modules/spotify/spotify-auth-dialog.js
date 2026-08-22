import Translations from '../translations.js';
import UI from '../ui/ui.js';
import Utils from '../utils.js';
import Spotify from './spotify.js';

const show = Utils.createSingleExecutor('spotify-auth-dialog', async () => {
	const showResult = UI.Dialog.show({
		className: 'spotify-auth-dialog',
		title: Translations.get('spotify-auth-dialog-title'),
		message: Translations.get('spotify-auth-dialog-message'),
		showCloseButton: false,
		buttons: [
			{
                className: 'spotify-auth-dialog-button-authorize',
                color: 'primary',
				variant: 'contained',
				text: Translations.get('spotify-auth-dialog-button-authorize'),
				onClick: () => { Spotify.authorize(); },
			},
			{
                color: 'secondary',
				variant: 'outlined',
				text: Translations.get('spotify-auth-dialog-button-close'),
				onClick: (close) => { close(); },
			},
		],
	});

	return showResult.promise;
}, true);

const SpotifyAuthDialog = {
    show
};

export default SpotifyAuthDialog;