"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Charger } from "@/types";
import {
  Navigation,
  Loader2,
  AlertCircle,
  LocateFixed,
  Zap,
  MapPin,
  ChevronRight,
  Crosshair,
  ExternalLink,
} from "lucide-react";

interface ChargerMapProps {
  chargers: Charger[];
  selectedChargerId?: string | null;
  onSelectCharger?: (charger: Charger | null) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
}

// Haversine distance calculator in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function ChargerMap({
  chargers,
  selectedChargerId,
  onSelectCharger,
  center = [18.5204, 73.8567], // Default Pune center
  zoom = 11,
  userLocation: externalUserLocation,
  onLocationFound,
}: ChargerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<{ [key: string]: any }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userCircleRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const distanceBadgeMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletModuleRef = useRef<any>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [internalUserCoords, setInternalUserCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);

  const currentUserCoords = externalUserLocation || internalUserCoords;

  // Selected charger object
  const selectedCharger = chargers.find((c) => c.chargerId === selectedChargerId) || null;

  // Restore stored user coords from sessionStorage if available
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("voltloop_user_coords");
      if (cached && !externalUserLocation && !internalUserCoords) {
        const parsed = JSON.parse(cached);
        if (parsed?.lat && parsed?.lng) {
          setInternalUserCoords(parsed);
          onLocationFound?.(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read cached coords", e);
    }
  }, [externalUserLocation, internalUserCoords, onLocationFound]);

  // Render or update user marker on map
  const renderUserMarker = useCallback((lat: number, lng: number, accuracy = 100) => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clean up previous user marker & accuracy circle
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      userCircleRef.current.remove();
      userCircleRef.current = null;
    }

    // Find nearest charger from current location
    let nearestCharger: Charger | null = null;
    let minDistance = Infinity;
    chargers.forEach((c) => {
      const dist = calculateDistanceKm(lat, lng, c.latitude, c.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestCharger = c;
      }
    });

    const nearestDriveMin = Math.max(3, Math.round(minDistance * 2.5));

    // Custom pulsing user location marker icon
    const userDivIcon = L.divIcon({
      className: "voltloop-user-marker",
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(0, 108, 73, 0.28);
            animation: voltloop-pulse 2s infinite ease-out;
          "></div>
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background-color: #006c49;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
          "></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -18],
    });

    const marker = L.marker([lat, lng], {
      icon: userDivIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    const popupHtml = `
      <div style="width: 250px; padding: 12px; font-family: Inter, system-ui, sans-serif; color: #161d19;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="font-size: 14px;">📍</span>
          <strong style="font-size: 13px; font-weight: 800; color: #006c49;">You Are Here</strong>
        </div>
        <p style="font-size: 11px; color: #3c4a42; margin: 0 0 8px;">
          GPS accuracy within ±${Math.round(accuracy)} meters
        </p>
        ${
          nearestCharger
            ? `
          <div style="background: #eef6ee; border: 1px solid #c2e2c8; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
            <div style="font-size: 10px; text-transform: uppercase; color: #3c4a42; font-weight: 700;">Nearest Community Charger:</div>
            <div style="font-size: 12px; font-weight: 700; color: #161d19; margin-top: 2px;">${(nearestCharger as Charger).title}</div>
            <div style="font-size: 11px; color: #006c49; font-weight: 700; margin-top: 2px;">⚡ ~${minDistance} km away (~${nearestDriveMin} min drive)</div>
          </div>
          <a href="/charger/${(nearestCharger as Charger).chargerId}" style="
            display: block;
            text-align: center;
            background: #006c49;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
            padding: 8px 10px;
            border-radius: 8px;
            text-decoration: none;
          ">
            Book Nearest Charger →
          </a>
        `
            : `
          <div style="font-size: 11px; color: #3c4a42;">
            No community chargers within direct range yet.
          </div>
        `
        }
      </div>
    `;

    marker.bindPopup(popupHtml);

    // Subtle accuracy circle
    const circle = L.circle([lat, lng], {
      radius: Math.min(accuracy, 800),
      color: "#006c49",
      weight: 1.5,
      fillColor: "#006c49",
      fillOpacity: 0.08,
    }).addTo(map);

    userMarkerRef.current = marker;
    userCircleRef.current = circle;
  }, [chargers]);

  // Locate User via HTML5 Geolocation API
  const handleLocateUser = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setTimeout(() => setLocationError(null), 5000);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude, accuracy };
        setInternalUserCoords(coords);

        try {
          sessionStorage.setItem("voltloop_user_coords", JSON.stringify({ lat: latitude, lng: longitude }));
        } catch (e) {
          console.warn("Storage error", e);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, {
            duration: 1.4,
          });
        }

        renderUserMarker(latitude, longitude, accuracy);

        if (onLocationFound) {
          onLocationFound({ lat: latitude, lng: longitude });
        }

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation error:", error);
        let errorMsg = "Unable to retrieve your current location.";
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please allow GPS access in your browser.";
        } else if (error.code === 2) {
          errorMsg = "Location unavailable. Please check your device GPS signal.";
        } else if (error.code === 3) {
          errorMsg = "Location request timed out. Please try again.";
        }
        setLocationError(errorMsg);
        setTimeout(() => setLocationError(null), 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Recenter to all chargers
  const handleFitAllChargers = () => {
    if (!mapInstanceRef.current || chargers.length === 0) return;
    const L = leafletModuleRef.current;
    if (!L) return;
    const group = L.featureGroup(Object.values(markersRef.current));
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.12));
  };

  // Initialize Map & Charger Markers
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically load Leaflet
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false,
        });

        // OpenStreetMap Tile Layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing charger markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      // Add charger markers with dynamic distance calculations
      chargers.forEach((c) => {
        let pinColor = "#006c49"; // Available (Forest Emerald)
        let badgeText = "Available";
        if (c.availability === "LIMITED") {
          pinColor = "#d97706";
          badgeText = "Limited";
        } else if (c.availability === "UNAVAILABLE" || c.availability === "BOOKED") {
          pinColor = "#ba1a1a";
          badgeText = "Booked";
        }

        const isCurrentSelected = selectedChargerId === c.chargerId;
        const iconSize = isCurrentSelected ? 42 : 36;
        const iconAnchor = isCurrentSelected ? 21 : 18;

        const customIcon = L.divIcon({
          className: "custom-div-icon",
          html: `
            <div style="
              position: relative;
              width: ${iconSize}px;
              height: ${iconSize}px;
              background-color: ${pinColor};
              border: 3px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${isCurrentSelected ? "0 0 0 4px rgba(0, 108, 73, 0.35), 0 6px 16px rgba(0,0,0,0.35)" : "0 4px 12px rgba(0,0,0,0.25)"};
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              <svg width="${isCurrentSelected ? 20 : 18}" height="${isCurrentSelected ? 20 : 18}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          `,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconAnchor, iconAnchor],
          popupAnchor: [0, -iconAnchor - 4],
        });

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon }).addTo(map);

        // Distance calculation if current user coords exist
        let distanceSection = "";
        let directionsUrl = `https://maps.google.com/?q=${c.latitude},${c.longitude}`;
        if (currentUserCoords) {
          const dist = calculateDistanceKm(currentUserCoords.lat, currentUserCoords.lng, c.latitude, c.longitude);
          const driveMins = Math.max(3, Math.round(dist * 2.5));
          directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentUserCoords.lat},${currentUserCoords.lng}&destination=${c.latitude},${c.longitude}`;
          distanceSection = `
            <div style="background: #eef6ee; border: 1px solid #c2e2c8; border-radius: 8px; padding: 7px 10px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11px; font-weight: 700; color: #006c49; display: flex; align-items: center; gap: 4px;">
                📍 ${dist} km away
              </span>
              <span style="font-size: 10px; color: #3c4a42; font-weight: 600;">
                🚗 ~${driveMins} min drive
              </span>
            </div>
          `;
        }

        const popupContent = `
          <div style="width: 250px; padding: 14px; background: #ffffff; color: #161d19; font-family: Inter, system-ui, sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; background: ${pinColor}18; color: ${pinColor};">
                ● ${badgeText}
              </span>
              <span style="font-size: 12px; color: #d97706; font-weight: 700; display: flex; align-items: center; gap: 2px;">
                ★ ${c.rating || "New"}
              </span>
            </div>

            <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #161d19; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${c.title}
            </h4>

            <p style="margin: 0 0 8px; font-size: 12px; color: #3c4a42; display: flex; align-items: center; gap: 4px;">
              📍 ${c.address}, ${c.city}
            </p>

            ${distanceSection}

            <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid #dde4dd; padding-top: 8px; margin-bottom: 10px;">
              <div>
                <span style="font-size: 11px; color: #3c4a42;">Power: </span>
                <strong style="font-size: 13px; color: #006c49;">${c.powerKw} kW AC</strong>
              </div>
              <div>
                <strong style="font-size: 14px; color: #161d19;">₹${c.electricityRate}</strong>
                <span style="font-size: 11px; color: #3c4a42;">/kWh</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="
                text-align: center;
                background: #eef6ee;
                color: #006c49;
                font-weight: 700;
                font-size: 11px;
                padding: 8px 6px;
                border-radius: 8px;
                border: 1px solid #c2e2c8;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              ">
                🗺️ Directions
              </a>
              <a href="/charger/${c.chargerId}" style="
                text-align: center;
                background: #006c49;
                color: #ffffff;
                font-weight: 700;
                font-size: 11px;
                padding: 8px 6px;
                border-radius: 8px;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
              ">
                Book Slot →
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => {
          if (onSelectCharger) {
            onSelectCharger(c);
          }
        });

        markersRef.current[c.chargerId] = marker;
      });

      // Re-render user marker if coordinates are known
      if (currentUserCoords) {
        renderUserMarker(currentUserCoords.lat, currentUserCoords.lng);
      }

      // Initial fit bounds
      if (chargers.length > 0 && !selectedChargerId && !currentUserCoords) {
        const group = L.featureGroup(Object.values(markersRef.current));
        map.fitBounds(group.getBounds().pad(0.1));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [chargers, center, zoom, onSelectCharger, selectedChargerId, currentUserCoords, renderUserMarker]);

  // Handle selected charger fly-to and distance route line
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clean up existing route polyline and midpoint badge
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (distanceBadgeMarkerRef.current) {
      distanceBadgeMarkerRef.current.remove();
      distanceBadgeMarkerRef.current = null;
    }

    if (!selectedChargerId) return;

    const marker = markersRef.current[selectedChargerId];
    const selected = chargers.find((c) => c.chargerId === selectedChargerId);

    if (marker) {
      marker.openPopup();
    }

    // If both user location and selected charger exist, draw dynamic route line and badge!
    if (currentUserCoords && selected) {
      const userLatLng: [number, number] = [currentUserCoords.lat, currentUserCoords.lng];
      const chargerLatLng: [number, number] = [selected.latitude, selected.longitude];
      const dist = calculateDistanceKm(userLatLng[0], userLatLng[1], chargerLatLng[0], chargerLatLng[1]);
      const driveMinutes = Math.max(3, Math.round(dist * 2.5));

      // Draw dashed emerald route polyline
      const line = L.polyline([userLatLng, chargerLatLng], {
        color: "#006c49",
        weight: 3.5,
        dashArray: "8, 10",
        opacity: 0.9,
      }).addTo(map);

      // Midpoint badge
      const midLat = (userLatLng[0] + chargerLatLng[0]) / 2;
      const midLng = (userLatLng[1] + chargerLatLng[1]) / 2;

      const badgeIcon = L.divIcon({
        className: "voltloop-distance-mid-badge",
        html: `
          <div style="
            background: #006c49;
            color: #ffffff;
            padding: 5px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            font-family: Inter, system-ui, sans-serif;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
            border: 2px solid #ffffff;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
          ">
            <span>⚡ ${dist} km</span>
            <span style="opacity: 0.85; font-weight: 500; font-size: 10px;">(~${driveMinutes}m)</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const badgeMarker = L.marker([midLat, midLng], {
        icon: badgeIcon,
        interactive: false,
        zIndexOffset: 1200,
      }).addTo(map);

      polylineRef.current = line;
      distanceBadgeMarkerRef.current = badgeMarker;

      // Fit bounds to show both user and charger
      map.fitBounds([userLatLng, chargerLatLng], {
        padding: [80, 80],
        maxZoom: 15,
      });
    } else if (marker) {
      const latlng = marker.getLatLng();
      map.flyTo(latlng, 14, { duration: 1.2 });
    }
  }, [selectedChargerId, currentUserCoords, chargers]);

  // Sync external user location if passed
  useEffect(() => {
    if (externalUserLocation && mapInstanceRef.current) {
      renderUserMarker(externalUserLocation.lat, externalUserLocation.lng);
    }
  }, [externalUserLocation, renderUserMarker]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#dde4dd] shadow-sm bg-white">
      {/* Pulse Animation Style Tag */}
      <style jsx global>{`
        @keyframes voltloop-pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.6);
            opacity: 0.15;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />

      {/* Map Legend Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#dde4dd] flex items-center gap-4 text-xs font-semibold text-[#161d19] shadow-sm pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
          <span>Limited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
          <span>Booked</span>
        </div>
      </div>

      {/* Current Location Interactive Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2 pointer-events-auto">
        {/* Main "Locate Me" Button */}
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Find chargers near my current location"
          className={`group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-bold text-xs shadow-md backdrop-blur-md transition-all duration-200 ${
            currentUserCoords
              ? "bg-[#006c49] text-white border-[#005236] hover:bg-[#005236]"
              : "bg-white/95 text-[#161d19] border-[#dde4dd] hover:bg-[#eef6ee] hover:text-[#006c49]"
          }`}
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#006c49]" />
              <span className="hidden sm:inline">Detecting GPS...</span>
            </>
          ) : currentUserCoords ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping absolute" />
                <LocateFixed className="w-4 h-4 text-white relative" />
              </div>
              <span>Recenter on Me</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-[#006c49] group-hover:rotate-45 transition-transform" />
              <span>Current Location</span>
            </>
          )}
        </button>

        {/* View All Chargers Button (Only when location is locked or zoomed) */}
        {currentUserCoords && (
          <button
            onClick={handleFitAllChargers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-[#3c4a42] hover:text-[#161d19] border border-[#dde4dd] text-[11px] font-semibold shadow-sm backdrop-blur-md hover:bg-[#eef6ee] transition"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#006c49]" />
            <span>Show All Chargers</span>
          </button>
        )}
      </div>

      {/* Floating Selected Charger Card (Bottom Left) */}
      {selectedCharger && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-[400] max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md border border-[#dde4dd] rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#eef6ee] text-[#006c49] border border-[#c2e2c8]">
                  ⚡ {selectedCharger.powerKw} kW AC
                </span>
                {currentUserCoords && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#006c49] text-white flex items-center gap-1 shadow-sm">
                    <Navigation className="w-2.5 h-2.5" />
                    {calculateDistanceKm(
                      currentUserCoords.lat,
                      currentUserCoords.lng,
                      selectedCharger.latitude,
                      selectedCharger.longitude
                    )}{" "}
                    km away
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-[#161d19] truncate">
                {selectedCharger.title}
              </h4>
              <p className="text-xs text-[#3c4a42] truncate">
                {selectedCharger.address}, {selectedCharger.city}
              </p>
            </div>
            <button
              onClick={() => onSelectCharger?.(null)}
              className="w-6 h-6 rounded-full bg-[#eef6ee] text-[#3c4a42] hover:text-[#161d19] flex items-center justify-center text-xs font-bold shrink-0"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#dde4dd]">
            <div>
              <strong className="text-sm font-black text-[#161d19]">
                ₹{selectedCharger.electricityRate}
              </strong>
              <span className="text-xs text-[#3c4a42]">/kWh</span>
            </div>
            <div className="flex items-center gap-2">
              {currentUserCoords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${currentUserCoords.lat},${currentUserCoords.lng}&destination=${selectedCharger.latitude},${selectedCharger.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#006c49] text-xs font-bold transition flex items-center gap-1 border border-[#c2e2c8]"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Directions</span>
                </a>
              )}
              <a
                href={`/charger/${selectedCharger.chargerId}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <span>Book Slot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Feedback / Error Toast Banner */}
      {locationError && (
        <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-16 z-[400] max-w-sm bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl shadow-lg flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">GPS Location Unavailable</strong>
            <p className="text-[11px] text-rose-700 mt-0.5">{locationError}</p>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
