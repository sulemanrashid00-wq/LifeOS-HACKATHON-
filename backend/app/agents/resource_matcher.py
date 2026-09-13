import math
from typing import List, Dict, Optional, Tuple

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def score_and_match(lat: float, lng: float, requires_trauma: bool, hospitals: List[Dict], exclude_ids: List[str] = []) -> Tuple[Optional[Dict], List[Dict]]:
    best_match = None
    best_score = -float('inf')
    rejected = []
    
    for h in hospitals:
        if h["id"] in exclude_ids:
            rejected.append({"name": h["name"], "reason": "Capacity Overloaded / Gridlock"})
            continue
            
        if requires_trauma and not h.get("trauma_capable", False):
            rejected.append({"name": h["name"], "reason": "No Level-1 Trauma Capability"})
            continue
        if h.get("icu_beds_free", 0) <= 0:
            rejected.append({"name": h["name"], "reason": "Zero ICU Beds Available"})
            continue
            
        dist_km = haversine(lat, lng, h["lat"], h["lng"])
        cap_score = 1.0 if h.get("trauma_capable") else 0.5
        eta_score = max(0.0, 1.0 - (dist_km / 30.0))
        icu_score = min(1.0, h.get("icu_beds_free", 0) / 10.0)
        
        # Breakdown requested by judges
        total_score = (cap_score * 0.45) + (eta_score * 0.35) + (icu_score * 0.20)
        
        if total_score > best_score:
            best_score = total_score
            best_match = h.copy()
            best_match["math_breakdown"] = f"Score = (Cap*{cap_score:.2f}*0.45) + (ETA*{eta_score:.2f}*0.35) + (ICU*{icu_score:.2f}*0.20)"
            best_match["rationale"] = f"Final Score: {total_score:.3f}"
            best_match["eta"] = max(1, int(dist_km * 1.5))
            
    return best_match, rejected
