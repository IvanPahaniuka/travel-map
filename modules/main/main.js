import Place from '../place/place.js';
import Translations from '../translations/translations.js';
import Spotify from '../spotify/spotify.js';

let places = [];
let currentCenteredPlaceId = null;

// TODO add seek and resume track after focusing on previous place where track was paused (save all places last tracks with pasue position and time) (like a radio)
// TODO add multiple music formats support (spotify or files) and array of songs
// TODO implement loading data and files from files cloud (e.g. Google Drive) + with access token as parameter
// TODO implement dialog window that asks to provide url to data.json if it wasn't provided as parameter to index.html (e.g. ?data_url=https://example.com/data.json) 
// TODO implement parameters support in data.json (e.g. access_token)
// TODO fix video playback
// TODO implement video preview (maybe extend gallery items with objects support e.g. { "url": "....", "preview": "....." })
// TODO add hero-card
// TODO add ./ support to data.json and gallery items urls. It should be relative to the data.json file location, not the index.html file location.

const map = L.map('map', {
	zoomControl: false,
	worldCopyJump: true,
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution:
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);


function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function createMarkerIcon() {
	return L.divIcon({
		html: '<span class="marker-dot"></span>',
		className: 'travel-marker',
		iconSize: [24, 24],
		iconAnchor: [12, 24],
	});
}

let glightboxInstance = null;

function buildPopupGallery(place, titleId, maxThumbs = 4) {
	if (!Array.isArray(place.gallery) || place.gallery.length === 0) return '';
	const galleryId = Place.getGalleryClassName(place.id);
	const visible = place.gallery.slice(0, maxThumbs);
	const hidden = place.gallery.slice(maxThumbs);

	const visibleHtml = visible
		.map((url) => {
			const href = escapeHtml(url);
			return `<a href="${href}" class="glightbox" data-gallery="${galleryId}"><img src="${href}" alt="${escapeHtml(Translations.get(titleId) || '')}"></a>`;
		})
		.join('');

	const hiddenHtml = hidden
		.map((url) => {
			const href = escapeHtml(url);
			return `<a href="${href}" class="glightbox hidden" data-gallery="${galleryId}"></a>`;
		})
		.join('');

	return `<div class="popup-gallery">${visibleHtml}${hiddenHtml}</div>`;
}

function buildPopupContent(place) {

	const titleId = Place.getTitleClassName(place.id);
	const date = new Date(place.date);
	const formattedDate = Number.isNaN(date.valueOf())
		? ''
		: new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);

	const galleryHtml = buildPopupGallery(place, titleId);

	return `
    <div class="popup-card">
      <div class="popup-header">
        ${formattedDate ? `<span class="popup-date">${formattedDate}</span>` : ''}
        <h2 class="${titleId}">${Translations.get(titleId)}</h2>
      </div>
      <div class="popup-body">
        ${galleryHtml}
      </div>
    </div>
  `;
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
		const message = document.createElement('div');
		message.className = 'hero-card';
		message.innerHTML = `<p class="eyebrow">Notice</p><p>${escapeHtml(error.message)}</p>`;
		document.body.appendChild(message);
		return undefined;
	}
}

async function loadPlaces() {
	const data = await loadData();
	return data?.places || [];
}

function updateLoudestPlace() {
	const pauseTrackRadiusPixels = 600;
	const playTrackRadiusPixels = 300;
	const switchTrackRadiusPixels = 100;
	
	const mapCenter = map.getCenter();
	const mapCenterPoint = map.latLngToContainerPoint(mapCenter);

	let centeredPlace = null;
	let centeredDistance = Number.POSITIVE_INFINITY;
	let lastCenteredDistance = Number.POSITIVE_INFINITY;

	places.forEach((place) => {
		const placePoint = map.latLngToContainerPoint(L.latLng(place.latitude, place.longitude));
		const pixelDistance = Math.hypot(placePoint.x - mapCenterPoint.x, placePoint.y - mapCenterPoint.y);

		if (place.id === currentCenteredPlaceId) {
			lastCenteredDistance = pixelDistance;
		}

		if (pixelDistance < centeredDistance) {
			centeredDistance = pixelDistance;
			centeredPlace = place;
		}
	});

	if (currentCenteredPlaceId !== null && lastCenteredDistance > pauseTrackRadiusPixels) {
		currentCenteredPlaceId = null;
		Spotify.pause();
	} else if (centeredPlace !== null && centeredPlace.id !== currentCenteredPlaceId) {
		const playTrack = centeredDistance <= (currentCenteredPlaceId === null ? playTrackRadiusPixels : switchTrackRadiusPixels);
		if (playTrack) {
			currentCenteredPlaceId = centeredPlace.id;
			Spotify.playTrackForPlace(centeredPlace.id);
		}
	}
}

async function init() {

	places = await loadPlaces();

	Translations.init(places);

	const markers = [];

	places.forEach((place) => {
		const marker = L.marker([place.latitude, place.longitude], {
			icon: createMarkerIcon(),
		}).addTo(map);

		marker.bindPopup(buildPopupContent(place), {
			className: 'travel-popup',
			minWidth: 250,
			maxWidth: 600,
			closeButton: false,
			offset: [0, -12],
		});

		markers.push(marker);
	});

	if (markers.length > 0) {
		const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
		map.fitBounds(bounds.pad(0.25));
	}

	map.on('popupopen', (e) => {
		if (typeof GLightbox !== 'function') return;
		if (!glightboxInstance) {
			glightboxInstance = GLightbox({ selector: '.glightbox' });
		} else if (typeof glightboxInstance.reload === 'function') {
			glightboxInstance.reload();
		}
	});

	await Spotify.init();

	updateLoudestPlace();

	map.on('move', updateLoudestPlace);
	map.on('zoom', updateLoudestPlace);
}

init();
