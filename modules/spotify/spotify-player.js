import Translations from '../translations/translations.js';
import Spotify from './spotify.js';

const PLAYER_ID = 'spotify-player';
const PLAY_PAUSE_BUTTON_ID = 'spotify-player-play-pause';
const NEXT_BUTTON_ID = 'spotify-player-next';
const TRACK_TITLE_ID = 'spotify-player-track-title';

const PLAY_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 17.1783V6.82167C8 6.03258 8.87115 5.55437 9.53688 5.97801L17.6742 11.1563C18.2917 11.5493 18.2917 12.4507 17.6742 12.8437L9.53688 18.022C8.87115 18.4456 8 17.9674 8 17.1783Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="4" height="12" rx="1" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="6" width="4" height="12" rx="1" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NEXT_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.58124 8.12946L12.8608 11.1863C13.4191 11.5851 13.4191 12.4149 12.8608 12.8137L8.58124 15.8705C7.91937 16.3433 7 15.8702 7 15.0568V8.94319C7 8.12982 7.91937 7.65669 8.58124 8.12946Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8V16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
}

function renderState(state) {
  const titleElement = document.getElementById(TRACK_TITLE_ID);
  const playPauseButton = document.getElementById(PLAY_PAUSE_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);

  if (!titleElement || !playPauseButton || !nextButton) {
    return;
  }

  if (!state?.track_window?.current_track) {
    titleElement.textContent = Translations.get('spotify-player-track-title-empty');
    playPauseButton.disabled = true;
    nextButton.disabled = true;
    playPauseButton.innerHTML = PLAY_ICON;
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
  playPauseButton.innerHTML = state.paused ? PLAY_ICON : PAUSE_ICON;
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
