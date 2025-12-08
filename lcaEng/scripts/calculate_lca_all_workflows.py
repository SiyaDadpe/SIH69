"""Batch LCA calculation per workflowId.

Reads all distinct workflowIds from LCA.wizardworkflowoutputs, selects the
latest document per workflowId (by updatedAt), computes compact LCA output
(optionally with LLM recommendations), and writes one document per workflowId
to LCA.calculatelcas with _id = workflowId.

Existing documents with the same _id are overwritten (upsert).

Usage (PowerShell):
    # Option A: pass URI directly
    python -m scripts.calculate_lca_all_workflows --mongo-uri "<uri>" --llm

    # Option B: use environment variable
    $env:MONGO_URI="<uri>"; python -m scripts.calculate_lca_all_workflows --llm

Flags:
  --db                Mongo DB name (default: LCA)
  --source            Source collection (default: wizardworkflowoutputs)
  --target            Target collection (default: calculatelcas)
    --mongo-uri         MongoDB connection URI (overrides env/.env)
  --llm               Include Gemini-based recommendations when GEMINI_API_KEY set
  --limit N           Process only first N workflowIds (for testing)
  --dry-run           Do not write to DB; just print summary counts
"""

from __future__ import annotations

import argparse
from datetime import datetime
from typing import Any, Dict, List

from bson import ObjectId

from src.utils.mongo_client import get_mongo_client
from src.engine.main_engine import AluminumLCAEngine
from scripts.calculate_lca_by_id import _trim_recommendations  # reuse


def _now_ms() -> int:
    return int(datetime.utcnow().timestamp() * 1000)


def build_workflow_doc(source: Dict[str, Any], compact: Dict[str, Any], llm_block: Dict[str, Any] | None, use_llm: bool) -> Dict[str, Any]:
    """Build storage doc keyed by workflowId instead of source _id."""
    workflow_id = source.get("workflowId")
    if not workflow_id:
        raise ValueError("Source doc missing workflowId")
    out = dict(compact)
    # Force _id to workflowId
    out["_id"] = workflow_id
    out["workflowId"] = workflow_id
    # Carry userId if present
    if "userId" in source:
        out["userId"] = source["userId"]
    # Project name
    if source.get("name"):
        out["projectName"] = source["name"]
    # createdAt / updatedAt
    now_ms = _now_ms()
    out["createdAt"] = {"$date": {"$numberLong": str(now_ms)}}
    out["updatedAt"] = {"$date": {"$numberLong": str(now_ms)}}
    # Recommendations
    if use_llm and llm_block and llm_block.get("success") and isinstance(llm_block.get("recommendations"), list):
        out["recommendations"] = _trim_recommendations(llm_block["recommendations"])
    else:
        if not isinstance(out.get("recommendations"), list):
            out["recommendations"] = []
        else:
            out["recommendations"] = _trim_recommendations(out["recommendations"])  # type: ignore[arg-type]
    out["status"] = "completed"
    return out


def main():
    parser = argparse.ArgumentParser(description="Batch compute LCA per workflowId")
    parser.add_argument("--db", default="LCA", help="Mongo DB name (default: LCA)")
    parser.add_argument("--source", default="wizardworkflowoutputs", help="Source collection")
    parser.add_argument("--target", default="calculatelcas", help="Target collection")
    parser.add_argument("--mongo-uri", dest="mongo_uri", default=None, help="MongoDB URI (overrides env/.env)")
    parser.add_argument("--llm", action="store_true", help="Include LLM recommendations")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of workflowIds processed")
    parser.add_argument("--dry-run", action="store_true", help="Do not write to DB; just show summary")
    args = parser.parse_args()

    client = get_mongo_client(uri=args.mongo_uri)
    db = client[args.db]
    src = db[args.source]
    tgt = db[args.target]

    workflow_ids: List[ObjectId] = src.distinct("workflowId")  # type: ignore
    if args.limit is not None:
        workflow_ids = workflow_ids[: args.limit]
    if not workflow_ids:
        print("No workflowIds found.")
        return 0

    engine = AluminumLCAEngine()
    processed = 0
    failures = 0

    for wf_id in workflow_ids:
        # Latest document per workflowId (assuming updatedAt exists)
        doc = src.find_one({"workflowId": wf_id}, sort=[("updatedAt", -1)])
        if not doc:
            failures += 1
            continue
        name = doc.get("name") or f"Workflow-{wf_id}"
        try:
            if args.llm:
                wrapper = engine.compact_wizard_with_llm(doc, scenario_name=name)
                compact = wrapper.get("compact", {})
                llm_block = wrapper.get("llm")
            else:
                compact = engine.compact_wizard_document(doc, scenario_name=name)
                llm_block = None
            storage_doc = build_workflow_doc(doc, compact, llm_block, use_llm=args.llm)
            if not args.dry_run:
                tgt.replace_one({"_id": wf_id}, storage_doc, upsert=True)
            processed += 1
            print(f"✓ Workflow {wf_id} processed")
        except Exception as e:
            print(f"✗ Workflow {wf_id} failed: {e}")
            failures += 1

    print("\nSummary:")
    print(f"  Total workflowIds: {len(workflow_ids)}")
    print(f"  Processed: {processed}")
    print(f"  Failures: {failures}")
    if args.dry_run:
        print("(Dry run - no writes performed)")
    else:
        print(f"Results written to {args.db}.{args.target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
