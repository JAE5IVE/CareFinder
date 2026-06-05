/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Hospital } from '../types';
import { calculateDistance } from '../utils/distance';
import { Navigation, MapPin, Target, RefreshCw, ZoomIn, Info } from 'lucide-react';
import { env, hasMapboxConfig } from '../lib/env';

interface MapContainerProps {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (id: string) => void;
  userLat: number | null;
  userLng: number | null;
  radius: number; // in km
  onUpdateUserCoords: (lat: number, lng: number) => void;
  onUpdateRadius: (r: number) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  userLat,
  userLng,
  radius,
  onUpdateUserCoords,
  onUpdateRadius,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);

  // Determine geographic bounding box for projection
  const bounds = useMemo(() => {
    // If we have data, use the data to compute bounds
    const coordsList = hospitals.map(h => ({ lat: h.latitude, lng: h.longitude }));
    if (userLat !== null && userLng !== null) {
      coordsList.push({ lat: userLat, lng: userLng });
    }

    if (coordsList.length === 0) {
      // Default Lagos bounds
      return {
        minLat: 6.4,
        maxLat: 6.6,
        minLng: 3.25,
        maxLng: 3.55,
      };
    }

    let minLat = Math.min(...coordsList.map(c => c.lat));
    let maxLat = Math.max(...coordsList.map(c => c.lat));
    let minLng = Math.min(...coordsList.map(c => c.lng));
    let maxLng = Math.max(...coordsList.map(c => c.lng));

    // Pad the bounds slightly so markers aren't on edge
    const latDiff = Math.max(maxLat - minLat, 0.05);
    const lngDiff = Math.max(maxLng - minLng, 0.05);

    return {
      minLat: minLat - latDiff * 0.25,
      maxLat: maxLat + latDiff * 0.25,
      minLng: minLng - lngDiff * 0.25,
      maxLng: maxLng + lngDiff * 0.25,
    };
  }, [hospitals, userLat, userLng]);

  // Dimension of SVG canvas
  const svgWidth = 600;
  const svgHeight = 400;

  // Convert GPS Coordinates to SVG X, Y
  const project = (lat: number, lng: number) => {
    const latRatio = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
    const lngRatio = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);

    // X is mapped to Longitude, Y is mapped to Latitude (inverted because SVG 0 is top)
    const x = lngRatio * svgWidth;
    const y = svgHeight - latRatio * svgHeight;

    return { x, y };
  };

  // Convert SVG X, Y back to GPS Coordinates (enables clicking map to set radius center)
  const unproject = (x: number, y: number) => {
    const lngRatio = x / svgWidth;
    const latRatio = (svgHeight - y) / svgHeight;

    const lat = bounds.minLat + latRatio * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + lngRatio * (bounds.maxLng - bounds.minLng);

    return {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
    };
  };

  // Geolocation detector
  const handleDetectLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onUpdateUserCoords(position.coords.latitude, position.coords.longitude);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Lagos center
          onUpdateUserCoords(6.4474, 3.4184);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      onUpdateUserCoords(6.4474, 3.4184);
      setIsLocating(false);
    }
  };

  const currentCenterProj = useMemo(() => {
    if (userLat === null || userLng === null) return null;
    return project(userLat, userLng);
  }, [userLat, userLng, bounds]);

  // Approximate SVG pixel radius for spatial feedback
  const pixelRadius = useMemo(() => {
    if (userLat === null || userLng === null || radius === 0) return 0;

    // Calculate dynamic pixel scale representing the selected KM radius
    // We sample a point exactly 'radius' distance north of the center
    const rLat = userLat + (radius / 111.1); // 1 degree lat is ~111km
    const p1 = project(userLat, userLng);
    const p2 = project(rLat, userLng);

    return Math.abs(p1.y - p2.y);
  }, [userLat, userLng, radius, bounds]);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const y = ((e.clientY - rect.top) / rect.height) * svgHeight;

    const coords = unproject(x, y);
    onUpdateUserCoords(coords.lat, coords.lng);
  };

  useEffect(() => {
    if (!hasMapboxConfig || !mapNodeRef.current || mapRef.current) return;
    mapboxgl.accessToken = env.mapboxAccessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLng ?? 3.4184, userLat ?? 6.4474],
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
  }, [userLat, userLng]);

  useEffect(() => {
    if (!hasMapboxConfig || !mapRef.current) return;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    hospitals
      .filter((hospital) => hospital.status === 'approved')
      .forEach((hospital) => {
        const marker = new mapboxgl.Marker({ color: hospital.ownership === 'public' ? '#10b981' : '#2563eb' })
          .setLngLat([hospital.longitude, hospital.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 18 }).setHTML(
              `<strong>${hospital.name}</strong><br/>${hospital.address}<br/>${hospital.rating.toFixed(1)} stars`
            )
          )
          .addTo(mapRef.current!);
        marker.getElement().addEventListener('click', () => onSelectHospital(hospital.id));
        markerRefs.current.push(marker);
      });

    if (userLat !== null && userLng !== null) {
      const userMarker = new mapboxgl.Marker({ color: '#f43f5e' })
        .setLngLat([userLng, userLat])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setText('Your search center'))
        .addTo(mapRef.current);
      markerRefs.current.push(userMarker);
      mapRef.current.easeTo({ center: [userLng, userLat], duration: 600 });
    }
  }, [hospitals, userLat, userLng, onSelectHospital]);

  if (hasMapboxConfig) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              Mapbox Hospital Map
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {userLat ? `Center: ${userLat.toFixed(4)}N, ${userLng?.toFixed(4)}E` : 'Use location or click a hospital marker'}
            </p>
          </div>
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 rounded-lg transition-colors disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting...' : 'Get Location'}
          </button>
        </div>
        <div ref={mapNodeRef} className="h-[420px] w-full" />
        <div className="p-4 bg-gray-50/20 dark:bg-gray-900/10">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex justify-between">
            <span>Spatial Search Radius:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{radius === 0 ? 'Disabled' : `${radius} km`}</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={radius}
            onChange={(e) => onUpdateRadius(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
      {/* Map Control Bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500 animate-pulse" />
            Interactive Spatial Map
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {userLat ? `Center: ${userLat.toFixed(4)}°N, ${userLng?.toFixed(4)}°E` : 'Click map to place your location'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 rounded-lg transition-colors disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Detecting...' : 'Get Location'}
          </button>
          
          <button
            onClick={() => onUpdateUserCoords(6.4474, 3.4184)} // Lagos
            className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Reset to Lagos"
          >
            Lagos
          </button>
          <button
            onClick={() => onUpdateUserCoords(9.0345, 7.4725)} // Abuja
            className="px-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Reset to Abuja"
          >
            Abuja
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative aspect-[3/2] w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <svg
          className="w-full h-full cursor-crosshair select-none"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onClick={handleMapClick}
        >
          {/* Spatial grid lines */}
          <g stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" strokeDasharray="4">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`lh-${i}`} x1="0" y1={(svgHeight / 12) * i} x2={svgWidth} y2={(svgHeight / 12) * i} />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`lv-${i}`} x1={(svgWidth / 18) * i} y1="0" x2={(svgWidth / 18) * i} y2={svgHeight} />
            ))}
          </g>

          {/* Connected lines to hospitals within radius */}
          {currentCenterProj && radius > 0 && hospitals.map(h => {
            if (userLat === null || userLng === null) return null;
            const dist = calculateDistance(userLat, userLng, h.latitude, h.longitude);
            if (dist <= radius && h.status === 'approved') {
              const hProj = project(h.latitude, h.longitude);
              return (
                <line
                  key={`line-${h.id}`}
                  x1={currentCenterProj.x}
                  y1={currentCenterProj.y}
                  x2={hProj.x}
                  y2={hProj.y}
                  stroke="rgba(37, 99, 235, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                  className="animate-dash"
                />
              );
            }
            return null;
          })}

          {/* Search Radius Ring around user */}
          {currentCenterProj && radius > 0 && (
            <g>
              {/* Outer pulsing shadow ring */}
              <circle
                cx={currentCenterProj.x}
                cy={currentCenterProj.y}
                r={pixelRadius}
                fill="rgba(37, 99, 235, 0.03)"
                stroke="rgba(37, 99, 235, 0.25)"
                strokeWidth="1"
              />
              <circle
                cx={currentCenterProj.x}
                cy={currentCenterProj.y}
                r={pixelRadius}
                fill="none"
                stroke="rgba(37, 99, 235, 0.15)"
                strokeWidth="5"
                className="opacity-50"
              />
            </g>
          )}

          {/* Hospital markers */}
          {hospitals.map((h) => {
            const { x, y } = project(h.latitude, h.longitude);
            const isSelected = h.id === selectedHospitalId;
            const isHovered = h.id === hoveredId;
            const inRadius = userLat && userLng && radius > 0 
              ? calculateDistance(userLat, userLng, h.latitude, h.longitude) <= radius
              : false;

            if (h.status !== 'approved') return null;

            return (
              <g
                key={h.id}
                onMouseEnter={() => setHoveredId(h.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectHospital(h.id);
                }}
                className="cursor-pointer"
              >
                {/* Outer halo highlight */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill={isSelected ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.08)'}
                    stroke={isSelected ? 'rgba(79, 70, 229, 0.3)' : 'rgba(99, 102, 241, 0.15)'}
                    strokeWidth="1"
                  />
                )}

                {/* Base circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5.5}
                  fill={
                    isSelected
                      ? '#4f46e5'
                      : h.ownership === 'public'
                      ? '#10b981' // Green for public
                      : '#3b82f6' // Blue for private
                  }
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-200 hover:scale-125"
                />

                {/* Star center for top rated */}
                {h.rating >= 4.5 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={1.8}
                    fill="#ffffff"
                  />
                )}
              </g>
            );
          })}

          {/* User Location Node */}
          {currentCenterProj && (
            <g className="pointer-events-none">
              {/* Animated outer waves */}
              <circle
                cx={currentCenterProj.x}
                cy={currentCenterProj.y}
                r={16}
                fill="none"
                stroke="rgba(244, 63, 94, 0.3)"
                strokeWidth="3"
                className="animate-ping"
                style={{ transformOrigin: `${currentCenterProj.x}px ${currentCenterProj.y}px`, animationDuration: '3s' }}
              />
              {/* Marker pin shape or target */}
              <circle
                cx={currentCenterProj.x}
                cy={currentCenterProj.y}
                r={7}
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={currentCenterProj.x}
                cy={currentCenterProj.y}
                r={2}
                fill="#ffffff"
              />
            </g>
          )}
        </svg>

        {/* Map Float Info Card */}
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px] space-y-1 shadow-sm max-w-[200px]">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white block" />
            <span>Public Hospitals</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white block" />
            <span>Private Hospitals</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white block" />
            <span>Your Position (Click map to move)</span>
          </div>
          <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 text-[10px] text-gray-400">
            <Info className="w-3 h-3 text-indigo-400" />
            <span>Click any marker to select</span>
          </div>
        </div>

        {/* Hover Popover Modal */}
        {hoveredId && (
          (() => {
            const h = hospitals.find(x => x.id === hoveredId);
            if (!h) return null;
            const { x, y } = project(h.latitude, h.longitude);
            // Dynamic placement so it doesn't get clipped
            const topOffset = y < 100 ? 15 : -70;
            const leftOffset = x > svgWidth - 120 ? -120 : -90;

            const dist = userLat && userLng ? calculateDistance(userLat, userLng, h.latitude, h.longitude) : null;

            return (
              <div
                style={{
                  position: 'absolute',
                  top: `${y + topOffset}px`,
                  left: `${x + leftOffset}px`,
                }}
                className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 px-3 py-2 rounded-lg shadow-lg z-30 pointer-events-none w-52"
              >
                <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{h.name}</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{h.address}, {h.city}</p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-gray-700 text-[10px]">
                  <span className="text-amber-500 font-medium font-mono">★ {h.rating.toFixed(1)} ({h.reviewCount})</span>
                  <span className="text-gray-400 uppercase font-semibold text-[9px]">{h.ownership}</span>
                </div>
                {dist !== null && (
                  <p className="text-[9px] text-indigo-500 dark:text-indigo-400 mt-0.5 text-right font-mono">
                    Distance: {dist} km
                  </p>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* Radius Adjust Slider Dashboard (Visual connection to PostGIS queries) */}
      <div className="p-4 bg-gray-50/20 dark:bg-gray-900/10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex justify-between">
            <span>Spatial Search Radius:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{radius === 0 ? 'Disabled' : `${radius} km`}</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={radius}
            onChange={(e) => onUpdateRadius(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0 km (All)</span>
            <span>10 km</span>
            <span>25 km</span>
            <span>50 km</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col justify-center bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800/60">
          <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-indigo-500" />
            Geography Mapping active
          </p>
          <p className="text-[11px] mt-0.5 leading-relaxed">
            Clicking anywhere on the coordinate plane repositions your simulated position. Only hospitals within the set radius will be highlighted.
          </p>
        </div>
      </div>
    </div>
  );
};
