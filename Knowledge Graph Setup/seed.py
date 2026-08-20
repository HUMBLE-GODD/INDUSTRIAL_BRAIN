"""
seed.py
-------
Seed script: populates Neo4j with 5 sample industrial equipment,
their components, suppliers, locations, failure modes, and all
relevant relationships.

Run:
    python knowledge_graph/seed.py

Pre-requisites:
    - Neo4j running (docker compose up -d  OR  local install)
    - .env file filled in (copy from .env.example)
"""

from __future__ import annotations
from graph_service import GraphService
from rich.console import Console
from rich.table import Table

console = Console()

# ===========================================================================
# ① RAW DATA
# ===========================================================================

LOCATIONS = [
    {"location_id": "LOC-001", "name": "Plant A — Floor 1", "building": "A", "floor": 1},
    {"location_id": "LOC-002", "name": "Plant A — Floor 2", "building": "A", "floor": 2},
    {"location_id": "LOC-003", "name": "Plant B — Outdoor", "building": "B", "floor": 0},
]

SUPPLIERS = [
    {"supplier_id": "SUP-001", "name": "AlphaSeals Ltd",     "country": "Germany",  "rating": 4.5},
    {"supplier_id": "SUP-002", "name": "BetaBearings Inc",   "country": "USA",      "rating": 3.8},
    {"supplier_id": "SUP-003", "name": "GammaFluids Co",     "country": "India",    "rating": 4.1},
    {"supplier_id": "SUP-004", "name": "DeltaMotors GmbH",   "country": "Germany",  "rating": 4.7},
    {"supplier_id": "SUP-005", "name": "EpsilonValves Ltd",  "country": "UK",       "rating": 2.9},  # ← hidden pattern: low-rated
]

EQUIPMENT = [
    {
        "equipment_id": "EQ-001",
        "name":          "Centrifugal Pump P-101",
        "type":          "Pump",
        "model":         "CP-3500X",
        "manufacturer":  "FlowTech",
        "status":        "operational",
        "install_date":  "2020-03-15",
        "criticality":   "high",
        "location_id":   "LOC-001",
    },
    {
        "equipment_id": "EQ-002",
        "name":          "Heat Exchanger HX-202",
        "type":          "Heat Exchanger",
        "model":         "HX-2000",
        "manufacturer":  "ThermoCore",
        "status":        "operational",
        "install_date":  "2019-07-22",
        "criticality":   "medium",
        "location_id":   "LOC-001",
    },
    {
        "equipment_id": "EQ-003",
        "name":          "Compressor C-305",
        "type":          "Compressor",
        "model":         "RC-750",
        "manufacturer":  "AirForce Industrial",
        "status":        "maintenance",
        "install_date":  "2021-01-10",
        "criticality":   "high",
        "location_id":   "LOC-002",
    },
    {
        "equipment_id": "EQ-004",
        "name":          "Conveyor Belt CB-410",
        "type":          "Conveyor",
        "model":         "CB-MAX",
        "manufacturer":  "BeltMaster",
        "status":        "operational",
        "install_date":  "2018-11-03",
        "criticality":   "low",
        "location_id":   "LOC-003",
    },
    {
        "equipment_id": "EQ-005",
        "name":          "Boiler BLR-501",
        "type":          "Boiler",
        "model":         "SB-1200",
        "manufacturer":  "SteamPro",
        "status":        "operational",
        "install_date":  "2017-06-18",
        "criticality":   "critical",
        "location_id":   "LOC-002",
    },
]

