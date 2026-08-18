import Spotify from "../spotify/spotify.js";

/**
 * @typedef Track
 * @type {import("./playbacks.js").Track}
 */

/**
 * @typedef TrackDetails
 * @type {import("./playbacks.js").TrackDetails}
 */

/**
 * @typedef PlaybackEvent
 * @type {import("./playbacks.js").PlaybackEvent}
 */

/** 
 * @typedef Playback
 * @type {import("./playbacks.js").Playback}
 */

/**
 * @typedef TrackState
 * @type {object}
 * @property {Track} track
 * @property {number} position
 * @property {number} updatedAt
 */

/**
 * @typedef InternalState
 * @type {object}
 * @property {number} volume
 * @property {TrackState | null} currentTrackState
 */

/** @type {InternalState} */
const _state = {
    volume: 1,
    currentTrackState: null,
};

const stateChangedListeners = [];
let spotifyStateChangedListener = null;

/**
 * Extract track ID from Spotify URI or URL
 */
function extractTrackId(/** @type {Track} */ track) {
	const match = String(track || '').match(
		/(?:spotify:track:)?([A-Za-z0-9]+)(?:\?.*)?/
	);
	return match ? match[1] : null;
}

async function onSpotifyStateChanged(spotifyState) {
    const { 
        position, 
        paused
    } = spotifyState;

    const spotifyTrackDetails = spotifyState.track_window?.current_track;
    const spotifyTrackUris = [spotifyTrackDetails?.uri, spotifyTrackDetails?.linked_from?.uri]
        .filter(u => typeof u === 'string' && u.length > 0);

    const trackState = _state.currentTrackState;
    const track = trackState?.track;

    if (trackState && spotifyTrackUris.includes(track)) {
        if (paused === true && position === 0) {

            trackState.position = spotifyTrackDetails.duration_ms;
            trackState.updatedAt = Date.now();
            notifyListencer('state_changed');

        } else {

            trackState.position = position;
            trackState.updatedAt = Date.now();
            notifyListencer('state_changed');

        }

    }
}

function subscribeToSpotifyStateChanged() {
    if (spotifyStateChangedListener) {
        return;
    }

    Spotify.subscribeToPlayerState(onSpotifyStateChanged);
    spotifyStateChangedListener = onSpotifyStateChanged;
}

function getState() {
    return {
        volume: _state.volume,
        currentTrackState: _state.currentTrackState && { ..._state.currentTrackState },
    };
}

function canPlay(/** @type {Track} */ track) {
    if (typeof track !== 'string') {
        return false;
    }

    if (!track.startsWith('spotify:track:')) {
        return false;
    }

    return true;
}

async function play(/** @type {Track} */ track, position = 0) {
    subscribeToSpotifyStateChanged();

    _state.currentTrackState = {
        track,
        position,
        updatedAt: Date.now(),
    };

    await Spotify.play(track, position);

    notifyListencer('state_changed');
}

async function stop() {
    _state.currentTrackState = null;
    await Spotify.pause();
    notifyListencer('state_changed');
}

async function setVolume(volume) {
    _state.volume = volume;
    await Spotify.setVolume(volume);
    notifyListencer('state_changed');
}

async function getTrackDetails(/** @type {Track} */ track) {
    const spotifyTrack = await Spotify.getTrack(track);
    
    /** @type {TrackDetails} */
    const trackDetails = spotifyTrack && {
        name: spotifyTrack.name,
        artists: spotifyTrack.artists?.map(a => a.name) ?? [],
        duration: spotifyTrack.duration_ms,
    };

    return trackDetails;
}

function notifyListencer(/** @type {PlaybackEvent} */ event) {
	if (event === 'state_changed') {
		stateChangedListeners.forEach(listener => {
			try {
				listener();
			} catch (error) {
				console.error('Error notifying listener:', error);
			}
		});
	}
}

function addEventListener(/** @type {PlaybackEvent} */ event, listener) {
	if (typeof listener !== 'function') {
		console.warn('Listener must be a function');
		return;
	}

	if (event === 'state_changed') {
		stateChangedListeners.push(listener);
	}
}

function removeEventListener(/** @type {PlaybackEvent} */ event, listener) {
	if (event === 'state_changed') {
		const index = stateChangedListeners.indexOf(listener);
		if (index !== -1) {
			stateChangedListeners.splice(index, 1);
		}
	}
}


/** @type {Playback} */
const PlaybackSpotify = {
    getState,
    canPlay,
    play,
    stop,
    setVolume,
    getTrackDetails,
    addEventListener,
    removeEventListener,
};

export default PlaybackSpotify;