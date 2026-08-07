import Dialog from '../dialog/dialog.js';
import Translations from '../translations/translations.js';
import SpotifyAuthStorage from './spotify-auth-storage.js';

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
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return window.crypto.subtle.digest('SHA-256', data);
}

function generateRandomString(length) {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function startSpotifyAuthorization() {
	if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
		console.warn('Spotify Client ID is not configured. Replace YOUR_SPOTIFY_CLIENT_ID in spotify.js.');
	}

	const state = generateRandomString(16);
	const codeVerifier = generateRandomString(64);
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	SpotifyAuthStorage.saveAuthState(state);
	SpotifyAuthStorage.saveAuthCodeVerifier(codeVerifier);

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

let _loginDialogElement = null;
function getLoginDialog() {
	if (_loginDialogElement) return _loginDialogElement;

	_loginDialogElement = Dialog.create({
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

	return _loginDialogElement;
}

async function generateCodeChallenge(codeVerifier) {
	const hashed = await sha256(codeVerifier);
	const codeChallenge = base64encode(hashed);
	return codeChallenge;
}

async function exchangeCodeForToken(code) {
	const codeVerifier = SpotifyAuthStorage.getAuthCodeVerifier();
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
	const accessToken = payload.access_token;
	const expiresIn = Number(payload.expires_in);
	const refreshToken = payload.refresh_token;
	if (!accessToken) {
		throw new Error('Spotify did not return an access token.');
	}
	if (!expiresIn) {
		throw new Error('Spotify did not return an expires in for access token or it\'s not a number.');
	}

	SpotifyAuthStorage.saveAccessToken(accessToken, expiresIn);

	if (refreshToken) {
		SpotifyAuthStorage.saveRefreshToken(refreshToken);
	}

	SpotifyAuthStorage.clearAuthState();
	SpotifyAuthStorage.clearAuthCodeVerifier();
}

async function refreshSpotifyAccessToken() {
	const refreshToken = SpotifyAuthStorage.getRefreshToken();
	if (!refreshToken) {
		throw new Error('Spotify refresh token is missing.');
	}

	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: SPOTIFY_CLIENT_ID,
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
		throw new Error(`Unable to refresh access token (${response.status}): ${errorText}`);
	}

	const payload = await response.json();
	const accessToken = payload.access_token;
	const expiresIn = Number(payload.expires_in);
	const newRefreshToken = payload.refresh_token;
	if (!accessToken) {
		throw new Error('Spotify did not return a new access token.');
	}
	if (!expiresIn) {
		throw new Error('Spotify did not return an expires in for access token or it\'s not a number.');
	}

	SpotifyAuthStorage.saveAccessToken(accessToken, expiresIn);

	if (newRefreshToken) {
		SpotifyAuthStorage.saveRefreshToken(newRefreshToken);
	}
}

function openLoginDialog() {
	const dialog = getLoginDialog();
	dialog.open();
}

function parseAuthorizationResponse() {
	const params = new URLSearchParams(window.location.search);
	return {
		code: params.get('code') || '',
		state: params.get('state') || '',
	};
}

async function getAccessToken(openLoginDialogIfFailed = false) {
	const [accessToken, expiresAt] = SpotifyAuthStorage.getAccessToken();
	if (!accessToken || expiresAt < Date.now()) {
		SpotifyAuthStorage.clearAccessToken();

		try {
			await refreshSpotifyAccessToken();
			const [newAccessToken] = SpotifyAuthStorage.getAccessToken();
			return newAccessToken;
		} catch (error) {
			console.warn('Unable to refresh Spotify access token:', error);
			SpotifyAuthStorage.clearRefreshToken();
			if (openLoginDialogIfFailed === true) {
				openLoginDialog();
			}
			return undefined;
		}
	}
	return accessToken;
}

async function init() {
	const { code, state } = parseAuthorizationResponse();
	const savedState = SpotifyAuthStorage.getAuthState();

	if (code) {
		if (savedState && state && savedState !== state) {
			console.error('Spotify authorization state mismatch.');
			SpotifyAuthStorage.clearAuthState();
			SpotifyAuthStorage.clearAuthCodeVerifier();
			clearSpotifyQuery();
			openLoginDialog();
			return false;
		}

		try {
			await exchangeCodeForToken(code);
			clearSpotifyQuery();
		} catch (error) {
			console.error('Unable to exchange Spotify authorization code:', error);
			SpotifyAuthStorage.clearAuthState();
			SpotifyAuthStorage.clearAuthCodeVerifier();
			clearSpotifyQuery();
			openLoginDialog();
			return false;
		}
	}

	const accessToken = await getAccessToken(true);
	if (!accessToken) {
		return false;
	}

	return true;
}

const SpotifyAuth = {
	init,
	getAccessToken,
};

export default SpotifyAuth;
