"""
Knowledge Graph Setup/seed.py
-------------------------------
Idempotent seed script – populates (or re-populates) the Neo4j knowledge graph
with the approved demo dataset.

Safe defaults
-------------
- Uses MERGE for all nodes and relationships: calling the script multiple times
  will NOT create duplicate nodes or relationships.
- Destructive reset (delete all existing data) requires the explicit flag
  ``--reset``.  Without the flag the seed is purely additive.

Run
---
    # Safe default – add/update without deleting existing data
    python seed.py

    # Explicit destructive reset before seeding
    python seed.py --reset

Pre-requisites
--------------
- Neo4j running (docker compose up -d neo4j  OR  local install)
- .env filled in (copy from .env.example)
"""

from __future__ import annotations

import sys
from graph_service import GraphService
from rich.console import Console
from rich.table import Table

console = Console()

# ===========================================================================
# ① RAW DATA  (canonical IDs aligned with Tatvik's schema)
# ===========================================================================

LOCATIONS = [
    {"location_id": "LOC-001", "name": "Plant A – Floor 1", "building": "A", "floor": 1},
    {"location_id": "LOC-002", "name": "Plant A – Floor 2", "building": "A", "floor": 2},
    {"location_id": "LOC-003", "name": "Plant B – Outdoor", "building": "B", "floor": 0},
]

SUPPLIERS = [
    {"supplier_id": "SUP-001", "name": "AlphaSeals Ltd",    "country": "Germany", "rating": 4.5},
    {"supplier_id": "SUP-002", "name": "BetaBearings Inc",  "country": "USA",     "rating": 3.8},
    {"supplier_id": "SUP-003", "name": "GammaFluids Co",    "country": "India",   "rating": 4.1},
    {"supplier_id": "SUP-004", "name": "DeltaMotors GmbH",  "country": "Germany", "rating": 4.7},
    {"supplier_id": "SUP-005", "name": "EpsilonValves Ltd", "country": "UK",      "rating": 2.9},  # ← hidden pattern: low-rated
]

EQUIPMENT = [
    {
        "equipment_id": "EQ-001",
        "name":         "Centrifugal Pump P-101",
        "type":         "Pump",
        "model":        "CP-3500X",
        "manufacturer": "FlowTech",
        "status":       "operational",
        "install_date": "2020-03-15",
        "criticality":  "high",
        "location_id":  "LOC-001",
    },
    {
        "equipment_id": "EQ-002",
        "name":         "Heat Exchanger HX-202",
        "type":         "Heat Exchanger",
        "model":        "HX-2000",
        "manufacturer": "ThermoCore",
        "status":       "operational",
        "install_date": "2019-07-22",
        "criticality":  "medium",
        "location_id":  "LOC-001",
    },
    {
        "equipment_id": "EQ-003",
        "name":         "Compressor C-305",
        "type":         "Compressor",
        "model":        "RC-750",
        "manufacturer": "AirForce Industrial",
        "status":       "maintenance",
        "install_date": "2021-01-10",
        "criticality":  "high",
        "location_id":  "LOC-002",
    },
    {
        "equipment_id": "EQ-004",
        "name":         "Conveyor Belt CB-410",
        "type":         "Conveyor",
        "model":        "CB-MAX",
        "manufacturer": "BeltMaster",
        "status":       "operational",
        "install_date": "2018-11-03",
        "criticality":  "low",
        "location_id":  "LOC-003",
    },
    {
        "equipment_id": "EQ-005",
        "name":         "Boiler BLR-501",
        "type":         "Boiler",
        "model":        "SB-1200",
        "manufacturer": "SteamPro",
        "status":       "operational",
        "install_date": "2017-06-18",
        "criticality":  "critical",
        "location_id":  "LOC-002",
    },
]

