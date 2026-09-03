import Encryption from "../encryption";
import SettingsStorage from "../settings/settings-storage";
import PlaybackFile from "./playback-file";
import { Playback, PlaybackEvent, PlaybackEventListener, PlaybackTrackState, Track } from "./playbacks";

type InternalState = {
    volume: number;
    currentTrackState: PlaybackTrackState | null;
}

const _state: InternalState = {
    volume: 1,
    currentTrackState: null,
};

const TRACK_PREFIX = 'encrypted:';

const stateChangedListeners: PlaybackEventListener[] = [];
let decryptedTrackUrl: string | null = null;
let playbackStateChangedListener: PlaybackEventListener | null = null;

async function decryptTrack(track: Track) {
    if (typeof track !== 'string') {
        throw new Error(`Unexpected track type: ${typeof track}`);
    }

    const response = await fetch(track.slice(TRACK_PREFIX.length));
    if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file. Status: ${response.status}`);
    }

    const encryptedData = new Uint8Array(await response.arrayBuffer());
    const settings = SettingsStorage.getSettings();
    const encryptionKey = settings.data[0].encryptionKey;

    const decryptedData = await Encryption.decrypt(encryptedData, encryptionKey);

    return new Blob([decryptedData], { type: response.headers.get('content-type') || 'audio/mpeg' });
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

function canPlay(track: Track) {
    if (typeof track !== 'string') {
        return false;
    }

    if (!track.startsWith(TRACK_PREFIX)) {
        return false;
    }

    return true;
}

async function play(track: Track, position: number = 0) {
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

async function setVolume(volume: number) {
    _state.volume = volume;
    await PlaybackFile.setVolume(volume);
    notifyListencer('state_changed');
}

async function getTrackDetails(track: Track) {
    const decryptedBlob = await decryptTrack(track);
    const trackUrl = URL.createObjectURL(decryptedBlob);

    try {
        return await PlaybackFile.getTrackDetails(trackUrl);
    } finally {
        URL.revokeObjectURL(trackUrl);
    }
}

function notifyListencer(event: PlaybackEvent) {
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

function addEventListener(event: PlaybackEvent, listener: PlaybackEventListener) {
    if (typeof listener !== 'function') {
        console.warn('Listener must be a function');
        return;
    }

    if (event === 'state_changed') {
        stateChangedListeners.push(listener);
    }
}

function removeEventListener(event: PlaybackEvent, listener: PlaybackEventListener) {
    if (event === 'state_changed') {
        const index = stateChangedListeners.indexOf(listener);
        if (index !== -1) {
            stateChangedListeners.splice(index, 1);
        }
    }
}


const PlaybackEncryptedFile: Playback = {
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