import { FC, useEffect } from 'react';
import { TravelMap } from './map';
import useTravelData, { TravelPlace } from './travel-data';
import { PlayerWidget } from './player/components/player-widget';
import { SpotifyAuthDialog } from './spotify/components/spotify-auth-dialog';
import { WelcomeDialog } from './welcome-dialog';
import { ShareButton } from './share-button';
import SettingsStorage from './settings/settings-storage';
import Player from './player';
import Utils from './common/utils';

async function updatePlaylists(places: TravelPlace[] | null | undefined) {
	places ??= [];

  const state = Player.getState();
  for (const playlist of state.playlists) {
    await Player.removePlaylist(playlist.id);
  }

	for (const place of places) {
		await Player.addPlaylist(
			place.id, 
			Array.isArray(place.tracks) ? place.tracks : []
		);
	}
}

function applySharedSettingsFromQuery() {
	const params = new URLSearchParams(window.location.search);

	const dataUrls = params.getAll('data_urls');
	const encryptionKeys = params.getAll('encryption_keys');

	if (dataUrls.length === 0) {
    return;
  }

  SettingsStorage.setSettings({ data: [{
      url: dataUrls[0],
      encryptionKey: encryptionKeys[0] ?? '',
  }] });

  params.delete('data_urls');
  params.delete('encryption_keys');

  const queryString = params.toString();
  const url = new URL(window.location.href);
  url.search = queryString;
  window.history.replaceState({}, '', url);
}

const App: FC = () => {

  applySharedSettingsFromQuery();
  
  const { data } = useTravelData();

  useEffect(() => {
    Utils.waitAndExecute(
      'app-update-playlists', 
      updatePlaylists, 
      data?.places
    );
  }, [data?.places]);

  return (
    <div className="travel-map-shell">
      <TravelMap travelData={data} />
      <ShareButton />
      <PlayerWidget />
      <SpotifyAuthDialog />
      <WelcomeDialog welcomeData={data?.welcome} />
    </div>
  );
};

export default App;
