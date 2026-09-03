import './index.css';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { FC, useState, useEffect, useRef, Ref, useCallback } from 'react';
import { TravelData, TravelPlace } from '../travel-data';
import { createPortal } from 'react-dom';
import { TravelPopup } from './popup';
import Utils from '../common/utils';

export type TravelMapProps = {
  travelData?: TravelData | null;
};

const TravelMapBase: FC<{ 
  mapInstanceRef?: Ref<L.Map>;
}> = ({ mapInstanceRef }) => {
  const mapElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      worldCopyJump: true,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    Utils.setRef(mapInstanceRef, map);

    return () => {
      Utils.setRef(mapInstanceRef, null);
      map.remove();
    };
  }, []);

  return (<div ref={mapElementRef} id="map" aria-label="Travel map" />);
}

const TravelMapPlaces: FC<{
  places?: TravelPlace[] | null;
}> = ({ places }) => {
  const [map, setMap] = useState<L.Map | null>(null);

  const markersRef = useRef<L.Marker[]>([]);
  const popupElementsRef = useRef<HTMLDivElement[]>([]);

  const placesCount = places?.length ?? 0;
  while (popupElementsRef.current.length < placesCount) {
    popupElementsRef.current.push(document.createElement('div'));
  }
  while (popupElementsRef.current.length > placesCount) {
    popupElementsRef.current.pop();
  }

  const [selectedPlace, setSelectedPlace] = useState<TravelPlace | null>(null);

  const onPopupCloseCallback = useCallback(() => { setSelectedPlace(null); }, []);
  const mapInstanceRefCallback: React.RefCallback<L.Map> = useCallback((mapNew: L.Map | null) => {
    setMap((mapOld) => {
      mapOld?.off('popupclose', onPopupCloseCallback);
      mapNew?.on('popupclose', onPopupCloseCallback);
      return mapNew;
    });
  }, []);

  useEffect(() => {
    if (!Array.isArray(places) || !map) {
      return;
    }

    while (markersRef.current.length > 0) {
      const marker = markersRef.current.pop();
      marker?.removeFrom(map);
      marker?.off();
    }

    const markers = places.map((place, index) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: L.divIcon({
          html: '<span class="marker-dot"></span>',
          className: 'travel-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
      }).addTo(map);

      marker.on('click', () => {
        setSelectedPlace(place);

        const popup = L.popup({
          className: 'travel-popup',
          minWidth: 250,
          maxWidth: 600,
          closeButton: false,
          offset: [0, -12],
        });

        const popupElement = popupElementsRef.current[index];

        popup
          .setLatLng(marker.getLatLng())
          .setContent(popupElement)
          .openOn(map);
      });

      return marker;
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map((marker) => marker.getLatLng()),
      );

      map.fitBounds(bounds.pad(0.25), { animate: false });
    }

    markersRef.current.push(...markers);

    return () => {
      while (markersRef.current.length > 0) {
        const marker = markersRef.current.pop();
        marker?.removeFrom(map);
        marker?.off();
      }
    };
  }, [places, map]);

  return (
    <>
      <TravelMapBase mapInstanceRef={mapInstanceRefCallback} />

      {places?.map((place, index) => createPortal(
        <TravelPopup place={place} />,
        popupElementsRef.current[index],
        place.id
      ))}
    </>
  );
};

export const TravelMap: FC<TravelMapProps> = ({ travelData }) => {
  return TravelMapPlaces({ places: travelData?.places });
}
