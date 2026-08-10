import Translations from '../translations/translations.js';
import Spotify from '../spotify/spotify.js';
import Markers from '../markers/markers.js';


// TODO add seek and resume track after focusing on previous place where track was paused (save all places last tracks with pasue position and time) (like a radio)
// TODO add multiple music formats support (spotify or files) and array of songs
// TODO implement loading data and files from files cloud (e.g. Google Drive) + with access token as parameter
// TODO implement dialog window that asks to provide url to data.json if it wasn't provided as parameter to index.html (e.g. ?data_url=https://example.com/data.json) 
// TODO implement parameters support in data.json (e.g. access_token)
// TODO fix video playback
// TODO implement video preview (maybe extend gallery items with objects support e.g. { "url": "....", "preview": "....." })
// TODO add hero-card
// TODO add ./ support to data.json and gallery items urls. It should be relative to the data.json file location, not the index.html file location.

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

	Translations.init(places);

	await Spotify.init();

	Markers.init(map, places);
}

init();
