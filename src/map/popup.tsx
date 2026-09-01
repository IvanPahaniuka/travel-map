import 'glightbox/dist/css/glightbox.min.css';
import './popup.css';

import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { TravelPlace } from "../travel-data";
import Translations from "../translations";
import GLightbox from 'glightbox';

export type TravelPopupProps = {
  place?: TravelPlace | null;
};

export const TravelPopup: FC<TravelPopupProps> = ({ place }) => {

  const defaultPlace = useMemo(() => ({
    id: 'unknown-place',
    date: new Date(Date.now()),
    title: Translations.get('unknown-place-title'),
    latitude: 0,
    longitude: 0,
    tracks: [],
    gallery: [],
  }), []);

  if (!place) {
    place = defaultPlace;
  }

  const lightboxRef = useRef<ReturnType<typeof GLightbox>>(null);

  const onGalleryItemClick = useCallback((event: MouseEvent, index: number) => {
    event.preventDefault();
    lightboxRef.current?.openAt(index);
  }, []);

  useEffect(() => {
    const lightbox = GLightbox({ selector: '' });
    lightboxRef.current = lightbox;
    return () => {
      lightboxRef.current = null;
      lightbox.destroy();
    };
  }, []);

  useEffect(() => {
    if (!lightboxRef.current) {
      return;
    }

    const lightbox = lightboxRef.current;
    const lightboxElements = place.gallery.map(g => ({ href: g }));
    lightbox.setElements(lightboxElements);
  }, [place.gallery]);

  const formattedDate = useMemo(() => 
    new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(place.date), 
    [place.date]
  );

  return (
    <div className="popup-card">
      <div className="popup-header">
        <h3 className="popup-title">{place.title}</h3>
        <div className="popup-date">{formattedDate}</div>
      </div>

      <div className="popup-gallery">
        {place.gallery.slice(0, 4).map((g, i) => (
            <a 
              key={g}
              href={g} 
              target="_blank"
              rel="noreferrer"
              onClick={(e) => onGalleryItemClick(e, i)}
            >
              <img 
                src={g} 
                alt="img"
                loading="lazy"
                decoding="async"
              />
            </a>
        ))}
      </div>
    </div>
  );
};