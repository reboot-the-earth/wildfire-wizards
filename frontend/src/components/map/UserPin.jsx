/**
 * UserPin — renders the farmer's chosen location as an animated marker on the
 * map and (when ``pickMode`` is on) listens for the next map click to set it.
 *
 * The marker is a Leaflet ``divIcon`` so it can use our custom CSS pulse
 * animations and Tailwind palette. It's also draggable, so once dropped the
 * farmer can fine-tune the exact pasture pixel without retyping coords.
 *
 * This component intentionally lives *inside* the <MapContainer> so it can use
 * react-leaflet hooks (useMap, useMapEvents) and emit click events back to
 * the parent. ``onPick(lat, lon)`` is the only outbound channel.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const PIN_HTML = `
  <div class="user-pin-wrap">
    <div class="user-pin-pulse"></div>
    <div class="user-pin-core">
      <svg viewBox="0 0 20 20" fill="currentColor" class="user-pin-icon">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`;

const userPinIcon = L.divIcon({
  className: 'user-pin-icon-wrap',
  iconSize: [40, 48],
  iconAnchor: [20, 44],
  popupAnchor: [0, -38],
  html: PIN_HTML,
});

export default function UserPin({ location, pickMode, onPick, autoFly = true }) {
  const map = useMap();
  const markerRef = useRef(null);

  // Click anywhere on the map while pickMode is on -> drop pin there.
  useMapEvents({
    click: (e) => {
      if (!pickMode) return;
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });

  // Crosshair cursor + dimmed map signals "you can click to drop a pin".
  useEffect(() => {
    const container = map.getContainer();
    if (pickMode) {
      container.classList.add('map-pick-mode');
    } else {
      container.classList.remove('map-pick-mode');
    }
    return () => container.classList.remove('map-pick-mode');
  }, [map, pickMode]);

  // Smooth-pan to the farm whenever it changes (handles address/ZIP/coords/pin).
  useEffect(() => {
    if (!autoFly || !location) return;
    const targetZoom = Math.max(map.getZoom(), 13);
    map.flyTo([location.lat, location.lon], targetZoom, {
      duration: 0.9,
      easeLinearity: 0.25,
    });
  }, [autoFly, location?.lat, location?.lon, map]);

  // Drag handler — propagate the new coords back through the same channel.
  const eventHandlers = useMemo(
    () => ({
      dragend: (event) => {
        const { lat, lng } = event.target.getLatLng();
        onPick?.(lat, lng);
      },
    }),
    [onPick]
  );

  if (!location) return null;

  return (
    <Marker
      ref={markerRef}
      position={[location.lat, location.lon]}
      icon={userPinIcon}
      draggable={true}
      eventHandlers={eventHandlers}
      zIndexOffset={1000}
    />
  );
}
