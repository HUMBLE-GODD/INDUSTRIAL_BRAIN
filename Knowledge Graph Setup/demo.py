"""
demo.py
-------
Interactive demo: shows the GraphService API in action.
Run this AFTER seed.py.

    python knowledge_graph/demo.py
"""

from graph_service import GraphService
from rich.console import Console
from rich.panel import Panel

console = Console()


def demo() -> None:
    with GraphService() as svc:

        # ── 1. Count everything ─────────────────────────────────────────────
        console.print(Panel("[bold]1. Graph totals[/bold]"))
        s = svc.graph_summary()
        console.print(f"  Nodes: {s['total_nodes']}    Relationships: {s['total_relationships']}")

        # ── 2. Fetch a single equipment node ───────────────────────────────
        console.print(Panel("[bold]2. Get Pump P-101 by ID[/bold]"))
        pump = svc.get_node("Equipment", "equipment_id", "EQ-001")
        console.print(pump)

        # ── 3. Outgoing relationships for the pump ─────────────────────────
        console.print(Panel("[bold]3. All outgoing relationships from Pump P-101[/bold]"))
        rels = svc.get_relationships("Equipment", "equipment_id", "EQ-001", direction="out")
        for rel in rels:
            console.print(f"  ──[{rel['rel_type']}]──> {rel['target_labels']} | {rel['target']}")

        # ── 4. Raw Cypher: which supplier links to the most failures? ───────
        console.print(Panel("[bold]4. Supplier failure-risk ranking (hidden pattern)[/bold]"))
        rows = svc.run_query(
            """
            MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)-[:PRONE_TO]->(fm:FailureMode)
            RETURN s.name AS supplier, count(fm) AS risk_count, s.rating AS rating
            ORDER BY risk_count DESC
            """
        )
        for r in rows:
            bar = "█" * r["risk_count"]
            console.print(f"  {bar}  {r['supplier']:25s}  risk={r['risk_count']}  rating={r['rating']}")

        # ── 5. Update a node ────────────────────────────────────────────────
        console.print(Panel("[bold]5. Mark Compressor C-305 as operational[/bold]"))
        updated = svc.update_node("Equipment", "equipment_id", "EQ-003", {"status": "operational"})
        console.print(f"  New status: {updated.get('status')}")

        # ── 6. List all high-criticality equipment ──────────────────────────
        console.print(Panel("[bold]6. High/critical criticality equipment[/bold]"))
        rows = svc.run_query(
            """
            MATCH (e:Equipment)
            WHERE e.criticality IN ['high', 'critical']
            RETURN e.name AS name, e.criticality AS crit, e.status AS status
            ORDER BY crit DESC
            """
        )
        for r in rows:
            console.print(f"  [{r['crit'].upper():8s}]  {r['name']}  ({r['status']})")


if __name__ == "__main__":
    console.rule("[bold magenta]GraphService Demo[/bold magenta]")
    demo()
    console.rule("[bold green]Done[/bold green]")