# 12 components (3 per EQ-001, 2 per EQ-002, 3 per EQ-003, 2 per EQ-004, 2 per EQ-005)
COMPONENTS = [
    # EQ-001 · Pump P-101
    {"component_id": "CMP-001", "name": "Mechanical Seal",     "type": "Seal",    "equipment_id": "EQ-001", "supplier_id": "SUP-001"},
    {"component_id": "CMP-002", "name": "Drive Shaft Bearing", "type": "Bearing", "equipment_id": "EQ-001", "supplier_id": "SUP-002"},
    {"component_id": "CMP-003", "name": "Impeller",            "type": "Rotor",   "equipment_id": "EQ-001", "supplier_id": "SUP-003"},

    # EQ-002 · Heat Exchanger HX-202
    {"component_id": "CMP-004", "name": "Tube Bundle",         "type": "Tube",    "equipment_id": "EQ-002", "supplier_id": "SUP-003"},
    {"component_id": "CMP-005", "name": "Shell Gasket",        "type": "Seal",    "equipment_id": "EQ-002", "supplier_id": "SUP-005"},  # ← low-rated

    # EQ-003 · Compressor C-305
    {"component_id": "CMP-006", "name": "Inlet Valve",         "type": "Valve",   "equipment_id": "EQ-003", "supplier_id": "SUP-005"},  # ← low-rated
    {"component_id": "CMP-007", "name": "Rotor Assembly",      "type": "Rotor",   "equipment_id": "EQ-003", "supplier_id": "SUP-004"},
    {"component_id": "CMP-008", "name": "Piston Ring",         "type": "Ring",    "equipment_id": "EQ-003", "supplier_id": "SUP-002"},

    # EQ-004 · Conveyor Belt CB-410
    {"component_id": "CMP-009", "name": "Drive Motor",         "type": "Motor",   "equipment_id": "EQ-004", "supplier_id": "SUP-004"},
    {"component_id": "CMP-010", "name": "Belt Tensioner",      "type": "Tensioner","equipment_id": "EQ-004", "supplier_id": "SUP-002"},

    # EQ-005 · Boiler BLR-501
    {"component_id": "CMP-011", "name": "Safety Valve",        "type": "Valve",   "equipment_id": "EQ-005", "supplier_id": "SUP-005"},  # ← low-rated
    {"component_id": "CMP-012", "name": "Steam Drum",          "type": "Vessel",  "equipment_id": "EQ-005", "supplier_id": "SUP-001"},
]

# 5 failure modes
FAILURE_MODES = [
    {"failure_mode_id": "FM-001", "name": "Seal Leakage",         "severity": "high",     "description": "Fluid leakage through degraded seals"},
    {"failure_mode_id": "FM-002", "name": "Bearing Overheating",  "severity": "medium",   "description": "Excess heat from bearing friction"},
    {"failure_mode_id": "FM-003", "name": "Cavitation",           "severity": "high",     "description": "Formation and collapse of vapour bubbles in pump"},
    {"failure_mode_id": "FM-004", "name": "Valve Seizure",        "severity": "critical", "description": "Valve jams in open or closed position"},
    {"failure_mode_id": "FM-005", "name": "Tube Fouling",         "severity": "medium",   "description": "Scaling and deposits reducing heat transfer"},
]

# Component → FailureMode risk links  (7 total PRONE_TO relationships)
COMPONENT_FAILURE_LINKS = [
    ("CMP-001", "FM-001"),  # Mechanical Seal  → Seal Leakage
    ("CMP-002", "FM-002"),  # Drive Shaft Bearing → Bearing Overheating
    ("CMP-003", "FM-003"),  # Impeller → Cavitation
    ("CMP-004", "FM-005"),  # Tube Bundle → Tube Fouling
    ("CMP-005", "FM-001"),  # Shell Gasket (EpsilonValves) → Seal Leakage
    ("CMP-006", "FM-004"),  # Inlet Valve (EpsilonValves) → Valve Seizure
    ("CMP-011", "FM-004"),  # Safety Valve (EpsilonValves) → Valve Seizure
]


# ===========================================================================
# ② SEED FUNCTION (idempotent via MERGE)
# ===========================================================================

