"use client";

import "leaflet/dist/leaflet.css";
import { Fragment, useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { DonorMatch } from "@/lib/pulse/eligible-requests";

const matchingRadiusMeters: Record<DonorMatch["urgency"], number> = {
  critical: 15_000,
  urgent: 8_000,
  planned: 5_000,
};

function FitMatchingAreas({ matches }: { matches: DonorMatch[] }) {
  const map = useMap();

  useEffect(() => {
    if (!matches.length) return;

    const bounds = L.latLngBounds([]);
    matches.forEach((match) => {
      bounds.extend(L.circle([match.latitude, match.longitude], {
        radius: matchingRadiusMeters[match.urgency],
      }).getBounds());
    });
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
  }, [map, matches]);

  return null;
}

export default function RequestMap({
  matches,
  donorCenter,
}: {
  matches: DonorMatch[];
  donorCenter: [number, number] | null;
}) {
  const center: [number, number] = matches.length
    ? [matches[0].latitude, matches[0].longitude]
    : donorCenter ?? [22.5726, 88.3639];

  if (!matches.length && !donorCenter) {
    return <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600">Add a map location in your donor profile to see your local area here. Matched requests will appear as they become available.</div>;
  }

  return (
    <div>
      <MapContainer center={center} zoom={matches.length ? 10 : 11} scrollWheelZoom={false} className="h-[360px] w-full rounded-2xl">
        <FitMatchingAreas matches={matches} />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {!matches.length && donorCenter && <CircleMarker center={donorCenter} radius={9} pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9 }}><Popup>Your registered donor area</Popup></CircleMarker>}
        {matches.map((match) => (
          <Fragment key={match.requestId}>
            <Circle
              center={[match.latitude, match.longitude]}
              radius={matchingRadiusMeters[match.urgency]}
              pathOptions={{ color: "#b91c1c", weight: 1.5, fillColor: "#ef4444", fillOpacity: 0.08 }}
            />
            <CircleMarker
              center={[match.latitude, match.longitude]}
              radius={match.urgency === "critical" ? 11 : 8}
              pathOptions={{ color: match.urgency === "critical" ? "#991b1b" : "#c81e1e", fillColor: "#ef4444", fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{match.bloodGroup} · {match.unitsNeeded} {match.unitsNeeded === 1 ? "unit" : "units"}</strong>
                <br />{match.hospitalName}
                <br />{match.distanceKm.toFixed(1)} km away · {match.urgency}
                <br />Matching radius: {matchingRadiusMeters[match.urgency] / 1000} km
              </Popup>
            </CircleMarker>
          </Fragment>
        ))}
      </MapContainer>
      <p className="px-2 pt-2 text-xs text-neutral-500">Shaded circles show each request’s matching radius: 15 km critical, 8 km urgent, 5 km planned.</p>
    </div>
  );
}
