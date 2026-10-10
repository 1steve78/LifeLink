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
  nearbyDonorCount: number;
  nearestDistanceKm: number | null;
};

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
        requests.forEach((request) => {
          const pin = document.createElement("div");
          pin.className = "flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-white bg-red-700 px-2 text-xs font-extrabold text-white shadow-lg";
          pin.textContent = String(request.nearbyDonorCount);
          pin.setAttribute("aria-label", `${request.nearbyDonorCount} compatible donors nearby`);

          const content = document.createElement("div");
          content.className = "min-w-44 space-y-1 p-1 text-sm";
          const title = document.createElement("p");
          title.className = "font-bold";
          title.textContent = `${request.bloodGroup} · ${request.unitsNeeded} ${request.unitsNeeded === 1 ? "unit" : "units"}`;
          const hospital = document.createElement("p");
          hospital.textContent = request.hospitalName;
          const count = document.createElement("p");
          count.className = "font-semibold text-red-700";
          count.textContent = request.nearbyDonorCount
            ? `${request.nearbyDonorCount} compatible donor${request.nearbyDonorCount === 1 ? "" : "s"} within the request radius${request.nearestDistanceKm != null ? ` · nearest ${request.nearestDistanceKm.toFixed(1)} km` : ""}`
            : "No compatible donors nearby yet";
          const privacy = document.createElement("p");
          privacy.className = "text-xs text-neutral-500";
          privacy.textContent = "Donor home locations are kept private.";
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
    <p className="text-xs text-neutral-500">Map pins show request locations and compatible donor counts. Donor identities and home locations are never displayed.</p>
  </div>;
}
