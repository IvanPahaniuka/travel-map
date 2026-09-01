import { FC } from 'react';
import { TravelMap } from './map';
import useTravelData from './travel-data';

const App: FC = () => {
  
  const { data: travelData } = useTravelData();

  return (
    <div className="travel-map-shell">
      <TravelMap travelData={travelData} />
    </div>
  );
};

export default App;
