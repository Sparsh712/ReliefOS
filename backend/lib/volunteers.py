"""
lib/volunteers.py — Mock volunteer team matching.

Loads volunteers from data/volunteers.json and selects the best micro-team
based on required skills, area proximity, availability, and current load.
"""

import json
from pathlib import Path

from models import Volunteer, Intervention

_DATA_PATH = Path(__file__).parent.parent / "data" / "volunteers.json"


def _load_volunteers() -> list[Volunteer]:
    if _DATA_PATH.exists():
        with open(_DATA_PATH, encoding="utf-8") as f:
            return [Volunteer(**v) for v in json.load(f)]
    return _default_volunteers()


def select_team(ward: str, intervention: Intervention) -> list[Volunteer]:
    """
    Select a micro-team of 2–4 volunteers best suited for the intervention.

    Matching priority:
      1. Available volunteers only
      2. Skill match with intervention team_composition
      3. Same ward (area proximity)
      4. Lowest current_load
    """
    all_volunteers = _load_volunteers()
    available = [v for v in all_volunteers if v.available]
    required_skills = set(intervention.team_composition)
    ward_lower = ward.lower()

    def score(v: Volunteer) -> float:
        skill_match = len(required_skills & set(v.skills)) / max(len(required_skills), 1)
        area_bonus = 1.0 if ward_lower in v.area.lower() else 0.0
        load_penalty = v.current_load / 10.0
        return skill_match + area_bonus - load_penalty

    ranked = sorted(available, key=score, reverse=True)
    # Select top 3, ensuring we cover at least some required skills
    return ranked[:3]


def _default_volunteers() -> list[Volunteer]:
    """Fallback in-memory volunteer list (from claude.md)."""
    return [
        Volunteer(name="Aisha",  skills=["medical", "community"],     area="Rohini",     available=True, language="Hindi", current_load=1),
        Volunteer(name="Rohan",  skills=["logistics", "field_ops"],   area="Dwarka",     available=True, language="Hindi", current_load=0),
        Volunteer(name="Nisha",  skills=["awareness", "community"],   area="Seelampur",  available=True, language="Hindi", current_load=2),
        Volunteer(name="Faizan", skills=["medical"],                  area="Laxmi Nagar",available=True, language="Hindi", current_load=0),
        Volunteer(name="Kabir",  skills=["sanitation", "field_ops"],  area="Najafgarh",  available=True, language="Hindi", current_load=1),
        Volunteer(name="Priya",  skills=["awareness", "medical"],     area="Rohini",     available=True, language="Hindi", current_load=0),
        Volunteer(name="Suresh", skills=["sanitation", "logistics"],  area="Seelampur",  available=True, language="Hindi", current_load=1),
        Volunteer(name="Meena",  skills=["community", "field_ops"],   area="Dwarka",     available=True, language="Hindi", current_load=0),
    ]
