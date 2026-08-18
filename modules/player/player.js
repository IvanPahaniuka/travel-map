import Utils from '../utils.js';
import Playbacks from './playbacks.js';

/** 
 * @typedef Playback
 * @type {import("./playbacks.js").Playback}
 */

/** 
 * @typedef PlaybackState
 * @type {import('./playbacks.js').PlaybackState} 
 */

/**
 * @typedef Track
 * @type {unknown}
 */

/**
 * @typedef TrackState
 * @type {object}
 * @property {number} index
 * @property {number} position
 * @property {number} duration
 * @property {string | undefined} name
 * @property {string[] | undefined} artists
 * @property {number} updatedAt  
 */

/**
 * @typedef InternalPlaylist
 * @type {object}
 * @property {string} id
 * @property {Track[]} tracks
 * @property {(Playback | null)[]} trackPlaybacks
 * @property {TrackState | null} currentTrackState
 */

/**
 * @typedef InternalState
 * @type {object}
 * @property {number} volume
 * @property {InternalPlaylist[]} playlists
 * @property {InternalPlaylist | null} currentPlaylist
 */

/**
 * @typedef PlayerEvent
 * @type {'state_changed'}
 */

/**
 * @typedef Playlist
 * @type {object}
 * @property {string} id
 * @property {Track[]} tracks
 * @property {TrackState | null} currentTrackState
 */

/**
 * @typedef PlayerState
 * @type {object}
 * @property {number} volume
 * @property {Playlist[]} playlists
 * @property {Playlist | null} currentPlaylist
 */

/** @type {InternalState} */
const _state = {
	volume: 0,
	playlists: [],
	currentPlaylist: null,
};

/**
 * Get the current state
 * @returns {PlayerState}
 */
function getState() {
	const playlistsMapped = _state.playlists.map(p => ({
		id: p.id,
		tracks: [...p.tracks],
		currentTrackState: p.currentTrackState && { ...p.currentTrackState },
	}));
	const currentPlaylistIndex = _state.playlists.indexOf(_state.currentPlaylist);
	const currentPlaylistMapped = currentPlaylistIndex >= 0
		? playlistsMapped[currentPlaylistIndex]
		: null;

	return {
		volume: _state.volume,
		playlists: playlistsMapped,
		currentPlaylist: currentPlaylistMapped,
	};
}


function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function getPossibleTrackIndexes(/** @type {InternalPlaylist} */ playlist) {
	
	const possibleTrackIndexes = playlist.tracks.map((_, i) => i).filter(
		(index) => 
			playlist.tracks[index]
			&& playlist.trackPlaybacks[index]
	);

	return possibleTrackIndexes;
}

async function onPlaybackStateChanged(/** @type {Playback} */ playback) {

	const playlist = _state.currentPlaylist;
	const trackState = playlist?.currentTrackState;

	if (!playlist || !trackState) {
		return;
	}

	const trackIndex = trackState.index;
	const track = playlist.tracks[trackIndex];
	const trackPlayback = playlist.trackPlaybacks[trackIndex];

	if (trackPlayback !== playback) {
		return;
	}

	/** @type {PlaybackState} */
	let playbackState;
	try {
		playbackState = playback.getState();
	} catch (error) {
		console.error(error);
		return;
	}

	if (track === playbackState.currentTrackState?.track) {
		
		const positionNew = playbackState.currentTrackState.position;

		if (typeof positionNew === 'number') {
			if (positionNew >= trackState.duration) {
				await next();
			} else {
				trackState.position = positionNew;
				trackState.updatedAt = Date.now();
				notifyListenersDeferred('state_changed');
			}
		}
	}
}

/** @type {[Playback, Function][]} */
const playbackStateChangedListeners = [];
function subscribeToPlaybackStateChanged(/** @type {Playback} */ playback) {
	const hasListener = playbackStateChangedListeners.some(ph => ph[0] === playback);
	if (hasListener) {
		return false;
	}

	const listener = Utils.createSingleExecutor('player-playback-state-changed', onPlaybackStateChanged.bind(null, playback));

	try {
		playback.addEventListener('state_changed', listener);
	} catch (error) {
		console.error(error);
		return false;
	}

	playbackStateChangedListeners.push([playback, listener]);

	return true;
}

/**
 * Add a new playlist with tracks
 */
