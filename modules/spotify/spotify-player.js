import Translations from '../translations/translations.js';
import Spotify from './spotify.js';

const PLAYER_ID = 'spotify-player';
const PLAY_PAUSE_BUTTON_ID = 'spotify-player-play-pause';
const NEXT_BUTTON_ID = 'spotify-player-next';
const VOLUME_BUTTON_ID = 'spotify-player-volume';
const TRACK_TITLE_ID = 'spotify-player-track-title';

const PLAY_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 17.1783V6.82167C8 6.03258 8.87115 5.55437 9.53688 5.97801L17.6742 11.1563C18.2917 11.5493 18.2917 12.4507 17.6742 12.8437L9.53688 18.022C8.87115 18.4456 8 17.9674 8 17.1783Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="4" height="12" rx="1" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="6" width="4" height="12" rx="1" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NEXT_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.58124 8.12946L12.8608 11.1863C13.4191 11.5851 13.4191 12.4149 12.8608 12.8137L8.58124 15.8705C7.91937 16.3433 7 15.8702 7 15.0568V8.94319C7 8.12982 7.91937 7.65669 8.58124 8.12946Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8V16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const VOLUME_ON_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.8302 15.2139C16.5435 14.3639 16.9537 13.3008 16.9963 12.1919C17.0389 11.0831 16.7114 9.99163 16.0655 9.08939" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.8944 17.7851C20.2406 16.1807 20.9852 14.1571 20.9998 12.0628C21.0144 9.96855 20.2982 7.93473 18.9745 6.31174" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const VOLUME_OFF_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 9.5L18.5 12M21 14.5L18.5 12M18.5 12L21 9.5M18.5 12L16 14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let currentState = null;
let playerContainer = null;

function createPlayerDom() {
  if (playerContainer) {
    return playerContainer;
  }

  playerContainer = document.createElement('div');
  playerContainer.id = PLAYER_ID;
  playerContainer.innerHTML = `
    <div class="spotify-player-inner">
      <div class="spotify-player-track">
        <div id="${TRACK_TITLE_ID}" class="spotify-player-track-title">Spotify player unavailable</div>
      </div>
      <div class="spotify-player-controls">
        <div class="spotify-player-button-group">
          <button id="${VOLUME_BUTTON_ID}" type="button" class="spotify-player-button" aria-label="Toggle volume">
            ${VOLUME_ON_ICON}
          </button>
          <button id="${PLAY_PAUSE_BUTTON_ID}" type="button" class="spotify-player-button" aria-label="Play or pause">
            ${PLAY_ICON}
          </button>
          <button id="${NEXT_BUTTON_ID}" type="button" class="spotify-player-button" aria-label="Next track">
            ${NEXT_ICON}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(playerContainer);
  attachEventHandlers();
  return playerContainer;
}

function attachEventHandlers() {
  const playPauseButton = document.getElementById(PLAY_PAUSE_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);
  const volumeButton = document.getElementById(VOLUME_BUTTON_ID);

  if (playPauseButton) {
    playPauseButton.addEventListener('click', async () => {
      if (!currentState) {
        return;
      }

      try {
        if (currentState.paused) {
          await Spotify.resume();
        } else {
          await Spotify.pause();
        }
      } catch (error) {
        console.error('Spotify player action failed:', error);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', async () => {
      try {
        await Spotify.next();
      } catch (error) {
        console.error('Spotify next track action failed:', error);
      }
    });
  }

  if (volumeButton) {
    volumeButton.addEventListener('click', async () => {
      const currentVolume = await Spotify.getVolume();
      const targetVolume = currentVolume > 0.02 ? 0 : 1;
      try {
        await Spotify.setVolume(targetVolume);
        renderState(currentState);
      } catch (error) {
        console.error('Spotify volume action failed:', error);
      }
    });
  }
}

function renderState(state) {
  const titleElement = document.getElementById(TRACK_TITLE_ID);
  const playPauseButton = document.getElementById(PLAY_PAUSE_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);
  const volumeButton = document.getElementById(VOLUME_BUTTON_ID);

  if (!titleElement || !playPauseButton || !nextButton || !volumeButton) {
    return;
  }

  if (!state?.track_window?.current_track) {
    titleElement.textContent = Translations.get('spotify-player-track-title-empty');
    playPauseButton.disabled = true;
    nextButton.disabled = true;
    volumeButton.disabled = true;
    playPauseButton.innerHTML = PLAY_ICON;
    volumeButton.innerHTML = VOLUME_ON_ICON;
    return;
  }

  const track = state.track_window.current_track;
  const artists = track.artists?.map(a => a.name) ?? [];
  const title = [track.name, ...artists]
    .filter(n => typeof n === "string" && n.length > 0)
    .join(' • ');
  titleElement.textContent = title || Translations.get('spotify-player-track-title-unknown');
  playPauseButton.disabled = false;
  nextButton.disabled = false;
  volumeButton.disabled = false;
  playPauseButton.innerHTML = state.paused ? PLAY_ICON : PAUSE_ICON;

  Spotify.getVolume().then(volume => {
    volumeButton.innerHTML = volume <= 0.02 ? VOLUME_OFF_ICON : VOLUME_ON_ICON;
  });  
}

function handleStateUpdate(state) {
  currentState = state;
  renderState(state);
}

const SpotifyPlayer = {
  async init() {
    createPlayerDom();

    try {
      const current = await Spotify.getCurrentState();
      handleStateUpdate(current);
    } catch (error) {
      console.error('Unable to fetch Spotify current state:', error);
    }

    Spotify.subscribeToPlayerState(handleStateUpdate);
  },
};

export default SpotifyPlayer;
