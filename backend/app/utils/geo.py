import math


def calculate_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in meters between two WGS84 coordinates using Haversine formula."""
    radius_earth_m = 6371000.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_earth_m * c


