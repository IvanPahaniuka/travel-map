import Dialog from '../dialog/dialog.js';
import Translations from '../translations/translations.js';

const SPOTIFY_CLIENT_ID = '53f4f99e88604240ba44e392508ac865';
const REDIRECT_URI = window.location.origin && window.location.origin !== 'null'
  ? `${window.location.origin}${window.location.pathname}`
  : `${window.location.href}`;
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
];
const AUTHORIZATION_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

const TRACK_BY_PLACE = {
  'athens-september-2023': 'spotify:track:2TpxZ7JUBn3uw46aR7qd6V',
  'batumi-july-2026': 'spotify:track:7GhIk7Il098yCjg4BQjzvb',
};

let accessToken = '';
let player = null;
let deviceId = null;
let playerReady = false;
let loginDialogElement = null;

function getSpotifyToken() {
  return localStorage.getItem('spotify_access_token') || '';
}

function saveSpotifyToken(token) {
  localStorage.setItem('spotify_access_token', token);
  accessToken = token;
}

function getAuthCodeVerifier() {
  return localStorage.getItem('spotify_auth_code_verifier') || '';
}

function saveAuthCodeVerifier(codeVerifier) {
  localStorage.setItem('spotify_auth_code_verifier', codeVerifier);
}

function getAuthState() {
  return localStorage.getItem('spotify_auth_state') || '';
}

function saveAuthState(state) {
  localStorage.setItem('spotify_auth_state', state);
}

function clearAuth() {
  localStorage.removeItem('spotify_auth_code_verifier');
  localStorage.removeItem('spotify_auth_state');
}

function clearSpotifyQuery() {
  const cleanUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}


function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function startSpotifyAuthorization() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
    console.warn('Spotify Client ID is not configured. Replace YOUR_SPOTIFY_CLIENT_ID in spotify.js.');
  }

  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  saveAuthState(state);
  saveAuthCodeVerifier(codeVerifier);

  const authUrl = new URL(AUTHORIZATION_ENDPOINT);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);

  window.location.assign(authUrl.toString());
}

function createLoginDialog() {
  if (loginDialogElement) return loginDialogElement;

  loginDialogElement = Dialog.create({
    titleClassName: 'spotify-dialog-title',
    title: Translations.get('spotify-dialog-title'),

    messageClassName: 'spotify-dialog-message',
    message: Translations.get('spotify-dialog-message'),

    buttonClassName: 'spotify-dialog-button',
    buttonLabelClassName: 'spotify-dialog-button-label',
    buttonLabel: Translations.get('spotify-dialog-button'),

    onButtonClick: () => {
      startSpotifyAuthorization();
    }
  });

  return loginDialogElement;
}

async function generateCodeChallenge(codeVerifier) {
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed);
  return codeChallenge;
}

async function exchangeCodeForToken(code) {
  const codeVerifier = getAuthCodeVerifier();
  if (!codeVerifier) {
    throw new Error('PKCE code verifier is missing.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to exchange authorization code (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('Spotify did not return an access token.');
  }

  saveSpotifyToken(payload.access_token);
  clearAuth();
}

function openLoginDialog() {
  const dialog = createLoginDialog();
  dialog.open();
}

async function ensureSpotifyPlayer() {
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

async function playTrackForPlace(placeId) {
  const trackUri = TRACK_BY_PLACE[placeId];
  if (!trackUri) {
    console.info(`No Spotify track configured for place ${placeId}.`);
    return;
  }

  if (!accessToken) {
    console.warn('Spotify access token is missing, cannot play track.');
    openLoginDialog();
    return;
  }

  try {
    await ensureSpotifyPlayer();

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

function parseAuthorizationResponse() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code') || '',
    state: params.get('state') || '',
  };
}

async function initSpotify() {
  const { code, state } = parseAuthorizationResponse();
  const savedState = getAuthState();

  if (code) {
    if (savedState && state && savedState !== state) {
      console.error('Spotify authorization state mismatch.');
      clearAuth();
      clearSpotifyQuery();
      openLoginDialog();
      return;
    }

    try {
      await exchangeCodeForToken(code);
      clearSpotifyQuery();
    } catch (error) {
      console.error('Unable to exchange Spotify authorization code:', error);
      clearAuth();
      clearSpotifyQuery();
      openLoginDialog();
      return;
    }
  }

  accessToken = accessToken || getSpotifyToken();

  if (!accessToken) {
    openLoginDialog();
    return;
  }

  try {
    await ensureSpotifyPlayer();
  } catch (error) {
    console.error('Unable to initialize Spotify playback:', error);
    openLoginDialog();
  }
}

const Spotify = {
  init: initSpotify,
  playTrackForPlace,
};

export default Spotify;
