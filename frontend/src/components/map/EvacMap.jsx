import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import FireLayers from './FireLayers';
import FacilityMarkers from './FacilityMarkers';
import RouteOverlay from './RouteOverlay';
import WindOverlay from './WindOverlay';
import FarmMarkers from './FarmMarkers';
import UserPin from './UserPin';
import NeighborAwarenessMarkers from './NeighborAwarenessMarkers';

function MapController({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    if (!center || !zoom) return;
    const centerChanged = center[0] !== prevCenter.current?.[0] || center[1] !== prevCenter.current?.[1];
    const zoomChanged = zoom !== prevZoom.current;
    if (centerChanged || zoomChanged) {
      map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

export default function EvacMap({
  center = [33.24, -117.18],
  zoom = 11,
  fireData,
  facilities,
  routes,
  farms,
  fellowFarmers = null,
  showFire = true,
  showFacilities = true,
  showRoutes = false,
  showFarms = true,
  showNeighborFarms = true,
  activeFarm,
  onFacilityClick,
  onMapClick,
  userLocation,
  pickMode = false,
  onPickLocation,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className="w-full h-full"
      attributionControl={true}
      minZoom={8}
      maxZoom={16}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />

      <ZoomControl position="bottomright" />
      <MapController center={center} zoom={zoom} />

      {showFire && fireData && (
        <FireLayers fireData={fireData} />
      )}

      {showFacilities && facilities && (
        <FacilityMarkers
          facilities={facilities}
          onFacilityClick={onFacilityClick}
        />
      )}

      {showRoutes && routes && (
        <RouteOverlay routes={routes} />
      )}

      {showFarms && farms && (
        <FarmMarkers farms={farms} activeFarm={activeFarm} />
      )}

      {showNeighborFarms && fellowFarmers?.length > 0 && (
        <NeighborAwarenessMarkers fellowFarmers={fellowFarmers} />
      )}

      {showFire && fireData?.wind && (
        <WindOverlay wind={fireData.wind} fireOrigin={[33.24, -117.18]} />
      )}

      <UserPin
        location={userLocation}
        pickMode={pickMode}
        onPick={onPickLocation}
      />
    </MapContainer>
  );
}
