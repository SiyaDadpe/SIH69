"""
Analyze Wizard Workflow Outputs from MongoDB and print/export results.

Reads documents from the configured Mongo database/collection, maps each
document via the wizard input mapper, runs the engine analysis, and prints
summary results. Optionally filter by _id or metalType.

Usage (PowerShell):
  $env:MONGO_URI="<your-uri>"; python -m scripts.analyze_wizard_mongo --limit 1 --metal Aluminium

Note: Ensure your Python env has pymongo installed and .env contains MONGO_URI
or set it via environment.
"""

from __future__ import annotations

import argparse
import json
from bson import ObjectId
from pathlib import Path

from src.utils.mongo_client import get_collection
from src.engine.main_engine import AluminumLCAEngine


def oid(val: str | None):
    if not val:
        return None
    try:
        return ObjectId(val)
    except Exception:
        raise argparse.ArgumentTypeError("--id must be a valid ObjectId string")


def main():
    parser = argparse.ArgumentParser(description="Analyze wizard docs from MongoDB")
    parser.add_argument("--id", type=oid, help="Process a single document by _id")
    parser.add_argument("--metal", default="Aluminium", help="Filter by metalType (default: Aluminium)")
    parser.add_argument("--limit", type=int, default=1, help="Max documents to process (ignored when --id provided)")
    parser.add_argument("--export-json", default=None, help="Optional JSON export filename (extended batch format)")
    parser.add_argument("--export-compact", default=None, help="Optional compact single JSON filename (first doc only)")
    parser.add_argument("--llm", action="store_true", help="Include LLM recommendations in compact output (requires GEMINI_API_KEY)")
    args = parser.parse_args()

    coll = get_collection()

    if args.id:
        cursor = [coll.find_one({"_id": args.id})]
    else:
        query = {"metalType": args.metal} if args.metal else {}
        cursor = coll.find(query).sort("updatedAt", -1).limit(args.limit)

    engine = AluminumLCAEngine()
    batch = {}
    count = 0

    for doc in cursor:
        if not doc:
            continue
        name = doc.get("name") or str(doc.get("_id"))
        try:
            res = engine.analyze_wizard_document(doc, scenario_name=name)
            batch[name] = res
            count += 1
        except Exception as e:
            batch[name] = {"scenario_name": name, "error": str(e)}

    if count == 0:
        print("No documents processed.")
        return 0

    # Print a compact summary
    engine.print_summary(batch)

    # Optional export (extended JSON with parameters + metadata)
    if args.export_json:
        out = Path(args.export_json)
        serializable = engine._serialize_results(batch, include_parameters=True)
        with out.open("w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2)
        print(f"Saved JSON export to {out.resolve()}")

    # Optional compact export (first processed document)
    if args.export_compact:
        first_key = next(iter(batch.keys()))
        if "error" in batch[first_key]:
            compact = {"error": batch[first_key]["error"]}
        else:
            if args.llm:
                # Reconstruct from original wizard doc parameters already merged
                compact = engine.compact_wizard_with_llm(batch[first_key]["parameters"], scenario_name=first_key) if batch[first_key].get("parameters") else engine.compact_wizard_with_llm({}, scenario_name=first_key)
            else:
                compact = engine.compact_analysis(first_key, batch[first_key].get("parameters", {}))
        out2 = Path(args.export_compact)
        with out2.open("w", encoding="utf-8") as f:
            json.dump(compact, f, indent=2)
        print(f"Saved compact JSON to {out2.resolve()}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
