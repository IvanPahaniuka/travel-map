import { FC } from 'react';
import { TravelMap } from './map';
import useTravelData from './travel-data';
import { PlayerWidget } from './player/components/player-widget';
import { SpotifyAuthDialog } from './spotify/components/spotify-auth-dialog';
import { WelcomeDialog } from './welcome-dialog';
import { ShareButton } from './share-button';
import SettingsStorage from './settings/settings-storage';

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
