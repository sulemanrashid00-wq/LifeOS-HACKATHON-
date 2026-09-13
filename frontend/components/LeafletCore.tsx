'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

const incidentIconNormal = L.divIcon({ className: 'custom-icon', html: `<div class="w-4 h-4 bg-[#00e676] rounded-full shadow-[0_0_10px_#00e676]"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
const incidentIconActive = L.divIcon({ className: 'custom-icon', html: `<div class="relative flex items-center justify-center w-8 h-8"><div class="absolute w-4 h-4 bg-[#ff1744] rounded-full glow-crimson"></div><div class="absolute w-10 h-10 border-2 border-[#ff1744] rounded-full animate-ping opacity-75"></div><div class="absolute w-16 h-16 border border-[#ff1744] rounded-full animate-[ping_2s_linear_infinite] opacity-30"></div></div>`, iconSize: [64, 64], iconAnchor: [32, 32] });
const hospitalIcon = (color: string) => L.divIcon({ className: 'custom-icon', html: `<div class="relative flex flex-col items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" class="drop-shadow-[0_0_8px_${color}]"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon></svg><div class="absolute w-2 h-2 bg-[${color}] rounded-full"></div></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });

// Animated Ambulance SVG with dynamic rotation support
const ambulanceIcon = (rotation: number) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="transform: rotate(${rotation}deg); transition: transform 0.1s linear;" class="w-8 h-8 flex items-center justify-center drop-shadow-[0_0_10px_#ff9100]">
           <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff9100" opacity="0.9">
             <path d="M12 2L2 22h20L12 2z"/>
           </svg>
         </div>`,
  iconSize: [32, 32], iconAnchor: [16, 16]
});

function MapUpdater({ center, target }: { center: [number, number], target: [number, number] | null }) {
  const map = useMap();
  const prevTargetRef = useRef<string>('');

  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 150);
  }, [map]);

  useEffect(() => {
    const tStr = target ? `${target[0]},${target[1]}` : 'none';
    if (prevTargetRef.current !== tStr) {
      if (target) {
        map.flyToBounds(L.latLngBounds([center, target]), { padding: [100, 100], duration: 1.5 });
      } else {
        map.flyTo(center, 13, { duration: 1.5 });
      }
      prevTargetRef.current = tStr;
    }
  }, [center, target, map]);
  return null;
}

export default function LeafletCore({ state }: { state: any }) {
  const center: [number, number] = [state.telemetry.lat, state.telemetry.lng];
  const isEmergency = state.status !== 'NORMAL' && state.status !== 'SUSPICIOUS';
  
  let targetCoords: [number, number] | null = null;
  let polyColor = '#00f0ff';
  let hospColorB = '#475569';
  let hospColorC = '#475569';
  let radarColor = '#00e676';

  if (state.allocation?.target_hospital === "Jinnah Trauma Center (Hospital B)") {
     targetCoords = [24.8530, 67.0450];
     polyColor = '#00f0ff';
     hospColorB = '#00e676';
     radarColor = '#ff1744';
  }
  if (state.allocation?.target_hospital === "Aga Khan University Hospital (Hospital C)") {
     targetCoords = [24.8920, 67.0740];
     polyColor = '#00e676'; 
     hospColorB = '#ff1744'; 
     hospColorC = '#00e676';
     radarColor = '#ff1744';
  }

  const cliftonCoords: [number, number] = [24.8250, 67.0300];
  const jinnahCoords: [number, number] = [24.8530, 67.0450];
  const agaKhanCoords: [number, number] = [24.8920, 67.0740];

  // Kinematic GPS interpolation
  const [ambPos, setAmbPos] = useState<[number, number] | null>(null);
  const [ambRot, setAmbRot] = useState(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (targetCoords) {
      // Start moving from origin to target
      let startPos = center;
      
      // If we re-planned, start from current intermediate position
      if (ambPos && state.plan_version > 1) {
         startPos = ambPos;
         progressRef.current = 0; // reset local progress to new target
      } else {
         progressRef.current = 0;
      }

      const endPos = targetCoords;
      const duration = 15000; // 15 seconds to drive the route
      let startTime: number | null = null;

      const dy = endPos[0] - startPos[0];
      const dx = endPos[1] - startPos[1];
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI; // Geographic bearing
      setAmbRot(angle);

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        let t = elapsed / duration;
        if (t > 1) t = 1;

        const currentLat = startPos[0] + (endPos[0] - startPos[0]) * t;
        const currentLng = startPos[1] + (endPos[1] - startPos[1]) * t;
        
        setAmbPos([currentLat, currentLng]);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
      
      return () => {
         if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      setAmbPos(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCoords?.[0], targetCoords?.[1], state.plan_version]);

  return (
    <MapContainer center={center} zoom={13} zoomControl={false} className="w-full h-full rounded-lg bg-[#030712]">
      <TileLayer 
        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
        subdomains={['a', 'b', 'c', 'd']}
        attribution="&copy; CartoDB"
      />
      
      {isEmergency && (
        <Circle center={center} radius={1800} pathOptions={{ color: radarColor, fillColor: radarColor, fillOpacity: 0.05 }} className="animate-[ping_4s_linear_infinite]" />
      )}
      
      <Marker position={cliftonCoords} icon={hospitalIcon('#475569')} />
      <Marker position={jinnahCoords} icon={hospitalIcon(hospColorB)} />
      <Marker position={agaKhanCoords} icon={hospitalIcon(hospColorC)} />
      
      <Marker position={center} icon={isEmergency ? incidentIconActive : incidentIconNormal} />
      
      {targetCoords && (
        <Polyline 
          positions={[center, targetCoords]} 
          color={polyColor} 
          weight={3} 
          dashArray="15, 15" 
          className="opacity-90 animate-[dash_1s_linear_infinite] transition-colors duration-1000" 
        />
      )}
      
      {/* Animated Ambulance driving along route */}
      {ambPos && (
        <Marker position={ambPos} icon={ambulanceIcon(ambRot)} zIndexOffset={1000} />
      )}

      <MapUpdater center={center} target={targetCoords} />
    </MapContainer>
  );
}