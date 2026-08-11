import SpotifyAuth from './spotify-auth.js';

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
    }
  } catch (error) {
    console.error('Spotify volume request failed:', error);
  }
}

async function getVolume() {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.getVolume === 'function') {
      return await player.getVolume();
    }
  } catch (error) {
    console.error('Spotify volume request failed:', error);
  }
}

async function pause() {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.pause === 'function') {
      await player.pause();
    }
  } catch (error) {
    console.error('Spotify pause request failed:', error);
  }
}

async function resume() {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.resume === 'function') {
      await player.resume();
    }
  } catch (error) {
    console.error('Spotify resume request failed:', error);
  }
}

async function next() {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.nextTrack === 'function') {
      await player.nextTrack();
      return;
    }

    console.warn('Spotify next track is not available on this player instance.');
  } catch (error) {
    console.error('Spotify next track request failed:', error);
  }
}

async function seek(positionMs) {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.seek === 'function') {
      await player.seek(positionMs);
    }
  } catch (error) {
    console.error('Spotify seek request failed:', error);
  }
}

async function getPosition() {
  const currentState = await getCurrentState();
  return currentState?.position;
}

async function getDuration(trackUri = undefined) {
  if (trackUri === undefined) {
    const currentState = await getCurrentState();
    return currentState?.duration;
  } else {
    const track = await getTrack(trackUri);
    return track?.duration_ms;
  }
}

async function getTrackName() {
  const currentState = await getCurrentState();
  return currentState?.track_window?.current_track?.name;
}

async function getCurrentState() {
  try {
    await connectSpotifyPlayer();

    if (player && typeof player.getCurrentState === 'function') {
      return await player.getCurrentState();
    }
  } catch (error) {
    console.error('Spotify getCurrentState request failed:', error);
  }
}

function subscribeToPlayerState(callback) {
  if (!callback || typeof callback !== 'function') {
    return;
  }

  connectSpotifyPlayer().then(() => {
    if (player && typeof player.addListener === 'function') {
      player.addListener('player_state_changed', callback);
    }
  }).catch((error) => {
    console.error('Spotify subscribe to player state failed:', error);
  });
}

async function getTrack(trackUri) {
  const accessToken = await SpotifyAuth.getAccessToken(true);
  if (!accessToken) {
    console.warn('Spotify access token is missing, cannot fetch track.');
    return undefined;
  }

  const trackIdMatch = String(trackUri || '').match(
    /(?:spotify:track:|https?:\/\/open\.spotify\.com\/track\/)?([A-Za-z0-9]+)(?:\?.*)?/
  );
  const trackId = trackIdMatch ? trackIdMatch[1] : null;

  if (!trackId) {
    console.warn('Invalid Spotify track URI:', trackUri);
    return undefined;
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Spotify track request failed (${response.status}): ${errorText}`);
      return undefined;
    }

    return await response.json();
  } catch (error) {
    console.error('Spotify getTrack request failed:', error);
    return undefined;
  }
}

async function play(trackUri, position = 0) {
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
      body: JSON.stringify({ uris: [trackUri], position_ms: position }),
    });

    console.info(`Playing Spotify track: ${trackUri}`);
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
  play,
  pause,
  resume,
  next,
  seek,
  setVolume,
  getVolume,
  getPosition,
  getDuration,
  getTrackName,
  getCurrentState,
  subscribeToPlayerState,
};

export default Spotify;
