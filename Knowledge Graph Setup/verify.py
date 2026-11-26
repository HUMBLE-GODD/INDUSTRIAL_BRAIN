"""
verify.py
---------
Quick verification script.
Runs after seed.py to confirm the graph has the expected shape.

Run:
    python verify.py
"""

import sys

from graph_service import GraphService
from rich.console import Console

console = Console()


CHECKS = [
    # (description, cypher, min_expected_count)
    ("Equipment nodes exist",          "MATCH (n:Equipment)   RETURN count(n) AS c", 8),
    ("Component nodes exist",          "MATCH (n:Component)   RETURN count(n) AS c", 21),
    ("Supplier nodes exist",           "MATCH (n:Supplier)    RETURN count(n) AS c", 8),
    ("Location nodes exist",           "MATCH (n:Location)    RETURN count(n) AS c", 4),
    ("FailureMode nodes exist",        "MATCH (n:FailureMode) RETURN count(n) AS c", 9),
    ("HAS_COMPONENT relationships",    "MATCH ()-[r:HAS_COMPONENT]->() RETURN count(r) AS c", 21),
    ("SUPPLIED_BY relationships",      "MATCH ()-[r:SUPPLIED_BY]->()   RETURN count(r) AS c", 21),
    ("LOCATED_AT relationships",       "MATCH ()-[r:LOCATED_AT]->()    RETURN count(r) AS c", 8),
    ("PRONE_TO relationships",         "MATCH ()-[r:PRONE_TO]->()      RETURN count(r) AS c", 17),
    ("SIMILAR_TO relationships",       "MATCH ()-[r:SIMILAR_TO]->()    RETURN count(r) AS c", 5),
    ("Demo Factory equipment is linked to LOC-004", "MATCH (e:Equipment)-[:LOCATED_AT]->(:Location {location_id:'LOC-004'}) RETURN count(e) AS c", 3),
    ("EQ-101 components are linked to suppliers and failure modes", "MATCH (:Equipment {equipment_id:'EQ-101'})-[:HAS_COMPONENT]->(c:Component)-[:SUPPLIED_BY]->(:Supplier) MATCH (c)-[:PRONE_TO]->(:FailureMode) RETURN count(DISTINCT c) AS c", 3),
    ("EpsilonValves supplies 3+ parts","MATCH (:Supplier {name:'EpsilonValves Ltd'})<-[:SUPPLIED_BY]-(c) RETURN count(c) AS c", 3),
    ("EpsilonValves parts linked to failures", "MATCH (:Supplier {name:'EpsilonValves Ltd'})<-[:SUPPLIED_BY]-(c)-[:PRONE_TO]->(:FailureMode) RETURN count(DISTINCT c) AS c", 3),
    ("High/critical EpsilonValves failure links", "MATCH (:Supplier {name:'EpsilonValves Ltd'})<-[:SUPPLIED_BY]-(c)-[:PRONE_TO]->(fm:FailureMode) WHERE fm.severity IN ['high', 'critical'] RETURN count(DISTINCT c) AS c", 2),
]


def run_verification(svc: GraphService) -> bool:
    console.rule("[bold cyan]Graph Verification[/bold cyan]")
    passed = 0
    failed = 0

    for desc, cypher, minimum in CHECKS:
        rows = svc.run_query(cypher)
        actual = rows[0]["c"] if rows else 0
        ok = actual >= minimum
        icon = "✅" if ok else "❌"
        status = "PASS" if ok else f"FAIL (expected ≥{minimum}, got {actual})"
        console.print(f"  {icon}  {desc:45s}  {status}")
        if ok:
            passed += 1
        else:
            failed += 1

    console.rule()
    console.print(f"  Results: [green]{passed} passed[/green]  [red]{failed} failed[/red]")

    if failed == 0:
        console.print("[bold green]\n  All checks passed! Graph is correctly seeded.[/bold green]")
    else:
        console.print("[bold red]\n  Some checks failed. Re-run seed.py to fix.[/bold red]")
    return failed == 0


if __name__ == "__main__":
    with GraphService() as svc:
        sys.exit(0 if run_verification(svc) else 1)
