import PlaybackSpotify from "./playback-spotify.js";

/**
 * @typedef Track
 * @type {import("./player.js").Track}
 */

/**
 * @typedef TrackDetails
 * @type {object}
 * @property {string | undefined} name
 * @property {string[] | undefined} artists
 * @property {number} duration
 */

/**
 * @typedef PlaybackTrackState
 * @type {object}
 * @property {Track} track
 * @property {number} position
 * @property {number} updatedAt
 */

/**
 * @typedef PlaybackState
 * @type {object}
 * @property {number} volume
 * @property {PlaybackTrackState | null} currentTrackState
 */

/**
 * @typedef PlaybackEvent
 * @type {'state_changed'}
 */

/**
 * @typedef Playback
 * @type {object}
 * @property {() => PlaybackState} getState
 * @property {(track: Track) => boolean} canPlay
 * @property {(track: Track, position: number) => Promise} play
 * @property {() => Promise} stop
 * @property {(volume: number) => Promise} setVolume
 * @property {(track: Track) => Promise<TrackDetails>} getTrackDetails
 * @property {(event: PlaybackEvent, handler: Function) => void} addEventListener
 * @property {(event: PlaybackEvent, handler: Function) => void} removeEventListener
 */

/** @type {Playback[]} */
const Playbacks = [
    PlaybackSpotify,
];

export default Playbacks;