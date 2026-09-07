import * as musicMetadata from 'music-metadata';
import { Playback, PlaybackEvent, PlaybackEventListener, PlaybackEvents, PlaybackTrackState, Track, TrackDetails } from './playbacks';
import Utils from '../common/utils';

type InternalState = {
    volume: number;
    currentTrackState: PlaybackTrackState | null;
}

const _state: InternalState = {
    volume: 1,
    currentTrackState: null,
};

const audio = new Audio();

audio.addEventListener('timeupdate', () => {
    if (_state.currentTrackState) {
        _state.currentTrackState.position = audio.currentTime * 1000;
        _state.currentTrackState.updatedAt = Date.now();
        notifyEventListeners('state_changed');
    }
});

audio.addEventListener('ended', () => {
    if (_state.currentTrackState) {
        _state.currentTrackState.position = Infinity;
        _state.currentTrackState.updatedAt = Date.now();
        notifyEventListeners('state_changed');
    }
});

function getState() {
    return {
        volume: _state.volume,
        currentTrackState: _state.currentTrackState && { ..._state.currentTrackState },
    };
}

async function canPlay(track: Track) {
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
    notifyEventListeners('state_changed');
}

async function stop() {
    audio.pause();
    _state.currentTrackState = null;
    notifyEventListeners('state_changed');
}

async function setVolume(volume: number) {
    _state.volume = volume;
    audio.volume = volume;
    notifyEventListeners('state_changed');
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


const playbackEventBus = Utils.createEventBus<PlaybackEvents>();
const notifyEventListeners = playbackEventBus.notifyEventListeners;
const addEventListener = playbackEventBus.addEventListener;
const removeEventListener = playbackEventBus.removeEventListener;

const PlaybackFile: Playback = {
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