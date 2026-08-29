import Translations from '../translations.js';
import Spotify from '../spotify/spotify.js';
import PlayerWidget from "../player/player-widget.js";
import Markers from '../markers/markers.js';
import SpotifyAuthDialog from '../spotify/spotify-auth-dialog.js';
import SettingsButton from '../settings/settings-button.js';
import SettingsStorage from '../settings/settings-storage.js';
import ShareButton from '../share/share-button.js';
import UI from '../ui/ui.js';

// TODO Spotify playback. Return canPlay => false if Spotify is not authenticated
// TODO change to place playlist after popup open
// TODO remove settings input autofocus
// TODO add files patterns support for images (e.g. ./paris-2023/*.*)
// TODO add files patterns support for tracks
// TODO add multiple data sources support (data switch)
// TODO implement video preview (maybe extend gallery items with objects support e.g. { "url": "....", "preview": "....." })
// TODO migrate to TS/React/NPM stack
// TODO move all icons (except spotify) to ui/icons
// TODO add playback logo, colors and service link to track to player as it may be required by some services (e.g. spotify)
// TODO implement EventBus util
// TODO implement parameters support in data.json (e.g. access_token)
// TODO add more playbacks (apple music, youtube music etc)

async function loadData() {
	try {
		const dataUrl = SettingsStorage.getDataUrls()?.[0] || './data/data.json';
		const response = await fetch(dataUrl);
		if (!response.ok) {
			throw new Error(`Unable to load data.json (${response.status})`);
		}

		const data = await response.json();

		replaceCurrentDirectory(data, dataUrl);

		return data;
	} catch (error) {
		console.error(error);
		return undefined;
	}

	function replaceCurrentDirectory(data, dataUrl) {
		if (!Array.isArray(data?.places)) {
			return;
		}

		const currentDirectory = getCurrentDirectory(dataUrl);
		data.places.forEach(place => {
			if (!Array.isArray(place?.gallery)) {
				return;
			}

			place.gallery = place.gallery.map(image => 
				typeof image === 'string' && (image.startsWith('./') || image.startsWith('.\\'))
				? (currentDirectory + image.substring(2))
				: image
			);
		});
	}
	function getCurrentDirectory(/** @type {string} */ dataUrl) {
		const lastSlashIndex = Math.max(dataUrl.lastIndexOf('/'), dataUrl.lastIndexOf('\\'));
		if (lastSlashIndex === -1) {
			return '';
		}

		const result = dataUrl.substring(0, lastSlashIndex + 1);
		return result;
	}
}

function showWelcomeDialog(welcome) {
	if (typeof welcome !== 'object') {
		return;
	}

	Translations.add('welcome-title', welcome?.title);
	Translations.add('welcome-message', welcome?.message);

	return UI.Dialog.show({
		title: Translations.get('welcome-title'),
		message: Translations.get('welcome-message'),
	});
}

function applySharedSettingsFromQuery() {
	const params = new URLSearchParams(window.location.search);

	const dataUrls = params.getAll('data_urls');
	if (dataUrls.length) {
		SettingsStorage.setDataUrls(dataUrls);
		params.delete('data_urls');
	}

	const encryptionKeys = params.getAll('encryption_keys');
	if (encryptionKeys.length) {
		SettingsStorage.setEncryptionKeys(encryptionKeys);
		params.delete('encryption_keys');
	}

	const queryString = params.toString();
	const url = new URL(window.location.href);
	url.search = queryString;
	window.history.replaceState({}, '', url);
}

async function init() {
	applySharedSettingsFromQuery();

	const map = L.map('map', {
		zoomControl: false,
		worldCopyJump: true,
	}).setView([20, 0], 2);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}).addTo(map);

	const data = await loadData();
	const places =  data?.places || [];

	Translations.addPlaces(places);

	showWelcomeDialog(data?.welcome);

	const spotifyResult = await Spotify.init();
	if (!spotifyResult.isAuthorized) {
		SpotifyAuthDialog.show();
	}

	document.body.appendChild(SettingsButton.init());
	document.body.appendChild(ShareButton.init());

	await PlayerWidget.init();
	await Markers.init(map, places);
}

init();
