import Popup from "./popup.js";
import Player from "../player/player.js";
import Utils from "../utils.js";

let openedPlace = null;

function createMarkerIcon() {
	return L.divIcon({
		html: '<span class="marker-dot"></span>',
		className: 'travel-marker',
		iconSize: [24, 24],
		iconAnchor: [12, 24],
	});
}

async function updateCurrentPlaylist(map, places) {

	const pauseTrackRadiusPixels = 500;
	const playTrackRadiusPixels = 300;
	const switchTrackRadiusPixels = 100;
	
	const mapCenter = map.getCenter();
	const mapCenterPoint = map.latLngToContainerPoint(mapCenter);

	let centeredPlace = null;
	let centeredDistance = Number.POSITIVE_INFINITY;
	let lastCenteredDistance = Number.POSITIVE_INFINITY;

	if (openedPlace) {
		centeredPlace = openedPlace;
		centeredDistance = 0;
	}

	const playerState = Player.getState();
	const playerPlaylist = playerState.currentPlaylist;
	const playerPlaylistId = playerPlaylist?.id ?? null;

	places.forEach((place) => {
		const placePoint = map.latLngToContainerPoint(L.latLng(place.latitude, place.longitude));
		const pixelDistance = Math.hypot(placePoint.x - mapCenterPoint.x, placePoint.y - mapCenterPoint.y);

		if (place.id === playerPlaylistId) {
			lastCenteredDistance = pixelDistance;
		}

		if (pixelDistance < centeredDistance) {
			centeredDistance = pixelDistance;
			centeredPlace = place;
		}
	});

	const centeredTracks = Array.isArray(centeredPlace.tracks) ? centeredPlace.tracks : [];

	if (centeredPlace !== null && centeredTracks.length > 0 && centeredPlace.id !== playerPlaylistId) {
		const canChangePlaylist = centeredDistance <= (playerPlaylistId === null ? playTrackRadiusPixels : switchTrackRadiusPixels);
		if (canChangePlaylist) {
			await Player.changePlaylist(centeredPlace.id);
		}
	} else if (playerPlaylistId !== null && lastCenteredDistance > pauseTrackRadiusPixels) {
		await Player.stop();
	}
}

function initUpdateCurrentPlaylist(map, places) {
	const singleUpdateCurrentPlaylist = Utils.createSingleExecutor(
		'main-update-current-playlist',
		updateCurrentPlaylist.bind(null, map, places),
		true
	);

	Player.addEventListener('state_changed', onPlayerStateChanged);

	let isUpdateCurrentPlaylistActive = false;
	function onPlayerStateChanged() {
		const state = Player.getState();

		if (state.volume === 0 && isUpdateCurrentPlaylistActive) {
			isUpdateCurrentPlaylistActive = false;

			map.off('move', singleUpdateCurrentPlaylist);
			map.off('zoom', singleUpdateCurrentPlaylist);

			Player.stop();

			return;
		}
		
		if (state.volume > 0 && !isUpdateCurrentPlaylistActive) {
			isUpdateCurrentPlaylistActive = true;

			map.on('move', singleUpdateCurrentPlaylist);
			map.on('zoom', singleUpdateCurrentPlaylist);

			singleUpdateCurrentPlaylist();

			return;
		}
	}
}

async function initPlaylists(places) {
	const playerState = Player.getState();
	if (playerState.playlists.length > 0) {
		return;
	}

	for (const place of places) {
		await Player.addPlaylist(
			place.id, 
			Array.isArray(place.tracks) ? place.tracks : []
		);
	}
}

async function init(map, places) {
	await initPlaylists(places);

	const markers = [];

	places.forEach((place) => {
		const marker = L.marker([place.latitude, place.longitude], {
			icon: createMarkerIcon(),
		}).addTo(map);

		marker.bindPopup(Popup.buildContent(place), {
			className: 'travel-popup',
			minWidth: 250,
			maxWidth: 600,
			closeButton: false,
			offset: [0, -12],
		});

		marker.on('popupopen', () => { openedPlace = place; });
		marker.on('popupclose', () => { openedPlace = openedPlace === place ? null : openedPlace; });

		markers.push(marker);
	});

	if (markers.length > 0) {
		const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
		map.fitBounds(bounds.pad(0.25));
	}

    Popup.init(map);

	initUpdateCurrentPlaylist(map, places);
}

const Markers = {
    init,
}

export default Markers;