# Each component carries: which equipment it belongs to + which supplier made it
COMPONENTS = [
    # EQ-001 · Pump P-101
    {"component_id": "CMP-001", "name": "Mechanical Seal",     "type": "Seal",    "equipment_id": "EQ-001", "supplier_id": "SUP-001"},
    {"component_id": "CMP-002", "name": "Drive Shaft Bearing", "type": "Bearing", "equipment_id": "EQ-001", "supplier_id": "SUP-002"},
    {"component_id": "CMP-003", "name": "Impeller",            "type": "Rotor",   "equipment_id": "EQ-001", "supplier_id": "SUP-003"},

    # EQ-002 · Heat Exchanger HX-202
    {"component_id": "CMP-004", "name": "Tube Bundle",         "type": "Tube",    "equipment_id": "EQ-002", "supplier_id": "SUP-003"},
    {"component_id": "CMP-005", "name": "Shell Gasket",        "type": "Seal",    "equipment_id": "EQ-002", "supplier_id": "SUP-005"},  # low-rated supplier

    # EQ-003 · Compressor C-305
    {"component_id": "CMP-006", "name": "Inlet Valve",         "type": "Valve",   "equipment_id": "EQ-003", "supplier_id": "SUP-005"},  # low-rated supplier
    {"component_id": "CMP-007", "name": "Rotor Assembly",      "type": "Rotor",   "equipment_id": "EQ-003", "supplier_id": "SUP-004"},
    {"component_id": "CMP-008", "name": "Piston Ring",         "type": "Ring",    "equipment_id": "EQ-003", "supplier_id": "SUP-002"},

    # EQ-004 · Conveyor CB-410
    {"component_id": "CMP-009", "name": "Drive Belt",          "type": "Belt",    "equipment_id": "EQ-004", "supplier_id": "SUP-001"},
    {"component_id": "CMP-010", "name": "Roller Bearing",      "type": "Bearing", "equipment_id": "EQ-004", "supplier_id": "SUP-002"},

    # EQ-005 · Boiler BLR-501
    {"component_id": "CMP-011", "name": "Safety Relief Valve", "type": "Valve",   "equipment_id": "EQ-005", "supplier_id": "SUP-005"},  # low-rated supplier
    {"component_id": "CMP-012", "name": "Water Pump",          "type": "Pump",    "equipment_id": "EQ-005", "supplier_id": "SUP-001"},
]

FAILURE_MODES = [
    {"failure_mode_id": "FM-001", "name": "Seal Leakage",         "severity": "high",     "typical_cause": "Worn mechanical seal"},
    {"failure_mode_id": "FM-002", "name": "Bearing Overheating",  "severity": "critical", "typical_cause": "Inadequate lubrication"},
    {"failure_mode_id": "FM-003", "name": "Valve Sticking",       "severity": "medium",   "typical_cause": "Corrosion or debris"},
    {"failure_mode_id": "FM-004", "name": "Belt Slippage",        "severity": "low",      "typical_cause": "Worn or misaligned belt"},
    {"failure_mode_id": "FM-005", "name": "Pressure Buildup",     "severity": "critical", "typical_cause": "Blocked relief valve"},
]

# Relationship: which failure modes are associated with which components
COMPONENT_FAILURE_LINKS = [
    ("CMP-001", "FM-001"),  # Mechanical Seal → Seal Leakage
    ("CMP-002", "FM-002"),  # Drive Shaft Bearing → Bearing Overheating
    ("CMP-006", "FM-003"),  # Inlet Valve → Valve Sticking
    ("CMP-009", "FM-004"),  # Drive Belt → Belt Slippage
    ("CMP-011", "FM-005"),  # Safety Relief Valve → Pressure Buildup
    ("CMP-010", "FM-002"),  # Roller Bearing → Bearing Overheating
    ("CMP-008", "FM-003"),  # Piston Ring → Valve Sticking (wear-related)
]


# ===========================================================================
# ② SEED FUNCTION
# ===========================================================================

