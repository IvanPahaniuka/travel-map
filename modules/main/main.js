import Translations from '../translations.js';
import Spotify from '../spotify/spotify.js';
import PlayerWidget from "../player/player-widget.js";
import Markers from '../markers/markers.js';
import SpotifyAuthDialog from '../spotify/spotify-auth-dialog.js';
import SettingsButton from '../settings/settings-button.js';
import SettingsStorage from '../settings/settings-storage.js';

// TODO migrate to TS/React/NPM stack
// TODO add files patterns support for images (e.g. ./data/paris-2023/*.*)
// TODO add files patterns support for tracks
// TODO fix video playback
// TODO implement video preview (maybe extend gallery items with objects support e.g. { "url": "....", "preview": "....." })
// TODO add hero-card
// TODO add playback logo, colors and service link to track to player as it may be required by some services (e.g. spotify)
// TODO implement EventBus util
// TODO implement parameters support in data.json (e.g. access_token)
// TODO add more playbacks (apple music, youtube music etc)

async function loadData() {
	try {
		const dataUrl = SettingsStorage.getDataUrl() || './data/data.json';
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

async function loadPlaces() {
	const data = await loadData();
	const places =  data?.places || [];
	return places;
}

async function init() {

	const map = L.map('map', {
		zoomControl: false,
		worldCopyJump: true,
	}).setView([20, 0], 2);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}).addTo(map);

	const places = await loadPlaces();

	Translations.addPlaces(places);

	const spotifyResult = await Spotify.init();
	if (!spotifyResult.isAuthorized) {
		SpotifyAuthDialog.show();
	}

	document.body.appendChild(SettingsButton.init());

	await PlayerWidget.init();
	await Markers.init(map, places);
}

init();
