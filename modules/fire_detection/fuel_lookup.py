"""LANDFIRE fuel category to simplified base spread rate (chains/hour, NWCG-style tables)."""

from __future__ import annotations

_BASE_RATES_CHAINS_PER_HR = {
    "grass": 78,
    "shrub": 35,
    "timber_litter": 8,
    "slash": 15,
}


def base_rate_chains_per_hour(fuel_type: str) -> float:
    return float(_BASE_RATES_CHAINS_PER_HR.get(fuel_type, 20))


def fuel_type_from_landfire_code(code: int | None) -> str:
    """
    Without a local GeoTIFF, map coarse LANDFIRE EVT codes to fuel families.
    Fallback is chaparral-heavy shrub for San Diego County demos.
    """
    if code is None:
        return "shrub"
    # Minimal numeric buckets — expand when raster sampling is wired up.
    if code <= 100:
        return "grass"
    if code <= 300:
        return "shrub"
    if code <= 900:
        return "timber_litter"
    return "slash"
