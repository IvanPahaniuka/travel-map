import Encryption from "../encryption.js";
import SettingsStorage from "../settings/settings-storage.js";
import PlaybackFile from "./playback-file.js";

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

const TRACK_PREFIX = 'encrypted:';

const stateChangedListeners = [];
let decryptedTrackUrl = null;
let playbackStateChangedListener = null;

async function decryptTrack(/** @type {Track} */ track) {
    const response = await fetch(track.slice(TRACK_PREFIX.length));
    if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file. Status: ${response.status}`);
    }

    const encryptedData = new Uint8Array(await response.arrayBuffer());
    const encryptionKey = SettingsStorage.getEncryptionKey();

    const decryptedData = await Encryption.decrypt(encryptedData, encryptionKey);

    return new Blob([decryptedData], { type: response.headers.get('content-type') || 'audio/mpeg' });
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

function subscribeToPlaybackStateChanged() {
    if (playbackStateChangedListener) {
        return;
    }

    playbackStateChangedListener = () => {
        const playbackTrackState = PlaybackFile.getState().currentTrackState;
        if (_state.currentTrackState && playbackTrackState) {
            _state.currentTrackState.position = playbackTrackState.position;
            _state.currentTrackState.updatedAt = playbackTrackState.updatedAt;
        }

        notifyListencer('state_changed');
    };
    PlaybackFile.addEventListener('state_changed', playbackStateChangedListener);
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

    if (!track.startsWith(TRACK_PREFIX)) {
        return false;
    }

    return true;
}

async function play(/** @type {Track} */ track, /** @type {number} */ position = 0) {
    const decryptedBlob = await decryptTrack(track);

    if (decryptedTrackUrl) {
        URL.revokeObjectURL(decryptedTrackUrl);
    }

    decryptedTrackUrl = URL.createObjectURL(decryptedBlob);
    subscribeToPlaybackStateChanged();
    await PlaybackFile.play(decryptedTrackUrl, position);
    _state.currentTrackState = {
        track,
        position,
        updatedAt: Date.now(),
    };
    notifyListencer('state_changed');
}

async function stop() {
    await PlaybackFile.stop();
    _state.currentTrackState = null;
    notifyListencer('state_changed');
}

async function setVolume(/** @type {number} */ volume) {
    _state.volume = volume;
    await PlaybackFile.setVolume(volume);
    notifyListencer('state_changed');
}

async function getTrackDetails(/** @type {Track} */ track) {
    const decryptedBlob = await decryptTrack(track);
    const trackUrl = URL.createObjectURL(decryptedBlob);

    try {
        return await PlaybackFile.getTrackDetails(trackUrl);
    } finally {
        URL.revokeObjectURL(trackUrl);
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
const PlaybackEncryptedFile = {
    getState,
    canPlay,
    play,
    stop,
    setVolume,
    getTrackDetails,
    addEventListener,
    removeEventListener,
};

export default PlaybackEncryptedFile;