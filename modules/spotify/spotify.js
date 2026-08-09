import SpotifyAuth from './spotify-auth.js';

const TRACK_BY_PLACE = {
  'athens-september-2023': 'spotify:track:2TpxZ7JUBn3uw46aR7qd6V',
  'batumi-july-2026': 'spotify:track:7GhIk7Il098yCjg4BQjzvb',
};

let player = null;
let deviceId = null;

async function connectSpotifyPlayer() {
  if (player) {
    return;
  }

  if (!window.Spotify?.Player) {
    await (window.spotifyPlaybackSDKReadyPromise || Promise.resolve());
  }

  if (!window.Spotify?.Player) {
    throw new Error('Spotify Web Playback SDK is not available.');
  }

  let accessToken = await SpotifyAuth.getAccessToken(true);
  if (!accessToken) {
    throw new Error('Spotify access token is missing.');
  }

  return new Promise((resolve, reject) => {
    if (player) {
      resolve(player);
      return;
    }

    player = new window.Spotify.Player({
      name: 'TravelMap Spotify Player',
      getOAuthToken: (cb) => cb(accessToken),
      volume: 1,
    });

    player.addListener('initialization_error', ({ message }) => console.error('Spotify initialization error:', message));
    player.addListener('account_error', ({ message }) => console.error('Spotify account error:', message));
    player.addListener('playback_error', ({ message }) => console.error('Spotify playback error:', message));

    player.addListener('authentication_error', ({ message }) => {
      console.error('Spotify authentication error:', message);
      SpotifyAuth.getAccessToken(true).then((token) => accessToken = token);
    });

    player.addListener('ready', ({ device_id }) => {
      deviceId = device_id;
      resolve(player);
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.warn('Spotify device went offline:', device_id);
    });

    player.connect().catch(reject);
  });
}

async function setVolume(volume) {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.setVolume === 'function') {
      await player.setVolume(volume);
      return;
    }
  } catch (error) {
    console.error('Spotify volume request failed:', error);
  }
}

async function playTrackForPlace(placeId) {
  const trackUri = TRACK_BY_PLACE[placeId];
  if (!trackUri) {
    console.info(`No Spotify track configured for place ${placeId}.`);
    return;
  }

  const accessToken = await SpotifyAuth.getAccessToken(true);
  if (!accessToken) {
    console.warn('Spotify access token is missing, cannot play track.');
    return;
  }

  try {
    await connectSpotifyPlayer();

    if (!deviceId) {
      console.warn('Spotify device ID not available yet.');
      return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [trackUri] }),
    });

    console.info(`Playing Spotify track for ${placeId}`);
  } catch (error) {
    console.error('Spotify playback request failed:', error);
  }
}

async function init() {
  const authenticated = await SpotifyAuth.init();
  if (!authenticated) {
    return;
  }

  try {
    await connectSpotifyPlayer();
  } catch (error) {
    console.error('Unable to initialize Spotify playback:', error);
  }
}

const Spotify = {
  init,
  playTrackForPlace,
};

export default Spotify;
