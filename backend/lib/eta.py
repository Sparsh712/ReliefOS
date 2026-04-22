"""
lib/eta.py — Mocked ETA computation for volunteer deployment.

Uses simple distance-tier logic based on area name matching.
Swap out _compute_mocked_eta() for a Routes API call when a key is available.

ETA tiers:
  Same ward:      15 minutes
  Adjacent ward:  25 minutes
  Distant ward:   40 minutes
"""

from models import Volunteer

# Adjacency map for Delhi wards used in the demo
_ADJACENT_WARDS: dict[str, set[str]] = {
    "rohini":        {"dwarka", "najafgarh"},
    "dwarka":        {"rohini", "najafgarh"},
    "seelampur":     {"laxmi nagar"},
    "laxmi nagar":   {"seelampur"},
    "najafgarh":     {"rohini", "dwarka"},
}


def compute_eta(team: list[Volunteer], target_ward: str) -> tuple[int, str]:
    """
    Return (eta_minutes, route_summary) for the given team deploying to target_ward.
    Uses the volunteer closest to the target ward to set the ETA.
    """
    if not team:
        return 40, "No volunteers assigned — ETA unknown"

    target = target_ward.lower().strip()
    min_eta = 40
    closest_volunteer = team[0]

    for volunteer in team:
        vol_area = volunteer.area.lower().strip()
        eta = _compute_mocked_eta(vol_area, target)
        if eta < min_eta:
            min_eta = eta
            closest_volunteer = volunteer

    route_summary = _build_route_summary(closest_volunteer, target_ward, min_eta)
    return min_eta, route_summary


def _compute_mocked_eta(volunteer_area: str, target_ward: str) -> int:
    """
    Compute ETA in minutes based on area proximity.
    """
    if volunteer_area == target_ward:
        return 15
    if target_ward in _ADJACENT_WARDS.get(volunteer_area, set()):
        return 25
    return 40


def _build_route_summary(volunteer: Volunteer, target_ward: str, eta: int) -> str:
    tier = "same ward" if eta == 15 else ("adjacent ward" if eta == 25 else "cross-city")
    return (
        f"{volunteer.name} ({volunteer.area}) → {target_ward} via {tier} route. "
        f"Estimated arrival: {eta} minutes."
    )
