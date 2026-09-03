import { FC } from 'react';
import { TravelMap } from './map';
import useTravelData from './travel-data';
import { PlayerWidget } from './player/components/player-widget';
import { SpotifyAuthDialog } from './spotify/components/spotify-auth-dialog';
import { WelcomeDialog } from './welcome-dialog';

const App: FC = () => {
  
  const { data } = useTravelData();

  return (
    <div className="travel-map-shell">
      <TravelMap travelData={data} />
      <PlayerWidget />
      <SpotifyAuthDialog />
      <WelcomeDialog welcomeData={data?.welcome} />
    </div>
  );
};

export default App;
