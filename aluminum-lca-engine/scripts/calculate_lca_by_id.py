"""
Calculate LCA for a single Wizard document by ObjectId and write the compact
result into LCA.calculatelcas using the SAME _id as the source document.

Usage (PowerShell):
    # Option A: pass URI directly
    python -m scripts.calculate_lca_by_id --mongo-uri "<your-uri>" --id 6919b0ff4c2052cfd8523d8e --llm

    # Option B: use environment variable
    $env:MONGO_URI="<your-uri>"; python -m scripts.calculate_lca_by_id --id 6919b0ff4c2052cfd8523d8e --llm

Options:
  --db LCA (default)
  --source wizardworkflowoutputs (default)
  --target calculatelcas (default)
    --mongo-uri MongoDB URI override
  --llm include Gemini-based recommendations (requires GEMINI_API_KEY)
"""

from __future__ import annotations

import argparse
from datetime import datetime
from typing import Any, Dict

from bson import ObjectId

from src.utils.mongo_client import get_mongo_client
from src.engine.main_engine import AluminumLCAEngine


def oid_type(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except Exception:
        raise argparse.ArgumentTypeError("--id must be a valid ObjectId")


def _now_ms() -> int:
    return int(datetime.utcnow().timestamp() * 1000)


def _trim_recommendations(recs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Reduce to {priority,title,description} to match example format."""
    out = []
    for r in recs:
        out.append({
            "priority": r.get("priority", "MEDIUM"),
            "title": r.get("title", "Recommendation"),
            "description": r.get("description", "")
        })
    return out


def build_storage_doc(source: Dict[str, Any], compact: Dict[str, Any], llm_block: Dict[str, Any] | None, use_llm: bool) -> Dict[str, Any]:
    """Combine source metadata with compact output and optional LLM recs.

    Ensures _id equals the source _id and aligns to requested target format.
    """
    out = dict(compact)  # shallow copy
    # Force the _id to match source
    out["_id"] = source.get("_id")

    # Carry through optional metadata if present
    for field in ("userId", "workflowId"):
        if field in source:
            out[field] = source[field]

    # Project name: prefer source name
    if source.get("name"):
        out["projectName"] = source["name"]

    # createdAt / updatedAt
    now_ms = _now_ms()
    out["createdAt"] = {"$date": {"$numberLong": str(now_ms)}}
    out["updatedAt"] = {"$date": {"$numberLong": str(now_ms)}}

    # Recommendations: prefer LLM if requested and successful
    if use_llm and llm_block and llm_block.get("success") and isinstance(llm_block.get("recommendations"), list):
        out["recommendations"] = _trim_recommendations(llm_block["recommendations"])
    else:
        # Ensure compact has recommendations
        if not isinstance(out.get("recommendations"), list):
            out["recommendations"] = []
        else:
            out["recommendations"] = _trim_recommendations(out["recommendations"])  # type: ignore[arg-type]

    # status
    out["status"] = "completed"
    return out


def main():
    parser = argparse.ArgumentParser(description="Calculate LCA by wizard _id and write to calculatelcas")
    parser.add_argument("--id", type=oid_type, required=True, help="Wizard document ObjectId")
    parser.add_argument("--db", default="LCA", help="MongoDB database name (default: LCA)")
    parser.add_argument("--source", default="wizardworkflowoutputs", help="Source collection (default: wizardworkflowoutputs)")
    parser.add_argument("--target", default="calculatelcas", help="Target collection (default: calculatelcas)")
    parser.add_argument("--mongo-uri", dest="mongo_uri", default=None, help="MongoDB URI (overrides env/.env)")
    parser.add_argument("--llm", action="store_true", help="Include LLM recommendations if GEMINI_API_KEY set")
    args = parser.parse_args()

    client = get_mongo_client(uri=args.mongo_uri)
    db = client[args.db]
    src = db[args.source]
    tgt = db[args.target]

    doc = src.find_one({"_id": args.id})
    if not doc:
        print(f"No wizard document found with _id={args.id}")
        return 1

    engine = AluminumLCAEngine()
    name = doc.get("name") or str(doc["_id"])  # scenario label

    if args.llm:
        # build compact with LLM block
        out_wrapper = engine.compact_wizard_with_llm(doc, scenario_name=name)
        compact = out_wrapper.get("compact", {})
        llm_block = out_wrapper.get("llm")
    else:
        compact = engine.compact_wizard_document(doc, scenario_name=name)
        llm_block = None

    final_doc = build_storage_doc(doc, compact, llm_block, use_llm=args.llm)

    # Upsert into target with same _id
    tgt.replace_one({"_id": args.id}, final_doc, upsert=True)
    print(f"✓ Wrote calculated LCA to {args.db}.{args.target} with _id={args.id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
