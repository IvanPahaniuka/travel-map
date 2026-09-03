import './index.css';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { FC, useState, useEffect, useRef, Ref, useCallback, RefCallback } from 'react';
import { TravelData, TravelPlace } from '../travel-data';
import { createPortal } from 'react-dom';
import { TravelPopup } from './popup';
import Utils from '../common/utils';
import Player from '../player';

export type TravelMapProps = {
  mapRef?: Ref<L.Map>;
  selectedPlaceRef?: Ref<TravelPlace>;
  travelData?: TravelData | null;
  enablePlayerController?: boolean;
};

const TravelMapBase: FC<TravelMapProps> = ({ mapRef }) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const [setMapRef, cleanupMapRef] = Utils.useRefModifier(mapRef);

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

    setMapRef(map);

    return () => {
      cleanupMapRef();
      map.remove();
    };
  }, []);

  return (<div ref={mapElementRef} id="map" aria-label="Travel map" />);
}

const TravelMapPlaces: FC<TravelMapProps> = (props) => {
  const places = props.travelData?.places;
  const [setSelectedPlaceRef, cleanupSelectedPlaceRef] = Utils.useRefModifier(props.selectedPlaceRef);

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

  const onPopupCloseCallback = useCallback(() => { 
      cleanupSelectedPlaceRef();
  }, []);
  const mapRefLocal: React.RefCallback<L.Map> = useCallback((mapNew: L.Map | null) => {
    setMap((mapOld) => {
      mapOld?.off('popupclose', onPopupCloseCallback);
      mapNew?.on('popupclose', onPopupCloseCallback);
      return mapNew;
    });
  }, []);

  const mapRef = Utils.useMergedRef(mapRefLocal, props.mapRef);

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
        setSelectedPlaceRef(place);

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
      <TravelMapBase
        {...props}
        mapRef={mapRef}
      />

      {places?.map((place, index) => createPortal(
        <TravelPopup place={place} />,
        popupElementsRef.current[index],
        place.id
      ))}
    </>
  );
};

async function updateCurrentPlaylist(map: L.Map | null | undefined, places: TravelPlace[] | null | undefined, selectedPlace: TravelPlace | null | undefined) {

  const pauseTrackRadiusPixels = 500;
  const playTrackRadiusPixels = 300;
  const switchTrackRadiusPixels = 100;

  let centeredPlace: TravelPlace | null = null;
  let centeredDistance = Number.POSITIVE_INFINITY;
  let lastCenteredDistance = Number.POSITIVE_INFINITY;

  if (selectedPlace) {
    centeredPlace = selectedPlace;
    centeredDistance = 0;
  }

  const playerState = Player.getState();
  const playerPlaylist = playerState.currentPlaylist;
  const playerPlaylistId = playerPlaylist?.id ?? null;

  if (playerState.volume === 0 || !map || !Array.isArray(places) || places.length === 0) {
    if (playerPlaylist !== null) {
      await Player.stop();
    }
    return;
  }

  const mapCenter = map.getCenter();
  const mapCenterPoint = map.latLngToContainerPoint(mapCenter);

  places.forEach((place) => {
    const placePoint = map.latLngToContainerPoint(L.latLng(place.latitude, place.longitude));
    const pixelDistance = Math.hypot(placePoint.x - mapCenterPoint.x, placePoint.y - mapCenterPoint.y);

    if (place.id === playerPlaylistId) {
      lastCenteredDistance = pixelDistance;
    }

    if (pixelDistance < centeredDistance) {
      centeredDistance = pixelDistance;
      centeredPlace = place;
    }
  });

  const centeredTracks = Array.isArray(centeredPlace?.tracks) ? centeredPlace.tracks : [];

  if (centeredPlace !== null && centeredTracks.length > 0 && centeredPlace.id !== playerPlaylistId) {
    const canChangePlaylist = centeredDistance <= (playerPlaylistId === null ? playTrackRadiusPixels : switchTrackRadiusPixels);
    if (canChangePlaylist) {
      await Player.changePlaylist(centeredPlace.id);
    }
  } else if (playerPlaylistId !== null && lastCenteredDistance > pauseTrackRadiusPixels && !selectedPlace) {
    await Player.stop();
  }
}

const TravelMapPlayerController: FC<TravelMapProps> = (props) => {
  const enablePlayerController = props.enablePlayerController ?? true;
  const places = props.travelData?.places;

  const [map, setMap] = useState<L.Map | null>(null);
  const selectedPlaceRefLocal = useRef<TravelPlace>(null);

  const updateCurrentPlaylistSkipping = useCallback(() => {
    if (!map || enablePlayerController === false) {
      return;
    }

    return Utils.skipOrExecute(
      'map-player-controller-update-current-playlist', 
      updateCurrentPlaylist, 
      map, 
      places ?? [], 
      selectedPlaceRefLocal.current
    );
  }, [map, places, enablePlayerController]);

  const updateCurrentPlaylistWaiting = useCallback(() => {
    if (!map || enablePlayerController === false) {
      return;
    }

    return Utils.waitAndExecute(
      'map-player-controller-update-current-playlist', 
      updateCurrentPlaylist, 
      map, 
      places ?? [], 
      selectedPlaceRefLocal.current
    );
  }, [map, places, enablePlayerController]);

  const onSelectedPlaceChanged = useCallback(() => {
    updateCurrentPlaylistWaiting();
  }, [updateCurrentPlaylistWaiting]);

  const mapRef: RefCallback<L.Map> = Utils.useMergedRef(props.mapRef, setMap);
  const selectedPlaceRef: RefCallback<TravelPlace> = Utils.useMergedRef(props.selectedPlaceRef, selectedPlaceRefLocal, onSelectedPlaceChanged);

  useEffect(() => {
    if (!map || enablePlayerController === false) {
      return;
    }

    let isUpdateCurrentPlaylistActive = false;
    const onPlayerStateChanged = () => {
      const state = Player.getState();

      if (state.volume === 0 && isUpdateCurrentPlaylistActive) {
        isUpdateCurrentPlaylistActive = false;

        map.off('move', updateCurrentPlaylistSkipping);
        map.off('zoom', updateCurrentPlaylistSkipping);

        Player.stop();

        return;
      }

      if (state.volume > 0 && !isUpdateCurrentPlaylistActive) {
        isUpdateCurrentPlaylistActive = true;

        map.on('move', updateCurrentPlaylistSkipping);
        map.on('zoom', updateCurrentPlaylistSkipping);

        updateCurrentPlaylistWaiting();

        return;
      }
    }

    Player.addEventListener('state_changed', onPlayerStateChanged);
    onPlayerStateChanged();

    return () => {
      Player.removeEventListener('state_changed', onPlayerStateChanged);

      if (isUpdateCurrentPlaylistActive) {
        map?.off('move', updateCurrentPlaylistSkipping);
        map?.off('zoom', updateCurrentPlaylistSkipping);
      }

      Utils.waitAndExecute(
        'map-player-controller-update-current-playlist',
        Player.stop
      );
    };
  }, [map, enablePlayerController, updateCurrentPlaylistSkipping, updateCurrentPlaylistWaiting]);

  return TravelMapPlaces({
    ...props,
    mapRef: mapRef,
    selectedPlaceRef: selectedPlaceRef,
  });
};

export const TravelMap: FC<TravelMapProps> = TravelMapPlayerController;
