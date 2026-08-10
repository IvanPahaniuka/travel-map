import Popup from "./popup.js";
import Spotify from "../spotify/spotify.js";

let currentCenteredPlaceId = null;

function createMarkerIcon() {
	return L.divIcon({
		html: '<span class="marker-dot"></span>',
		className: 'travel-marker',
		iconSize: [24, 24],
		iconAnchor: [12, 24],
	});
}

function updateLoudestPlace(map, places) {
	const pauseTrackRadiusPixels = 500;
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

function init(map, places) {
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

		markers.push(marker);
	});

	if (markers.length > 0) {
		const bounds = L.latLngBounds(markers.map((marker) => marker.getLatLng()));
		map.fitBounds(bounds.pad(0.25));
	}

    Popup.init(map);

	updateLoudestPlace(map, places);

	map.on('move', updateLoudestPlace.bind(undefined, map, places));
	map.on('zoom', updateLoudestPlace.bind(undefined, map, places));
}

const Markers = {
    init,
}

export default Markers;