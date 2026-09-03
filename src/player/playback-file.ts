import * as musicMetadata from 'music-metadata';
import { PlaybackEvent, PlaybackEventListener, PlaybackTrackState, Track, TrackDetails } from './playbacks';

type InternalState = {
    volume: number;
    currentTrackState: PlaybackTrackState | null;
}

const _state: InternalState = {
    volume: 1,
    currentTrackState: null,
};

const stateChangedListeners: PlaybackEventListener[] = [];
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

function canPlay(track: Track) {
    const schemePrefixes = ['https:', 'http:', 'file:', 'blob:', 'data:'];

    if (typeof track !== 'string') {
        return false;
    }

    if (schemePrefixes.every(sp => !track.startsWith(sp))) {
        return false;
    }

    return true;
}

async function play(track: Track, position: number = 0) {
    if (typeof track !== 'string') {
        throw new Error(`Unexpected track type: ${typeof track}`);
    }

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

async function setVolume(volume: number) {
    _state.volume = volume;
    audio.volume = volume;
    notifyListencer('state_changed');
}

async function getTrackDetails(track: Track): Promise<TrackDetails> {
    if (typeof track !== 'string') {
        throw new Error(`Unexpected track type: ${typeof track}`);
    }

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

    const trackDetails: TrackDetails = {
        name,
        artists,
        duration,
    };

    return trackDetails;
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