import PlaybackSpotify from "./playback-spotify";
import PlaybackEncryptedFile from "./playback-encrypted-file";
import PlaybackFile from "./playback-file";
import { Event, EventListener } from "../common/utils";

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

export type PlaybackEvents = {
    'state_changed': [],
};
export type PlaybackEvent = Event<PlaybackEvents>;
export type PlaybackEventListener<TEvent extends PlaybackEvent = PlaybackEvent> = EventListener<PlaybackEvents, TEvent>;

export type Playback = {
    getState: () => PlaybackState;
    canPlay: (track: Track) => boolean;
    play: (track: Track, position: number) => Promise<void>;
    stop: () => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    getTrackDetails: (track: Track) => Promise<TrackDetails>;
    addEventListener: <Event extends PlaybackEvent>(event: Event, listener: PlaybackEventListener<Event>) => void;
    removeEventListener: <Event extends PlaybackEvent>(event: Event, listener: PlaybackEventListener<Event>) => void;
}

const Playbacks: Playback[] = [
    PlaybackSpotify,
    PlaybackEncryptedFile,
    PlaybackFile,
];

export default Playbacks;