"""
graph_service.py
----------------
Reusable service class for all Neo4j graph CRUD operations.
Supports: nodes, relationships, schema constraints, indexes, and queries.
"""

import os
from typing import Any, Optional
from dotenv import load_dotenv
from neo4j import GraphDatabase, Driver, Session
from neo4j.exceptions import ServiceUnavailable, AuthError

load_dotenv()


# ---------------------------------------------------------------------------
# Node labels used in the Industrial Brain graph
# ---------------------------------------------------------------------------
NODE_LABELS = [
    "Equipment",
    "Component",
    "Supplier",
    "Technician",
    "Location",
    "FailureMode",
    "MaintenanceRecord",
    "Inspection",
    "Document",
    "Regulation",
]

# ---------------------------------------------------------------------------
# Constraints: one uniqueness constraint per label + property
# ---------------------------------------------------------------------------
CONSTRAINTS = [
    ("Equipment",        "equipment_id"),
    ("Component",        "component_id"),
    ("Supplier",         "supplier_id"),
    ("Technician",       "technician_id"),
    ("Location",         "location_id"),
    ("FailureMode",      "failure_mode_id"),
    ("MaintenanceRecord","record_id"),
    ("Inspection",       "inspection_id"),
    ("Document",         "document_id"),
    ("Regulation",       "regulation_id"),
]

# ---------------------------------------------------------------------------
# Additional indexes for frequently queried properties
# ---------------------------------------------------------------------------
INDEXES = [
    ("Equipment",   "name"),
    ("Equipment",   "status"),
    ("Component",   "type"),
    ("Supplier",    "name"),
    ("Technician",  "name"),
    ("FailureMode", "severity"),
]


