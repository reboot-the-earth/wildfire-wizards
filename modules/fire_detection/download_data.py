"""
Pre-download helpers for LANDFIRE fuel GeoTIFF and USGS DEM (stub).

Run from repo root after `pip install -r modules/fire_detection/requirements.txt`.
Full raster sampling is optional; the spread model defaults fuel and slope when
files are absent.
"""

from __future__ import annotations

from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    data_dir = root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    print(f"Place LANDFIRE EVT and USGS DEM GeoTIFFs under: {data_dir}")
    print("Suggested filenames: landfire_evt_sd.tif, dem_sd.tif")
    print("Wire raster paths in fire_spread.get_fire_data when ready.")


if __name__ == "__main__":
    main()
