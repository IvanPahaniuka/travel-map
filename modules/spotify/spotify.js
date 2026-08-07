import SpotifyAuth from './spotify-auth.js';

const TRACK_BY_PLACE = {
  'athens-september-2023': 'spotify:track:2TpxZ7JUBn3uw46aR7qd6V',
  'batumi-july-2026': 'spotify:track:7GhIk7Il098yCjg4BQjzvb',
};

let accessToken = '';
let player = null;
let deviceId = null;
let playerReady = false;

function syncAccessToken() {
  accessToken = SpotifyAuth.getAccessToken();
  return accessToken;
}

async function connectSpotifyPlayer() {
  if (playerReady && player && deviceId) {
    return;
  }

  if (!accessToken) {
    throw new Error('Spotify access token is missing.');
  }

  if (!window.Spotify?.Player) {
    await (window.spotifyPlaybackSDKReadyPromise || Promise.resolve());
  }

  if (!window.Spotify?.Player) {
    throw new Error('Spotify Web Playback SDK is not available.');
  }

  return new Promise((resolve, reject) => {
    if (player) {
      resolve(player);
      return;
    }

    player = new window.Spotify.Player({
      name: 'TravelMap Spotify Player',
      getOAuthToken: (cb) => cb(accessToken),
    });

    player.addListener('initialization_error', ({ message }) => console.error('Spotify initialization error:', message));
    player.addListener('authentication_error', ({ message }) => console.error('Spotify authentication error:', message));
    player.addListener('account_error', ({ message }) => console.error('Spotify account error:', message));
    player.addListener('playback_error', ({ message }) => console.error('Spotify playback error:', message));

    player.addListener('ready', ({ device_id }) => {
      deviceId = device_id;
      playerReady = true;
      resolve(player);
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.warn('Spotify device went offline:', device_id);
    });

    player.connect().catch(reject);
  });
}

async function setVolume(volume) {
  accessToken = syncAccessToken();

  if (!accessToken) {
    console.warn('Spotify access token is missing, cannot set volume.');
    SpotifyAuth.openLoginDialog();
    return;
  }

  try {
    await connectSpotifyPlayer();

    if (player && typeof player.setVolume === 'function') {
      await player.setVolume(volume);
      return;
    }

    if (deviceId) {
      const volumePercent = Math.round(volume * 100);
      await fetch(`https://api.spotify.com/v1/me/player/volume?device_id=${encodeURIComponent(deviceId)}&volume_percent=${volumePercent}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Spotify volume request failed:', error);
  }
}

async function playTrackForPlace(placeId, volume = 1) {
  const trackUri = TRACK_BY_PLACE[placeId];
  if (!trackUri) {
    console.info(`No Spotify track configured for place ${placeId}.`);
    return;
  }

  accessToken = syncAccessToken();
  if (!accessToken) {
    console.warn('Spotify access token is missing, cannot play track.');
    SpotifyAuth.openLoginDialog();
    return;
  }

  try {
    await connectSpotifyPlayer();
    await setVolume(volume);

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

    console.info(`Playing Spotify track for ${placeId} at volume ${volume.toFixed(2)}`);
  } catch (error) {
    console.error('Spotify playback request failed:', error);
  }
}

async function initSpotify() {
  const authenticated = await SpotifyAuth.init();
  if (!authenticated) {
    return;
  }

  accessToken = syncAccessToken();

  try {
    await connectSpotifyPlayer();
  } catch (error) {
    console.error('Unable to initialize Spotify playback:', error);
    SpotifyAuth.openLoginDialog();
  }
}

const Spotify = {
  init: initSpotify,
  playTrackForPlace,
  setVolume,
};

export default Spotify;
