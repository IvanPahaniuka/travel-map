import Dialog from '../dialog/dialog.js';
import Translations from '../translations.js';
import Utils from '../utils.js';
import SpotifyAuth from './spotify-auth.js';

const show = Utils.createSingleExecutor('spotify-auth-dialog', async () => {
	const showResult = Dialog.show({
		className: 'spotify-auth-dialog',
		title: Translations.get('spotify-auth-dialog-title'),
		message: Translations.get('spotify-auth-dialog-message'),
		showCloseButton: false,
		buttons: [
			{
                className: 'spotify-auth-dialog-button-authorize',
                type: 'primary',
				content: Translations.get('spotify-auth-dialog-button-authorize'),
				onClick: () => {
					SpotifyAuth.authorize();
				},
			},
			{
                type: 'secondary',
				content: Translations.get('spotify-auth-dialog-button-close'),
				onClick: () => {
					showResult.close();
				},
			}
		],
	});

	return showResult.promise;
}, true);

const SpotifyAuthDialog = {
    show
};

export default SpotifyAuthDialog;