"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { DonorMatch } from "@/lib/pulse/eligible-requests";

export default function RequestMap({ matches }: { matches: DonorMatch[] }) {
  const center: [number, number] = matches.length
    ? [matches[0].latitude, matches[0].longitude]
    : [22.5726, 88.3639];

  return (
    <MapContainer center={center} zoom={matches.length ? 11 : 5} scrollWheelZoom={false} className="h-[360px] w-full rounded-2xl">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {matches.map((match) => (
        <CircleMarker
          key={match.requestId}
          center={[match.latitude, match.longitude]}
          radius={match.urgency === "critical" ? 11 : 8}
          pathOptions={{ color: match.urgency === "critical" ? "#991b1b" : "#c81e1e", fillColor: "#ef4444", fillOpacity: 0.78 }}
        >
          <Popup>
            <strong>{match.bloodGroup} · {match.unitsNeeded} {match.unitsNeeded === 1 ? "unit" : "units"}</strong>
            <br />{match.hospitalName}
            <br />{match.distanceKm.toFixed(1)} km away · {match.urgency}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
