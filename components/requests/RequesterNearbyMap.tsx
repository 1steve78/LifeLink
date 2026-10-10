"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

export type NearbyRequest = {
  requestId: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospitalName: string;
  urgency: string;
  status: string;
  longitude: number;
  latitude: number;
  donorAvailability: "none" | "limited" | "several" | "many";
};

const matchingRadiusKm: Record<string, number> = { critical: 15, urgent: 8, planned: 5 };

function makeRadiusPolygon(longitude: number, latitude: number, radiusKm: number) {
  const earthRadiusKm = 6371.0088;
  const angularRadius = radiusKm / earthRadiusKm;
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const ring: [number, number][] = [];

  for (let bearing = 0; bearing <= 360; bearing += 6) {
    const bearingRad = bearing * Math.PI / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularRadius)
      + Math.cos(lat1) * Math.sin(angularRadius) * Math.cos(bearingRad),
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularRadius) * Math.cos(lat1),
      Math.cos(angularRadius) - Math.sin(lat1) * Math.sin(lat2),
    );
    ring.push([lon2 * 180 / Math.PI, lat2 * 180 / Math.PI]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring] },
  };
}

export default function RequesterNearbyMap({ requests }: { requests: NearbyRequest[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !requests.length || !token) return;
    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = token;
      const center: [number, number] = [requests[0].longitude, requests[0].latitude];
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: requests.length === 1 ? 11 : 5,
        attributionControl: true,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (requests.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          requests.forEach((request) => bounds.extend([request.longitude, request.latitude]));
          map?.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 0 });
        }
        map?.addSource("matching-areas", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: requests.map((request) => makeRadiusPolygon(
              request.longitude,
              request.latitude,
              matchingRadiusKm[request.urgency] ?? matchingRadiusKm.planned,
            )),
          },
        });
        map?.addLayer({
          id: "matching-area-fill",
          type: "fill",
          source: "matching-areas",
          paint: { "fill-color": "#dc2626", "fill-opacity": 0.12 },
        });
        map?.addLayer({
          id: "matching-area-outline",
          type: "line",
          source: "matching-areas",
          paint: { "line-color": "#b91c1c", "line-opacity": 0.42, "line-width": 1.5 },
        });

        requests.forEach((request) => {
          const pin = document.createElement("div");
          pin.className = "flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-white bg-red-700 px-2 text-[10px] font-extrabold text-white shadow-lg";
          pin.textContent = "REQ";
          pin.setAttribute("aria-label", `Request location at ${request.hospitalName}`);

          const content = document.createElement("div");
          content.className = "min-w-44 space-y-1 p-1 text-sm";
          const title = document.createElement("p");
          title.className = "font-bold";
          title.textContent = `${request.bloodGroup} · ${request.unitsNeeded} ${request.unitsNeeded === 1 ? "unit" : "units"}`;
          const hospital = document.createElement("p");
          hospital.textContent = request.hospitalName;
          const count = document.createElement("p");
          count.className = "font-semibold text-red-700";
          const availabilityText: Record<NearbyRequest["donorAvailability"], string> = {
            none: "No compatible donors matched in this area yet",
            limited: "A limited number of compatible donors may be in this area",
            several: "Several compatible donors may be in this area",
            many: "Many compatible donors may be in this area",
          };
          count.textContent = availabilityText[request.donorAvailability];
          const privacy = document.createElement("p");
          privacy.className = "text-xs text-neutral-500";
          privacy.textContent = "Shaded area is approximate. Donor pins and individual distances are never shown.";
          content.append(title, hospital, count, privacy);

          new mapboxgl.Marker({ element: pin, anchor: "bottom" })
            .setLngLat([request.longitude, request.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 18 }).setDOMContent(content))
            .addTo(map!);
        });
      });
      map.on("error", () => setError("Mapbox could not load the map. Check the public Mapbox token and network connection."));
    }).catch(() => setError("Mapbox could not be loaded."));

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [requests, token]);

  if (!token) return <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600">Add <code className="mx-1 rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the Mapbox donor availability map.</div>;
  if (!requests.length) return <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600">Your approved requests with a hospital location will appear here. Nearby donor counts appear after requests are activated.</div>;

  return <div className="space-y-2">
    {error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-2xl bg-neutral-100" />
    <p className="text-xs text-neutral-500">Request markers show hospitals. Shaded circles show approximate matching areas; availability is shown in broad bands. Donor pins, exact donor counts, and individual distances are never displayed.</p>
  </div>;
}