async function addPlaylist(/** @type {string} */ id, /** @type {Track[]} */ tracks) {
	if (!id || !Array.isArray(tracks)) {
		console.warn('Invalid playlist data: id and tracks array required');
		return;
	}

	// Check if playlist already exists
	const existingStation = _state.playlists.find(s => s.id === id);
	if (existingStation) {
		console.warn(`Station with id "${id}" already exists`);
		return;
	}

	const trackPlaybacks = tracks.map(track => {
		for (const playback of Playbacks) {
			let canPlay = false;
			try {
				canPlay = playback.canPlay(track)
			} catch (error) {
				console.error(error);
			}
			
			if (canPlay) {
				subscribeToPlaybackStateChanged(playback);
				return playback;
			}
		}

		return null;
	});

	/** @type {InternalPlaylist} */
	const playlist = {
		id,
		tracks,
		trackPlaybacks,
		currentTrackState: null,
	};

	_state.playlists.push(playlist);

	notifyListenersDeferred('state_changed');
}

/**
 * Remove a playlist
 */
async function removePlaylist(/** @type {string} */ id) {
	if (_state.currentPlaylist?.id === id) {
		await stop();
	}

	const index = _state.playlists.findIndex(s => s.id === id);
	if (index === -1) {
		console.warn(`Station with id "${id}" not found`);
		return;
	}

	_state.playlists.splice(index, 1);

	notifyListenersDeferred('state_changed');
}

/**
 * Switch to a different playlist and start playing
 */
async function changePlaylist(/** @type {string} */ id) {

	const tryPlayCurrentTrack = async (/** @type {InternalPlaylist} */ playlist) => {

		const trackState = playlist.currentTrackState;

		if (!trackState) {
			return false;
		}
		
		const trackIndex = trackState.index;
		const track = playlist.tracks[trackIndex];
		const trackPlayback = playlist.trackPlaybacks[trackIndex];

		const trackDuration = trackState.duration;
		const trackPositionNew = trackState.position + Date.now() - trackState.updatedAt;

		if (trackPositionNew >= trackDuration) {
			return false;
		}

		trackState.position = trackPositionNew;
		trackState.updatedAt = Date.now();

		_state.currentPlaylist = playlist;

		try {
			await trackPlayback.setVolume(_state.volume);
			await trackPlayback.play(track, trackPositionNew);
		} catch (error) {
			console.error(error);
		}

		return true;
	};

	const tryPlayNextTrack = async (/** @type {InternalPlaylist} */ playlist) => {

		const trackState = playlist.currentTrackState;

		const possibleTrackIndexes = getPossibleTrackIndexes(playlist);

		if (possibleTrackIndexes.length === 0) {
			return false;
		}
		
		const trackIndexOld = trackState?.index ?? -1;

		if (possibleTrackIndexes.length >= 2) {
			const index = possibleTrackIndexes.indexOf(trackIndexOld);
			if (index >= 0) {
				possibleTrackIndexes.splice(index, 1);
			}
		}
		
		const trackIndex = possibleTrackIndexes[getRandomInt(0, possibleTrackIndexes.length)];

		const track = playlist.tracks[trackIndex];
		const trackPlayback = playlist.trackPlaybacks[trackIndex];

		let trackDetails;
		try {
			trackDetails = await trackPlayback.getTrackDetails(track);
		} catch (error) {
			console.error(error);
			return false;
		}
		const trackDuration = trackDetails.duration;

		const trackPositionOld = trackState?.position;
		const trackUpdatedAtOld = trackState?.updatedAt;
		const trackDurationOld = trackState?.duration;
		
		const trackPosition = [trackPositionOld, trackUpdatedAtOld, trackDurationOld].every(v => typeof v === 'number')
			? ((trackPositionOld + Date.now() - trackUpdatedAtOld) % trackDurationOld % trackDuration)
			: getRandomInt(0, trackDuration);

		playlist.currentTrackState = {
			index: trackIndex,
			position: trackPosition,
			duration: trackDuration,
			name: trackDetails.name,
			artists: trackDetails.artists,
			updatedAt: Date.now(),
		};

		_state.currentPlaylist = playlist;

		try {
			await trackPlayback.setVolume(_state.volume);
			await trackPlayback.play(track, trackPosition);
		} catch (error) {
			console.error(error);
		}

		return true;
	};

	await stop();

	if (id) {

		const playlist = _state.playlists.find(s => s.id === id);
		if (!playlist) {
			console.warn(`Station with id "${id}" not found`);
			return;
		}

		const playCurrentTrackResult = await tryPlayCurrentTrack(playlist);

		// Start playing the playlist
		if (playCurrentTrackResult !== true) {
			await tryPlayNextTrack(playlist);
		}

	}

	notifyListenersDeferred('state_changed');
}

/**
 * Set volume for the player
 */