def seed(svc: GraphService) -> None:
    console.rule("[bold cyan]Step 1 · Create Schema (constraints + indexes)[/bold cyan]")
    svc.create_constraints_and_indexes()
    console.print("  ✅ Constraints and indexes applied")

    console.rule("[bold cyan]Step 2 · Clear existing seed data[/bold cyan]")
    svc.drop_all_data()
    console.print("  ✅ Graph cleared")

    # ── Locations ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 3 · Create Location nodes[/bold cyan]")
    for loc in LOCATIONS:
        svc.create_node("Location", loc)
    console.print(f"  ✅ {len(LOCATIONS)} Location nodes created")

    # ── Suppliers ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 4 · Create Supplier nodes[/bold cyan]")
    for sup in SUPPLIERS:
        svc.create_node("Supplier", sup)
    console.print(f"  ✅ {len(SUPPLIERS)} Supplier nodes created")

    # ── Equipment ──────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 5 · Create Equipment nodes[/bold cyan]")
    for eq in EQUIPMENT:
        loc_id = eq.pop("location_id")
        svc.create_node("Equipment", eq)
        # Equipment ─[LOCATED_AT]─> Location
        svc.create_relationship(
            "Equipment", "equipment_id", eq["equipment_id"],
            "LOCATED_AT",
            "Location",  "location_id", loc_id,
        )
        eq["location_id"] = loc_id  # restore for later reference
    console.print(f"  ✅ {len(EQUIPMENT)} Equipment nodes created with LOCATED_AT relationships")

    # ── Components ─────────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 6 · Create Component nodes + relationships[/bold cyan]")
    for cmp in COMPONENTS:
        eq_id  = cmp.pop("equipment_id")
        sup_id = cmp.pop("supplier_id")
        svc.create_node("Component", cmp)
        # Equipment ─[HAS_COMPONENT]─> Component
        svc.create_relationship(
            "Equipment", "equipment_id", eq_id,
            "HAS_COMPONENT",
            "Component", "component_id", cmp["component_id"],
        )
        # Component ─[SUPPLIED_BY]─> Supplier
        svc.create_relationship(
            "Component", "component_id", cmp["component_id"],
            "SUPPLIED_BY",
            "Supplier", "supplier_id", sup_id,
        )
        cmp["equipment_id"] = eq_id
        cmp["supplier_id"]  = sup_id
    console.print(f"  ✅ {len(COMPONENTS)} Component nodes with HAS_COMPONENT + SUPPLIED_BY relationships")

    # ── Failure Modes ──────────────────────────────────────────────────────
    console.rule("[bold cyan]Step 7 · Create FailureMode nodes[/bold cyan]")
    for fm in FAILURE_MODES:
        svc.create_node("FailureMode", fm)
    console.print(f"  ✅ {len(FAILURE_MODES)} FailureMode nodes created")

    # ── Component → FailureMode links ─────────────────────────────────────
    console.rule("[bold cyan]Step 8 · Link Components to FailureModes[/bold cyan]")
    for cmp_id, fm_id in COMPONENT_FAILURE_LINKS:
        svc.create_relationship(
            "Component",   "component_id",    cmp_id,
            "PRONE_TO",
            "FailureMode", "failure_mode_id", fm_id,
        )
    console.print(f"  ✅ {len(COMPONENT_FAILURE_LINKS)} PRONE_TO relationships created")

    # ── Equipment ─[SIMILAR_TO]─> Equipment (same type) ───────────────────
    console.rule("[bold cyan]Step 9 · Cross-Equipment SIMILAR_TO relationships[/bold cyan]")
    similar_pairs = [
        ("EQ-001", "EQ-005"),   # both have pump components
        ("EQ-002", "EQ-003"),   # both use SUP-005 (low-rated)
    ]
    for a, b in similar_pairs:
        svc.create_relationship(
            "Equipment", "equipment_id", a,
            "SIMILAR_TO",
            "Equipment", "equipment_id", b,
        )
    console.print(f"  ✅ {len(similar_pairs)} SIMILAR_TO relationships created")


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

    # Quick validation query: supplier with most components
    console.rule("[bold green]Hidden Pattern Check — Supplier Failure Risk[/bold green]")
    rows = svc.run_query(
        """
        MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)-[:PRONE_TO]->(fm:FailureMode)
        RETURN s.name AS supplier, count(fm) AS failure_links, s.rating AS rating
        ORDER BY failure_links DESC
        """
    )
    risk_table = Table(title="Supplier → Failure Risk (hidden pattern)", style="red")
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
    console.rule("[bold magenta]Industrial Brain — Knowledge Graph Seed[/bold magenta]")
    with GraphService() as svc:
        seed(svc)
        print_summary(svc)
    console.rule("[bold green]✅  Seeding complete![/bold green]")
