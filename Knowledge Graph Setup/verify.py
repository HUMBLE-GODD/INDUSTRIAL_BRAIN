"""
Knowledge Graph Setup/verify.py
---------------------------------
Verification script – asserts the demo graph has the expected shape.

Checks include:
  - Node counts (Equipment × 5, Component × 12, Supplier × 5,
    FailureMode × 5, Location × 3)
  - Relationship counts for all relationship types
  - The EpsilonValves hidden pattern (3 components across 3 equipment)
  - Severity distinctions (medium vs high/critical)

Exits with code 0 when all checks pass; exits nonzero on any failure.

Run:
    python verify.py
"""
from __future__ import annotations

import sys

from graph_service import GraphService
from rich.console import Console

console = Console()


# ---------------------------------------------------------------------------
# Check definitions
# Each entry: (description, cypher, minimum_expected_count)
# ---------------------------------------------------------------------------
CHECKS = [
    # Node counts
    ("Equipment nodes exist",          "MATCH (n:Equipment)   RETURN count(n) AS c", 5),
    ("Component nodes exist",          "MATCH (n:Component)   RETURN count(n) AS c", 12),
    ("Supplier nodes exist",           "MATCH (n:Supplier)    RETURN count(n) AS c", 5),
    ("Location nodes exist",           "MATCH (n:Location)    RETURN count(n) AS c", 3),
    ("FailureMode nodes exist",        "MATCH (n:FailureMode) RETURN count(n) AS c", 5),
    # Relationship counts
    ("HAS_COMPONENT relationships",    "MATCH ()-[r:HAS_COMPONENT]->() RETURN count(r) AS c", 12),
    ("SUPPLIED_BY relationships",      "MATCH ()-[r:SUPPLIED_BY]->()   RETURN count(r) AS c", 12),
    ("LOCATED_AT relationships",       "MATCH ()-[r:LOCATED_AT]->()    RETURN count(r) AS c", 5),
    ("PRONE_TO relationships",         "MATCH ()-[r:PRONE_TO]->()      RETURN count(r) AS c", 7),
    ("SIMILAR_TO relationships",       "MATCH ()-[r:SIMILAR_TO]->()    RETURN count(r) AS c", 2),
    # EpsilonValves hidden pattern – supplies 3 components across 3 equipment
    (
        "EpsilonValves supplies 3+ components",
        "MATCH (:Supplier {name:'EpsilonValves Ltd'})<-[:SUPPLIED_BY]-(c) RETURN count(c) AS c",
        3,
    ),
    (
        "EpsilonValves across 3 distinct equipment",
        """
        MATCH (:Supplier {name:'EpsilonValves Ltd'})<-[:SUPPLIED_BY]-(c:Component)
              <-[:HAS_COMPONENT]-(e:Equipment)
        RETURN count(DISTINCT e) AS c
        """,
        3,
    ),
    # Severity check: at least one critical and one medium failure mode
    (
        "At least one CRITICAL failure mode exists",
        "MATCH (fm:FailureMode {severity:'critical'}) RETURN count(fm) AS c",
        1,
    ),
    (
        "At least one MEDIUM failure mode exists",
        "MATCH (fm:FailureMode {severity:'medium'}) RETURN count(fm) AS c",
        1,
    ),
    # Supplier rating stored correctly
    (
        "EpsilonValves rating < 3.5 (low-rated flag)",
        "MATCH (s:Supplier {name:'EpsilonValves Ltd'}) WHERE s.rating < 3.5 RETURN count(s) AS c",
        1,
    ),
]


def run_verification(svc: GraphService) -> bool:
    console.rule("[bold cyan]Graph Verification[/bold cyan]")
    passed = 0
    failed = 0

    for desc, cypher, minimum in CHECKS:
        rows = svc.run_query(cypher.strip())
        actual = rows[0]["c"] if rows else 0
        ok = actual >= minimum
        icon = "✅" if ok else "❌"
        status = "PASS" if ok else f"FAIL (expected ≥{minimum}, got {actual})"
        console.print(f"  {icon}  {desc:55s}  {status}")
        if ok:
            passed += 1
        else:
            failed += 1

    console.rule()
    console.print(f"  Results: [green]{passed} passed[/green]  [red]{failed} failed[/red]")

    if failed == 0:
        console.print("[bold green]\n  All checks passed! Graph is correctly seeded.[/bold green]")
        return True
    else:
        console.print("[bold red]\n  Some checks failed. Re-run seed.py to fix.[/bold red]")
        return False


if __name__ == "__main__":
    with GraphService() as svc:
        success = run_verification(svc)
    sys.exit(0 if success else 1)
