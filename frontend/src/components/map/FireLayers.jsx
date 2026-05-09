import { GeoJSON, CircleMarker } from 'react-leaflet';
import { useMemo } from 'react';

const PERIMETER_STYLES = {
  current: { color: '#dc2626', weight: 2.5, fillColor: '#dc2626', fillOpacity: 0.3 },
  1: { color: '#ea580c', weight: 2, fillColor: '#ea580c', fillOpacity: 0.2, dashArray: '8 4' },
  2: { color: '#f59e0b', weight: 1.5, fillColor: '#f59e0b', fillOpacity: 0.15, dashArray: '8 4' },
  4: { color: '#ca8a04', weight: 1.5, fillColor: '#ca8a04', fillOpacity: 0.1, dashArray: '6 6' },
  6: { color: '#a16207', weight: 1, fillColor: '#a16207', fillOpacity: 0.06, dashArray: '4 8' },
};

export default function FireLayers({ fireData }) {
  const fireId = fireData?.fire_id;

  const projections = useMemo(() => {
    if (!fireData?.projected_perimeters) return [];
    return [...fireData.projected_perimeters].reverse();
  }, [fireId]);

  const currentPerimeter = useMemo(() => fireData?.current_perimeter, [fireId]);
  const hotspots = useMemo(() => fireData?.active_hotspots || [], [fireId]);

  if (!fireData) return null;

  return (
    <>
      {projections.map((proj) => {
        const style = PERIMETER_STYLES[proj.hours] || PERIMETER_STYLES[6];
        return (
          <GeoJSON
            key={`fire-proj-${fireId}-${proj.hours}`}
            data={proj.geometry}
            style={() => ({
              color: style.color,
              weight: style.weight,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              dashArray: style.dashArray || null,
            })}
          />
        );
      })}

      {currentPerimeter && (
        <GeoJSON
          key={`fire-current-${fireId}`}
          data={currentPerimeter}
          style={() => ({
            ...PERIMETER_STYLES.current,
          })}
        />
      )}

      {hotspots.map((hotspot, i) => (
        <CircleMarker
          key={`hotspot-${fireId}-${i}`}
          center={[hotspot.lat, hotspot.lon]}
          radius={5}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#dc2626',
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}
