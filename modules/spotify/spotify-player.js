import Spotify from './spotify.js';

const PLAYER_ID = 'spotify-player';
const PLAY_PAUSE_BUTTON_ID = 'spotify-player-play-pause';
const NEXT_BUTTON_ID = 'spotify-player-next';
const TRACK_TITLE_ID = 'spotify-player-track-title';
const TRACK_STATE_ID = 'spotify-player-track-state';

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
        <div id="${TRACK_STATE_ID}" class="spotify-player-track-state">Connect to Spotify to see current playback.</div>
      </div>
      <div class="spotify-player-controls">
        <div class="spotify-player-button-group">
          <button id="${PLAY_PAUSE_BUTTON_ID}" type="button" class="spotify-player-button" aria-label="Play or pause">
            ▶
          </button>
          <button id="${NEXT_BUTTON_ID}" type="button" class="spotify-player-button" aria-label="Next track">
            ⏭
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
  const stateElement = document.getElementById(TRACK_STATE_ID);
  const playPauseButton = document.getElementById(PLAY_PAUSE_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);

  if (!titleElement || !stateElement || !playPauseButton || !nextButton) {
    return;
  }

  if (!state || !state.track_window?.current_track) {
    titleElement.textContent = 'No active Spotify playback';
    stateElement.textContent = 'Open Spotify and play a track to see playback info here.';
    playPauseButton.disabled = true;
    nextButton.disabled = true;
    playPauseButton.textContent = '▶';
    return;
  }

  const track = state.track_window.current_track;
  titleElement.textContent = track.name || 'Unknown track';
  stateElement.textContent = state.paused ? 'Paused' : 'Playing';
  playPauseButton.disabled = false;
  nextButton.disabled = false;
  playPauseButton.textContent = state.paused ? '▶' : '⏸';
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
