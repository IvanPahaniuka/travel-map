import Spotify from "../spotify";
import { Playback, PlaybackEvent, PlaybackEventListener, PlaybackState, PlaybackTrackState, Track, TrackDetails } from "./playbacks";

type InternalState = {
    volume: number;
    currentTrackState: PlaybackTrackState | null;
}

const _state: InternalState = {
    volume: 1,
    currentTrackState: null,
};

const stateChangedListeners: PlaybackEventListener[] = [];
let spotifyStateChangedListener: ((spotifyState: SpotifySdk.PlaybackState) => Promise<void>) | null = null;

async function onSpotifyStateChanged(spotifyState: SpotifySdk.PlaybackState) {
    const { 
        position, 
        paused,
        timestamp
    } = spotifyState;

    const spotifyTrackDetails = spotifyState.track_window?.current_track;
    const spotifyTrackUris = [spotifyTrackDetails?.uri, spotifyTrackDetails?.linked_from?.uri]
        .filter(u => typeof u === 'string' && u.length > 0);

    const trackState = _state.currentTrackState;
    const track = trackState?.track;

    if (trackState && typeof track === 'string' && spotifyTrackUris.includes(track)) {
        if (paused === true && position === 0) {

            trackState.position = Infinity;
            trackState.updatedAt = Date.now();
            notifyListencer('state_changed');

        } else if (timestamp && trackState.updatedAt < timestamp) {

            trackState.position = position;
            trackState.updatedAt = timestamp;
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

function getState(): PlaybackState {
    return {
        volume: _state.volume,
        currentTrackState: _state.currentTrackState && { ..._state.currentTrackState },
    };
}

function canPlay(track: Track) {
    if (typeof track !== 'string') {
        return false;
    }

    if (!track.startsWith('spotify:track:')) {
        return false;
    }

    return true;
}

async function play(track: Track, position: number = 0) {
    if (typeof track !== 'string') {
        throw new Error(`Unexpected track type: ${typeof track}`);
    }

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

async function setVolume(volume: number) {
    _state.volume = volume;
    await Spotify.setVolume(volume);
    notifyListencer('state_changed');
}

async function getTrackDetails(track: Track) {
    if (typeof track !== 'string') {
        throw new Error(`Unexpected track type: ${typeof track}`);
    }

    const spotifyTrack = await Spotify.getTrack(track);

    if (typeof spotifyTrack !== 'object' || spotifyTrack === null) {
        throw new Error(`Unexpected spotify track type: ${typeof spotifyTrack}`);
    }

    if (!('duration_ms' in spotifyTrack) || typeof spotifyTrack.duration_ms !== 'number') {
        throw new Error(`Expected duration_ms in the spotify track: ${spotifyTrack}`);
    }
    
    const trackDetails: TrackDetails = {
        name: 'name' in spotifyTrack && typeof spotifyTrack.name === 'string' 
            ? spotifyTrack.name 
            : undefined,
        
        artists: 'artists' in spotifyTrack && Array.isArray(spotifyTrack.artists)
            ? spotifyTrack.artists
                .filter((a: unknown) => typeof a === 'object' && a !== null && 'name' in a && typeof a.name === 'string')
                .map((a: { name: string }) => a.name)
            : undefined,

        duration: spotifyTrack.duration_ms,
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


const PlaybackSpotify: Playback = {
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