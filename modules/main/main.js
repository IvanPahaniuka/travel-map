import Translations from '../translations.js';
import Spotify from '../spotify/spotify.js';
import PlayerWidget from "../player/player-widget.js";
import Markers from '../markers/markers.js';
import SpotifyAuthDialog from '../spotify/spotify-auth-dialog.js';
import SettingsButton from '../settings/settings-button.js';

// TODO implement loading data and files from files cloud (e.g. Google Drive) + with access token as parameter
// TODO implement dialog window that asks to provide url to data.json if it wasn't provided as parameter to index.html (e.g. ?data_url=https://example.com/data.json) 
// TODO implement parameters support in data.json (e.g. access_token)
// TODO fix video playback
// TODO implement video preview (maybe extend gallery items with objects support e.g. { "url": "....", "preview": "....." })
// TODO add hero-card
// TODO add ./ support to data.json and gallery items urls. It should be relative to the data.json file location, not the index.html file location.
// TODO add more music source support / more playbacks (files, apple music, youtube music etc)
// TODO add image to player

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

async function loadData() {
	try {
		const response = await fetch('./data/data.json');
		if (!response.ok) {
			throw new Error(`Unable to load data.json (${response.status})`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
		return undefined;
	}
}

async function loadPlaces() {
	const data = await loadData();
	return data?.places || [];
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
