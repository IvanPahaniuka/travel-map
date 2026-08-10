import Popup from "./popup.js";
import Spotify from "../spotify/spotify.js";

let currentTrackPlaceId = null;

const trackStateByPlaceId = {}

function createMarkerIcon() {
	return L.divIcon({
		html: '<span class="marker-dot"></span>',
		className: 'travel-marker',
		iconSize: [24, 24],
		iconAnchor: [12, 24],
	});
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

async function updateLoudestPlace(map, places) {

    const stopCurrentTrack = async () => {
        if (currentTrackPlaceId === null) return;

        const trackState = trackStateByPlaceId[currentTrackPlaceId];
        if (trackState) {
            const position = await Spotify.getPosition();
            trackState.position = position;
            trackState.updatedAt = Date.now();
        }

		await Spotify.pause();
		currentTrackPlaceId = null;
    }

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

		if (place.id === currentTrackPlaceId) {
			lastCenteredDistance = pixelDistance;
		}

		if (pixelDistance < centeredDistance) {
			centeredDistance = pixelDistance;
			centeredPlace = place;
		}
	});

    const centeredTracksUri = Array.isArray(centeredPlace.tracks) ? centeredPlace.tracks : [];

	if (currentTrackPlaceId !== null && lastCenteredDistance > pauseTrackRadiusPixels) {
        await stopCurrentTrack();
	} else if (centeredPlace !== null && centeredTracksUri.length > 0 && centeredPlace.id !== currentTrackPlaceId) {
		const playTrack = centeredDistance <= (currentTrackPlaceId === null ? playTrackRadiusPixels : switchTrackRadiusPixels);
		if (playTrack) {
            await stopCurrentTrack();

			currentTrackPlaceId = centeredPlace.id;

            const trackState = trackStateByPlaceId[currentTrackPlaceId];
            if (trackState && (trackState.position + Date.now() - trackState.updatedAt) < trackState.duration) {
                const trackUri = trackState.uri;
                const newPosition = trackState.position + Date.now() - trackState.updatedAt;

                await Spotify.play(trackUri, newPosition);

                trackState.position = newPosition;
                trackState.updatedAt = Date.now();
            } else {
                const trackUri = centeredTracksUri[getRandomInt(0, centeredTracksUri.length)];
                const duration = await Spotify.getDuration(trackUri);
                const oldPosition = trackState?.position;
                const newPosition = typeof oldPosition === "number" 
                    ? (oldPosition % duration)
                    : getRandomInt(0, duration);

                await Spotify.play(trackUri, newPosition);

                trackStateByPlaceId[currentTrackPlaceId] = {
                    uri: trackUri,
                    duration,
                    position: newPosition,
                    updatedAt: Date.now(),
                };
            }
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