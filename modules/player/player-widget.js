import Translations from '../translations.js';
import Player from './player.js';

const PLAYER_ID = 'player-widget';
const TRACK_TITLE_ID = 'player-widget-track-title';
const VOLUME_BUTTON_ID = 'spotify-player-volume';
const NEXT_BUTTON_ID = 'player-widget-next';

const NEXT_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.58124 8.12946L12.8608 11.1863C13.4191 11.5851 13.4191 12.4149 12.8608 12.8137L8.58124 15.8705C7.91937 16.3433 7 15.8702 7 15.0568V8.94319C7 8.12982 7.91937 7.65669 8.58124 8.12946Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 8V16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const VOLUME_ON_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.8302 15.2139C16.5435 14.3639 16.9537 13.3008 16.9963 12.1919C17.0389 11.0831 16.7114 9.99163 16.0655 9.08939" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.8944 17.7851C20.2406 16.1807 20.9852 14.1571 20.9998 12.0628C21.0144 9.96855 20.2982 7.93473 18.9745 6.31174" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const VOLUME_OFF_ICON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 14V10C3 9.44772 3.44772 9 4 9H6.64922C6.87629 9 7.0966 8.92272 7.27391 8.78087L10.3753 6.29976C11.0301 5.77595 12 6.24212 12 7.08062V16.9194C12 17.7579 11.0301 18.2241 10.3753 17.7002L7.27391 15.2191C7.0966 15.0773 6.87629 15 6.64922 15H4C3.44772 15 3 14.5523 3 14Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 9.5L18.5 12M21 14.5L18.5 12M18.5 12L21 9.5M18.5 12L16 14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let currentState = null;
let playerContainer = null;

function attachEventHandlers() {
  const volumeButton = document.getElementById(VOLUME_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);

  if (volumeButton) {
    volumeButton.addEventListener('click', async () => {
      if (!currentState) {
        return;
      }

      try {
        if (currentState.volume > 0) {
          await Player.setVolume(0);
        } else {
          await Player.setVolume(1);
        }
      } catch (error) {
        console.error('Player action failed:', error);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', async () => {
      try {
        await Player.next();
      } catch (error) {
        console.error('Next track action failed:', error);
      }
    });
  }
}

function render() {
  const titleElement = document.getElementById(TRACK_TITLE_ID);
  const volumeButton = document.getElementById(VOLUME_BUTTON_ID);
  const nextButton = document.getElementById(NEXT_BUTTON_ID);

  if (!titleElement || !nextButton) {
    return;
  }

  const volume = currentState.volume;
  const playlist = currentState.currentPlaylist;
  const trackState = playlist?.currentTrackState;

  if (!playlist || !trackState) {
    titleElement.textContent = Translations.get('player-widget-track-title-empty');
    nextButton.disabled = true;
  } else {
    const artists = trackState.artists ?? [];
    const title = [trackState.name, ...artists]
      .filter(n => typeof n === "string" && n.length > 0)
      .join(' • ');
    
    titleElement.textContent = title || Translations.get('player-widget-track-title-unknown');
    nextButton.disabled = false;
  }
  
  volumeButton.innerHTML = volume > 0 ? VOLUME_ON_ICON : VOLUME_OFF_ICON;
}

function handleStateUpdate() {
  currentState = Player.getState();
  render();
}

function createPlayerDom() {
  if (playerContainer) {
    return playerContainer;
  }

  playerContainer = document.createElement('div');
  playerContainer.id = PLAYER_ID;
  playerContainer.innerHTML = `
    <div class="player-widget-inner">
      <div class="player-widget-track">
        <div id="${TRACK_TITLE_ID}" class="player-widget-track-title"></div>
      </div>
      <div class="player-widget-controls">
        <div class="player-widget-button-group">
          <button id="${VOLUME_BUTTON_ID}" type="button" class="player-widget-button" aria-label="Toggle volume">
            ${VOLUME_ON_ICON}
          </button>
          <button id="${NEXT_BUTTON_ID}" type="button" class="player-widget-button" aria-label="Next track">
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

async function init() {
  createPlayerDom();
  handleStateUpdate();
  Player.addEventListener('state_changed', handleStateUpdate);
}

const PlayerWidget = {
  init,
};

export default PlayerWidget;
