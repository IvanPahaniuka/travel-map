import Dialog from '../dialog/dialog.js';
import Translations from '../translations.js';
import Utils from '../utils.js';
import SpotifyAuth from './spotify-auth.js';

const show = Utils.createSingleExecutor('spotify-auth-dialog', async () => {
	const showResult = Dialog.show({
		className: 'spotify-auth-dialog',
		title: Translations.get('spotify-dialog-title'),
		message: Translations.get('spotify-dialog-message'),
		buttons: [
			{
				content: Translations.get('spotify-dialog-button'),
				onClick: () => {
					SpotifyAuth.authorize();
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