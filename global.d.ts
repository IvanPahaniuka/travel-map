declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady(): void;
        Spotify: typeof SpotifySdk;
    }
}

export {};