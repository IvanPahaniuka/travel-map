import Dialog from '../dialog/dialog.js';
import Translations from '../translations.js';
import Utils from '../utils.js';
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

	SpotifyAuthStorage.setAuthState(state);
	SpotifyAuthStorage.setAuthCodeVerifier(codeVerifier);

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

const openLoginDialog = Utils.createSingleExecutor('spotify-auth-open-login-dialog', async () => {
	const showResult = Dialog.show({
		className: 'spotify-login-dialog',
		title: Translations.get('spotify-dialog-title'),
		message: Translations.get('spotify-dialog-message'),
		buttons: [
			{
				content: Translations.get('spotify-dialog-button'),
				onClick: () => {
					startSpotifyAuthorization();
				},
			}
		],
	});

	return showResult.promise;
}, true);

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
	const refreshToken = payload.refresh_token;
	if (!accessToken) {
		throw new Error('Spotify did not return an access token.');
	}

	SpotifyAuthStorage.setAccessToken(accessToken);

	if (refreshToken) {
		SpotifyAuthStorage.setRefreshToken(refreshToken);
	}

	SpotifyAuthStorage.clearAuthState();
	SpotifyAuthStorage.clearAuthCodeVerifier();
}

async function refreshSpotifyAccessToken() {
	const refreshToken = SpotifyAuthStorage.getRefreshToken();
	if (!refreshToken) {
		const error = new Error(`Spotify refresh token is missing.`);
		error.code = 'invalid_grant';
		throw error;
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
		try {
			const payload = await response.json();

			const error = new Error(
				`Unable to refresh access token (${response.status})` 
				+ payload.error_description && `: ${payload.error_description}`
			);

			error.code = payload.error;
			error.status = response.status;

			throw error;
		} catch {
			const errorText = await response.text();
			const error = new Error(
				`Unable to refresh access token (${response.status}): ${errorText}`
			);
			throw error;
		}
	}

	const payload = await response.json();
	const accessToken = payload.access_token;
	const newRefreshToken = payload.refresh_token;
	if (!accessToken) {
		throw new Error('Spotify did not return a new access token.');
	}

	SpotifyAuthStorage.setAccessToken(accessToken);

	if (newRefreshToken) {
		SpotifyAuthStorage.setRefreshToken(newRefreshToken);
	}
}

function parseAuthorizationResponse() {
	const params = new URLSearchParams(window.location.search);
	return {
		code: params.get('code') || '',
		state: params.get('state') || '',
	};
}

async function getAccessToken(openLoginDialogIfFailed = false) {
	const maxStaleTimeOnError = 5 * 24 * 60 * 60 * 1000;
	const accessTokenRefreshInterval = 5 * 60 * 1000;

	const [accessToken, updatedAt] = SpotifyAuthStorage.getAccessToken();
	if (!accessToken || (updatedAt + accessTokenRefreshInterval < Date.now())) {
		try {
			await refreshSpotifyAccessToken();
			const [newAccessToken] = SpotifyAuthStorage.getAccessToken();
			return newAccessToken;
		} catch (error) {
			console.warn('Unable to refresh Spotify access token:', error);

			if (error.code === 'invalid_grant' || (Date.now() - updatedAt > maxStaleTimeOnError)) {
				SpotifyAuthStorage.clearAccessToken();
				SpotifyAuthStorage.clearRefreshToken();
			} else if (accessToken) {
				return accessToken;
			}

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
