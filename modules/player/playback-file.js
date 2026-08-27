import * as musicMetadata from 'https://cdn.jsdelivr.net/npm/music-metadata@11.15.0/+esm';

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
 * @typedef PlaybackTrackState
 * @type {import("./playbacks.js").PlaybackTrackState}
 */

/**
 * @typedef InternalState
 * @type {object}
 * @property {number} volume
 * @property {PlaybackTrackState | null} currentTrackState
 */

/** @type {InternalState} */
const _state = {
    volume: 1,
    currentTrackState: null,
};

const stateChangedListeners = [];
const audio = new Audio();

audio.addEventListener('timeupdate', () => {
    if (_state.currentTrackState) {
        _state.currentTrackState.position = audio.currentTime * 1000;
        _state.currentTrackState.updatedAt = Date.now();
        notifyListencer('state_changed');
    }
});

audio.addEventListener('ended', () => {
    if (_state.currentTrackState) {
        _state.currentTrackState.position = Infinity;
        _state.currentTrackState.updatedAt = Date.now();
        notifyListencer('state_changed');
    }
});

function getState() {
    return {
        volume: _state.volume,
        currentTrackState: _state.currentTrackState && { ..._state.currentTrackState },
    };
}

function canPlay(/** @type {Track} */ track) {
    const schemePrefixes = ['https:', 'http:', 'file:', 'blob:', 'data:'];

    if (typeof track !== 'string') {
        return false;
    }

    if (schemePrefixes.every(sp => !track.startsWith(sp))) {
        return false;
    }

    return true;
}

async function play(/** @type {Track} */ track, /** @type {number} */ position = 0) {
    if (audio.src !== track) {
        audio.src = track;
    }

    audio.currentTime = position / 1000;
    _state.currentTrackState = {
        track,
        position,
        updatedAt: Date.now(),
    };

    await audio.play();
    notifyListencer('state_changed');
}

async function stop() {
    audio.pause();
    _state.currentTrackState = null;
    notifyListencer('state_changed');
}

async function setVolume(/** @type {number} */ volume) {
    _state.volume = volume;
    audio.volume = volume;
    notifyListencer('state_changed');
}

async function getTrackDetails(/** @type {Track} */ track) {
    const response = await fetch(track);
    if (!response.ok) throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    const trackBlob = await response.blob();
    const trackMetadata = await musicMetadata.parseBlob(trackBlob);

    const name = trackMetadata?.common?.title;

    const artistsMetadata = trackMetadata?.common?.artists;
    const artistMetadata = trackMetadata?.common?.artist;
    const artists = Array.isArray(artistsMetadata)
        ? artistsMetadata.filter(a => typeof a === 'string')
        : typeof artistMetadata === 'string'
        ? [artistMetadata]
        : undefined;

    const duration = (trackMetadata?.format?.duration ?? 0) * 1000;

    /** @type {TrackDetails} */
    const trackDetails = {
        name,
        artists,
        duration,
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
const PlaybackFile = {
    getState,
    canPlay,
    play,
    stop,
    setVolume,
    getTrackDetails,
    addEventListener,
    removeEventListener,
};

export default PlaybackFile;