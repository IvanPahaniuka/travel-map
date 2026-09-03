import PlaybackSpotify from "./playback-spotify";
import PlaybackEncryptedFile from "./playback-encrypted-file";
import PlaybackFile from "./playback-file";

export type Track = unknown;

export type TrackDetails = {
    name: string | undefined;
    artists: string[] | undefined;
    duration: number;
}

export type PlaybackTrackState = {
    track: Track;
    position: number;
    updatedAt: number;
}

export type PlaybackState = {
    volume: number;
    currentTrackState: PlaybackTrackState | null;
}

export type PlaybackEvent = 'state_changed';
export type PlaybackEventListener = () => void;

export type Playback = {
    getState: () => PlaybackState;
    canPlay: (track: Track) => boolean;
    play: (track: Track, position: number) => Promise<void>;
    stop: () => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    getTrackDetails: (track: Track) => Promise<TrackDetails>;
    addEventListener: (event: PlaybackEvent, listener: PlaybackEventListener) => void;
    removeEventListener: (event: PlaybackEvent, listener: PlaybackEventListener) => void;
}

const Playbacks: Playback[] = [
    PlaybackSpotify,
    PlaybackEncryptedFile,
    PlaybackFile,
];

export default Playbacks;