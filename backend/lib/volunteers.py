"""
lib/volunteers.py — Mock volunteer team matching.

Loads volunteers from data/volunteers.json and selects the best micro-team
based on required skills, area proximity, availability, and current load.
"""

import json
from pathlib import Path

from models import Volunteer, Intervention

_DATA_PATH = Path(__file__).parent.parent / "data" / "volunteers.json"
_PREFERRED_LANGUAGE = "hindi"

_ADJACENT_WARDS: dict[str, set[str]] = {
    "rohini": {"dwarka", "najafgarh"},
    "dwarka": {"rohini", "najafgarh"},
    "seelampur": {"laxmi nagar"},
    "laxmi nagar": {"seelampur"},
    "najafgarh": {"rohini", "dwarka"},
}


def _load_volunteers() -> list[Volunteer]:
    if _DATA_PATH.exists():
        with open(_DATA_PATH, encoding="utf-8") as f:
            return [Volunteer(**v) for v in json.load(f)]
    return _default_volunteers()


def select_team(ward: str, intervention: Intervention) -> list[Volunteer]:
    """
    Select a micro-team of 3–5 volunteers best suited for the intervention.

    Matching priority:
      1. Available volunteers only
      2. Skill match with intervention team_composition
      3. Same ward (area proximity)
      4. Lowest current_load
    """
    all_volunteers = _load_volunteers()
    available = [
        v
        for v in all_volunteers
        if v.availability and v.current_load < v.max_task_load
    ]
    language_filtered = [v for v in available if v.language.lower() == _PREFERRED_LANGUAGE]
    pool = language_filtered if language_filtered else available

    if not pool:
        return []

    required_skills = set(intervention.team_composition)
    ward_lower = ward.lower()

    def score(v: Volunteer) -> float:
        volunteer_skills = {s.lower() for s in v.skills}
        skill_match = len(required_skills & volunteer_skills) / max(len(required_skills), 1)
        proximity = _proximity_score(v.home_location.lower(), ward_lower)
        load_penalty = v.current_load / max(v.max_task_load, 1)
        return (skill_match * 0.6) + (proximity * 0.35) - (load_penalty * 0.25)

    ranked = sorted(pool, key=lambda v: (score(v), -v.current_load), reverse=True)

    selected: list[Volunteer] = []
    covered_skills: set[str] = set()

    for volunteer in ranked:
        volunteer_skills = {s.lower() for s in volunteer.skills}
        adds_coverage = bool((required_skills - covered_skills) & volunteer_skills)
        if len(selected) < 3 or adds_coverage:
            selected.append(volunteer)
            covered_skills.update(volunteer_skills)
        if len(selected) >= 5 or (len(selected) >= 3 and required_skills.issubset(covered_skills)):
            break

    while len(selected) < 3 and len(selected) < len(ranked):
        candidate = ranked[len(selected)]
        if candidate not in selected:
            selected.append(candidate)

    return selected


def _proximity_score(volunteer_ward: str, target_ward: str) -> float:
    if volunteer_ward == target_ward:
        return 1.0
    if target_ward in _ADJACENT_WARDS.get(volunteer_ward, set()):
        return 0.7
    return 0.3


def _default_volunteers() -> list[Volunteer]:
    """Fallback in-memory volunteer list (from claude.md)."""
    return [
        Volunteer(name="Aisha", skills=["medical", "community"], home_location="Rohini", availability=True, language="Hindi", current_load=1, max_task_load=3),
        Volunteer(name="Rohan", skills=["logistics", "field_ops"], home_location="Dwarka", availability=True, language="Hindi", current_load=0, max_task_load=3),
        Volunteer(name="Nisha", skills=["awareness", "community"], home_location="Seelampur", availability=True, language="Hindi", current_load=2, max_task_load=3),
        Volunteer(name="Faizan", skills=["medical"], home_location="Laxmi Nagar", availability=True, language="Hindi", current_load=0, max_task_load=3),
        Volunteer(name="Kabir", skills=["sanitation", "field_ops"], home_location="Najafgarh", availability=True, language="Hindi", current_load=1, max_task_load=3),
        Volunteer(name="Priya", skills=["awareness", "medical"], home_location="Rohini", availability=True, language="Hindi", current_load=0, max_task_load=3),
        Volunteer(name="Suresh", skills=["sanitation", "logistics"], home_location="Seelampur", availability=True, language="Hindi", current_load=1, max_task_load=3),
        Volunteer(name="Meena", skills=["community", "field_ops"], home_location="Dwarka", availability=True, language="Hindi", current_load=0, max_task_load=3),
    ]