async function setVolume(/** @type {number} */ volume) {
	_state.volume = volume;

	const currentPlaylist = _state.currentPlaylist;
	const currentTrackState = currentPlaylist?.currentTrackState;
	
	if (currentPlaylist && currentTrackState) {
		const trackIndex = currentTrackState.index;
		const playback = currentPlaylist.trackPlaybacks[trackIndex];

		try {
			await playback.setVolume(volume);
		} catch (error) {
			console.error(error);
		}
	}

	notifyListenersDeferred('state_changed');
}

/**
 * Play the next track in the current playlist
 */
async function next() {
	const playlist = _state.currentPlaylist;
	if (!playlist) {
		console.warn('No playlist currently playing');
		return false;
	}

	const possibleTrackIndexes = getPossibleTrackIndexes(playlist);

	const trackState = playlist.currentTrackState;
	const trackIndexOld = trackState?.index ?? -1;

	if (possibleTrackIndexes.length >= 2) {
		const index = possibleTrackIndexes.indexOf(trackIndexOld);
		if (index >= 0) {
			possibleTrackIndexes.splice(index, 1);
		}
	}

	const trackIndex = possibleTrackIndexes[getRandomInt(0, possibleTrackIndexes.length)];

	const track = playlist.tracks[trackIndex];
	const trackPlayback = playlist.trackPlaybacks[trackIndex];

	let trackDetails;
	try {
		trackDetails = await trackPlayback.getTrackDetails(track);
	} catch (error) {
		console.error(error);
		return false;
	}

	playlist.currentTrackState = {
		index: trackIndex,
		position: 0,
		duration: trackDetails.duration,
		name: trackDetails.name,
		artists: trackDetails.artists,
		updatedAt: Date.now(),
	};

	try {
		await trackPlayback.setVolume(_state.volume);
		await trackPlayback.play(track, 0);
	} catch (error) {
		console.error(error);
	}

	notifyListenersDeferred('state_changed');

	return true;
}

/**
 * Stops the player and saves current track state
 */
async function stop() {
	const trackPlaylist = _state.currentPlaylist;
	const currentTrackState = trackPlaylist?.currentTrackState;
	if (!trackPlaylist || !currentTrackState) {
		return;
	}

	const trackIndex = currentTrackState.index;
	const trackPlayback = trackPlaylist.trackPlaybacks[trackIndex];

	_state.currentPlaylist = null;

	try {
		await trackPlayback.stop();
	} catch (error) {
		console.error(error);
	}

	notifyListenersDeferred('state_changed');
}

let stateChangedListeners = [];
let stateChangedListenersNotifying = null;
/**
 * Notify all listeners of state changes
 */
function notifyListeners(/** @type {PlayerEvent} */ event) {
	if (event === 'state_changed') {
		stateChangedListenersNotifying = stateChangedListeners;
		stateChangedListenersNotifying.forEach(listener => {
			try {
				listener();
			} catch (error) {
				console.error('Error notifying listener:', error);
			}
		});
		stateChangedListenersNotifying = null;
	}
}

let stateChangedTimeoutId;
function notifyListenersDeferred(/** @type {PlayerEvent} */ event) {
	const timeoutId = setTimeout(notifyListeners, 0, event);

	if (event === 'state_changed') {
		clearTimeout(stateChangedTimeoutId);
		stateChangedTimeoutId = timeoutId;
	}
}

/**
 * Add an event listener for state changes
 */
function addEventListener(/** @type {PlayerEvent} */ event, /** @type {() => void} */ listener) {
	if (typeof listener !== 'function') {
		console.warn('Listener must be a function');
		return;
	}

	if (event === 'state_changed') {
		if (stateChangedListenersNotifying === stateChangedListeners) {
			stateChangedListeners = [...stateChangedListeners];
		} 

		stateChangedListeners.push(listener);
	}
}

/**
 * Remove an event listener
 */
function removeEventListener(/** @type {PlayerEvent} */ event, /** @type {() => void} */ listener) {
	if (event === 'state_changed') {
		const index = stateChangedListeners.indexOf(listener);
		if (index !== -1) {
			if (stateChangedListenersNotifying === stateChangedListeners) {
				stateChangedListeners = [...stateChangedListeners];
			} 

			stateChangedListeners.splice(index, 1);
		}
	}
}

const Player = {
	getState,
	
	addPlaylist: Utils.createSingleExecutor('player', addPlaylist),
	removePlaylist: Utils.createSingleExecutor('player', removePlaylist),
	changePlaylist: Utils.createSingleExecutor('player', changePlaylist),

	setVolume: Utils.createSingleExecutor('player', setVolume),

	next: Utils.createSingleExecutor('player', next),
	stop: Utils.createSingleExecutor('player', stop),

	addEventListener,
	removeEventListener,
};

export default Player;