class GraphService:
    """
    Central service for interacting with the Neo4j knowledge graph.

    Usage
    -----
    >>> svc = GraphService()
    >>> svc.create_node("Equipment", {"equipment_id": "E-001", "name": "Pump Alpha"})
    >>> svc.close()

    Or use as a context manager:
    >>> with GraphService() as svc:
    ...     svc.create_node(...)
    """

    def __init__(
        self,
        uri: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ) -> None:
        self._uri      = uri      or os.getenv("NEO4J_URI",     "bolt://localhost:7687")
        self._username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self._password = password or os.getenv("NEO4J_PASSWORD", "")
        self._database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        self._driver: Driver = self._connect()

    # ------------------------------------------------------------------
    # Connection
    # ------------------------------------------------------------------

    def _connect(self) -> Driver:
        try:
            driver = GraphDatabase.driver(
                self._uri,
                auth=(self._username, self._password),
            )
            driver.verify_connectivity()
            return driver
        except ServiceUnavailable as exc:
            raise ConnectionError(
                f"Cannot reach Neo4j at {self._uri}. "
                "Is the container running?  docker compose up -d neo4j"
            ) from exc
        except AuthError as exc:
            raise PermissionError(
                "Neo4j authentication failed. Check NEO4J_USERNAME / NEO4J_PASSWORD."
            ) from exc

    def close(self) -> None:
        """Release the driver connection pool."""
        if self._driver:
            self._driver.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()

    # ------------------------------------------------------------------
    # Schema helpers
    # ------------------------------------------------------------------

    def create_constraints_and_indexes(self) -> None:
        """
        Idempotently create all uniqueness constraints and extra indexes.
        Safe to call multiple times (IF NOT EXISTS guards).
        """
        with self._driver.session(database=self._database) as session:
            for label, prop in CONSTRAINTS:
                cname = f"unique_{label.lower()}_{prop}"
                session.run(
                    f"CREATE CONSTRAINT {cname} IF NOT EXISTS "
                    f"FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
                )
            for label, prop in INDEXES:
                iname = f"idx_{label.lower()}_{prop}"
                session.run(
                    f"CREATE INDEX {iname} IF NOT EXISTS "
                    f"FOR (n:{label}) ON (n.{prop})"
                )

    def drop_all_data(self) -> None:
        """Delete ALL nodes and relationships. Use only in tests / resets."""
        with self._driver.session(database=self._database) as session:
            session.run("MATCH (n) DETACH DELETE n")

    # ------------------------------------------------------------------
    # Node CRUD
    # ------------------------------------------------------------------

    def create_node(self, label: str, properties: dict[str, Any]) -> dict:
        """
        Create a single node and return its properties.

        Parameters
        ----------
        label      : Neo4j node label (e.g. "Equipment")
        properties : dict of property key-value pairs
        """
        query = (
            f"CREATE (n:{label} $props) "
            "RETURN n"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, props=properties)
            record = result.single()
            return dict(record["n"]) if record else {}

    def merge_node(self, label: str, merge_key: dict[str, Any],
                   set_props: Optional[dict[str, Any]] = None) -> dict:
        """
        MERGE a node on `merge_key` then optionally SET additional properties.
        Useful for upserts.
        """
        set_clause = ""
        params: dict[str, Any] = {"merge_key": merge_key}
        if set_props:
            set_clause = "SET n += $set_props "
            params["set_props"] = set_props

        query = (
            f"MERGE (n:{label} $merge_key) "
            + set_clause
            + "RETURN n"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, **params)
            record = result.single()
            return dict(record["n"]) if record else {}

    def get_node(self, label: str, prop_key: str, prop_val: Any) -> Optional[dict]:
        """Fetch a single node by a property value."""
        query = (
            f"MATCH (n:{label} {{{prop_key}: $val}}) "
            "RETURN n LIMIT 1"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, val=prop_val)
            record = result.single()
            return dict(record["n"]) if record else None

    def update_node(self, label: str, id_key: str, id_val: Any,
                    updates: dict[str, Any]) -> dict:
        """Update properties of a matching node."""
        query = (
            f"MATCH (n:{label} {{{id_key}: $id_val}}) "
            "SET n += $updates "
            "RETURN n"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, id_val=id_val, updates=updates)
            record = result.single()
            return dict(record["n"]) if record else {}

    def delete_node(self, label: str, id_key: str, id_val: Any) -> int:
        """Detach-delete a node. Returns number of nodes deleted."""
        query = (
            f"MATCH (n:{label} {{{id_key}: $id_val}}) "
            "DETACH DELETE n "
            "RETURN count(n) AS deleted"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, id_val=id_val)
            record = result.single()
            return record["deleted"] if record else 0

    def list_nodes(self, label: str, limit: int = 100) -> list[dict]:
        """Return up to `limit` nodes of a given label."""
        query = f"MATCH (n:{label}) RETURN n LIMIT $limit"
        with self._driver.session(database=self._database) as session:
            result = session.run(query, limit=limit)
            return [dict(r["n"]) for r in result]

    # ------------------------------------------------------------------
    # Relationship CRUD
    # ------------------------------------------------------------------

    def create_relationship(
        self,
        from_label: str, from_key: str, from_val: Any,
        rel_type: str,
        to_label:   str, to_key:   str, to_val:   Any,
        rel_props: Optional[dict[str, Any]] = None,
    ) -> bool:
        """
        Create a relationship between two existing nodes.

        Returns True if the relationship was created.
        """
        props_clause = "{}" if not rel_props else "$rel_props"
        query = (
            f"MATCH (a:{from_label} {{{from_key}: $from_val}}) "
            f"MATCH (b:{to_label}   {{{to_key}:   $to_val}}) "
            f"CREATE (a)-[r:{rel_type} {props_clause}]->(b) "
            "RETURN r"
        )
        params: dict[str, Any] = {"from_val": from_val, "to_val": to_val}
        if rel_props:
            params["rel_props"] = rel_props

        with self._driver.session(database=self._database) as session:
            result = session.run(query, **params)
            return result.single() is not None

    def merge_relationship(
        self,
        from_label: str, from_key: str, from_val: Any,
        rel_type: str,
        to_label:   str, to_key:   str, to_val:   Any,
        rel_props: Optional[dict[str, Any]] = None,
    ) -> bool:
        """MERGE a relationship (create only if it does not exist)."""
        query = (
            f"MATCH (a:{from_label} {{{from_key}: $from_val}}) "
            f"MATCH (b:{to_label}   {{{to_key}:   $to_val}}) "
            f"MERGE (a)-[r:{rel_type}]->(b) "
            + ("SET r += $rel_props " if rel_props else "")
            + "RETURN r"
        )
        params: dict[str, Any] = {"from_val": from_val, "to_val": to_val}
        if rel_props:
            params["rel_props"] = rel_props

        with self._driver.session(database=self._database) as session:
            result = session.run(query, **params)
            return result.single() is not None

    def get_relationships(
        self,
        from_label: str, from_key: str, from_val: Any,
        rel_type: Optional[str] = None,
        direction: str = "out",            # "out" | "in" | "both"
    ) -> list[dict]:
        """
        Return all relationships (and neighbour properties) for a node.

        direction controls the arrow direction in the Cypher pattern.
        """
        rel_part = f":{rel_type}" if rel_type else ""
        if direction == "out":
            pattern = f"(a)-[r{rel_part}]->(b)"
        elif direction == "in":
            pattern = f"(a)<-[r{rel_part}]-(b)"
        else:
            pattern = f"(a)-[r{rel_part}]-(b)"

        query = (
            f"MATCH {pattern} "
            f"WHERE a.{from_key} = $val "
            "RETURN type(r) AS rel_type, properties(r) AS rel_props, "
            "labels(b) AS target_labels, properties(b) AS target_props"
        )
        with self._driver.session(database=self._database) as session:
            result = session.run(query, val=from_val)
            return [
                {
                    "rel_type":     r["rel_type"],
                    "rel_props":    dict(r["rel_props"]),
                    "target_labels": list(r["target_labels"]),
                    "target":       dict(r["target_props"]),
                }
                for r in result
            ]

    # ------------------------------------------------------------------
    # Raw query execution
    # ------------------------------------------------------------------

    def run_query(self, cypher: str, params: Optional[dict] = None) -> list[dict]:
        """
        Execute any Cypher query and return a list of record dicts.

        >>> svc.run_query("MATCH (e:Equipment) RETURN e.name AS name LIMIT 5")
        """
        with self._driver.session(database=self._database) as session:
            result = session.run(cypher, **(params or {}))
            return [dict(record) for record in result]

    # ------------------------------------------------------------------
    # Convenience / stats
    # ------------------------------------------------------------------

    def count_nodes(self, label: Optional[str] = None) -> int:
        query = (
            f"MATCH (n:{label}) RETURN count(n) AS c"
            if label else
            "MATCH (n) RETURN count(n) AS c"
        )
        with self._driver.session(database=self._database) as session:
            record = session.run(query).single()
            return record["c"] if record else 0

    def count_relationships(self) -> int:
        with self._driver.session(database=self._database) as session:
            record = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()
            return record["c"] if record else 0

    def graph_summary(self) -> dict:
        """Return a quick summary of node and relationship counts."""
        summary: dict[str, Any] = {
            "total_nodes": self.count_nodes(),
            "total_relationships": self.count_relationships(),
            "by_label": {},
        }
        for label in NODE_LABELS:
            summary["by_label"][label] = self.count_nodes(label)
        return summary