def seed(svc: GraphService) -> None:
    """Populate the graph idempotently.  Uses MERGE so it is safe to repeat."""
    svc.create_constraints_and_indexes()

    # ── Locations ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 1 · Locations[/bold cyan]")
    for loc in LOCATIONS:
        svc.merge_node("Location", "location_id", loc["location_id"], loc)
    console.print(f"  ✅ {len(LOCATIONS)} Location nodes")

    # ── Suppliers ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 2 · Suppliers[/bold cyan]")
    for sup in SUPPLIERS:
        svc.merge_node("Supplier", "supplier_id", sup["supplier_id"], sup)
    console.print(f"  ✅ {len(SUPPLIERS)} Supplier nodes")

    # ── Equipment ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 3 · Equipment[/bold cyan]")
    for eq in EQUIPMENT:
        props = {k: v for k, v in eq.items() if k != "location_id"}
        svc.merge_node("Equipment", "equipment_id", eq["equipment_id"], props)
    console.print(f"  ✅ {len(EQUIPMENT)} Equipment nodes")

    # ── Equipment → Location ───────────────────────────────────────────────
    console.rule("[bold cyan]Step 4 · Equipment LOCATED_AT Location[/bold cyan]")
    for eq in EQUIPMENT:
        svc.merge_relationship(
            "Equipment", "equipment_id", eq["equipment_id"],
            "LOCATED_AT",
            "Location",  "location_id",  eq["location_id"],
        )
    console.print(f"  ✅ {len(EQUIPMENT)} LOCATED_AT relationships")

    # ── Components ─────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 5 · Components + HAS_COMPONENT + SUPPLIED_BY[/bold cyan]")
    for cmp in COMPONENTS:
        props = {k: v for k, v in cmp.items() if k not in ("equipment_id", "supplier_id")}
        svc.merge_node("Component", "component_id", cmp["component_id"], props)
        svc.merge_relationship(
            "Equipment", "equipment_id", cmp["equipment_id"],
            "HAS_COMPONENT",
            "Component", "component_id", cmp["component_id"],
        )
        svc.merge_relationship(
            "Component", "component_id", cmp["component_id"],
            "SUPPLIED_BY",
            "Supplier",  "supplier_id",  cmp["supplier_id"],
        )
    console.print(f"  ✅ {len(COMPONENTS)} Component nodes + relationships")

    # ── Failure Modes ──────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 6 · FailureMode nodes[/bold cyan]")
    for fm in FAILURE_MODES:
        svc.merge_node("FailureMode", "failure_mode_id", fm["failure_mode_id"], fm)
    console.print(f"  ✅ {len(FAILURE_MODES)} FailureMode nodes")

    # ── PRONE_TO links ─────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 7 · Component PRONE_TO FailureMode[/bold cyan]")
    for cmp_id, fm_id in COMPONENT_FAILURE_LINKS:
        svc.merge_relationship(
            "Component",   "component_id",    cmp_id,
            "PRONE_TO",
            "FailureMode", "failure_mode_id", fm_id,
        )
    console.print(f"  ✅ {len(COMPONENT_FAILURE_LINKS)} PRONE_TO relationships")

    # ── SIMILAR_TO ─────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 8 · Equipment SIMILAR_TO Equipment[/bold cyan]")
    similar_pairs = [
        ("EQ-001", "EQ-005"),  # both have pump/boiler components
        ("EQ-002", "EQ-003"),  # both use SUP-005 (low-rated)
    ]
    for a, b in similar_pairs:
        svc.merge_relationship(
            "Equipment", "equipment_id", a,
            "SIMILAR_TO",
            "Equipment", "equipment_id", b,
        )
    console.print(f"  ✅ {len(similar_pairs)} SIMILAR_TO relationships")


# ===========================================================================
# ③ SUMMARY REPORT
# ===========================================================================

def print_summary(svc: GraphService) -> None:
    summary = svc.graph_summary()

    console.rule("[bold green]Graph Summary[/bold green]")
    console.print(f"  Total nodes         : [bold]{summary['total_nodes']}[/bold]")
    console.print(f"  Total relationships : [bold]{summary['total_relationships']}[/bold]")

    table = Table(title="Nodes by Label", style="cyan")
    table.add_column("Label",  style="bold")
    table.add_column("Count",  justify="right")
    for label, count in summary["by_label"].items():
        table.add_row(label, str(count))
    console.print(table)

    console.rule("[bold green]Hidden Pattern – EpsilonValves Risk[/bold green]")
    rows = svc.run_query(
        """
        MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)-[:PRONE_TO]->(fm:FailureMode)
        RETURN s.name AS supplier, count(fm) AS failure_links, s.rating AS rating
        ORDER BY failure_links DESC
        """
    )
    risk_table = Table(title="Supplier → Failure Risk", style="red")
    risk_table.add_column("Supplier")
    risk_table.add_column("Failure Links", justify="right")
    risk_table.add_column("Rating",        justify="right")
    for r in rows:
        risk_table.add_row(r["supplier"], str(r["failure_links"]), str(r["rating"]))
    console.print(risk_table)


# ===========================================================================
# ④ ENTRYPOINT
# ===========================================================================

if __name__ == "__main__":
    reset = "--reset" in sys.argv

    if reset:
        console.rule("[bold red]DESTRUCTIVE RESET requested[/bold red]")
        console.print("  Deleting all nodes and relationships …")
    else:
        console.rule("[bold magenta]Industrial Brain – Knowledge Graph Seed (idempotent)[/bold magenta]")

    with GraphService() as svc:
        if reset:
            svc.run_query("MATCH (n) DETACH DELETE n")
            console.print("  ✅ Graph cleared")

        seed(svc)
        print_summary(svc)

    console.rule("[bold green]✅  Seeding complete![/bold green]")
