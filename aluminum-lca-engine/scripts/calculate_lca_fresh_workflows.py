"""Continuous LCA Calculator for Workflows

This script runs continuously in a loop, processing ALL workflows from
wizardworkflowoutputs and writing LCA results to LCA.calculatelca collection.
It repeats the processing cycle indefinitely.

The output structure includes:
- General project information at the top level
- Stage-specific LCA parameters nested in separate objects (mining, beneficiation, etc.)

Usage (PowerShell):
    # Using environment variable
    $env:MONGO_URI="<uri>"; python -m scripts.calculate_lca_fresh_workflows --llm

    # With custom interval between cycles
    python -m scripts.calculate_lca_fresh_workflows --mongo-uri "<uri>" --interval 30

Flags:
  --db                Mongo DB name (default: LCA)
  --source            Source collection (default: wizardworkflowoutputs)
  --target            Target collection (default: calculatelca)
  --mongo-uri         MongoDB connection URI (overrides env/.env)
  --llm               Include Gemini-based recommendations when GEMINI_API_KEY set
  --interval N        Seconds to wait between processing cycles (default: 10)
  --dry-run           Do not write to DB; just print summary counts
"""

from __future__ import annotations

import argparse
import time
from datetime import datetime
from typing import Any, Dict, List

from bson import ObjectId

from src.utils.mongo_client import get_mongo_client
from src.engine.main_engine import AluminumLCAEngine
from src.engine.circularity import (
    extract_sustainability_parameters,
    compute_circularity_indices,
    build_sankey_data,
)
from scripts.calculate_lca_by_id import _trim_recommendations  # reuse


def _now_ms() -> int:
    """Get current timestamp in milliseconds."""
    return int(datetime.utcnow().timestamp() * 1000)


def build_lca_output_doc(
    source: Dict[str, Any],
    compact: Dict[str, Any],
    llm_block: Dict[str, Any] | None,
    use_llm: bool
) -> Dict[str, Any]:
    """Build structured LCA output document with general info + stage-specific objects.
    
    Args:
        source: Source workflow document from wizardworkflowoutputs
        compact: Compact LCA calculation result
        llm_block: LLM recommendations block (if available)
        use_llm: Whether to include LLM recommendations
    
    Returns:
        Structured document ready for insertion into calculatelcas collection
    """
    workflow_id = source.get("workflowId")
    if not workflow_id:
        raise ValueError("Source doc missing workflowId")
    
    now_ms = _now_ms()
    
    # ========== GENERAL PROJECT INFORMATION ==========
    doc = {
        "_id": workflow_id,  # Use workflowId as primary key
        "workflowId": workflow_id,
        "userId": source.get("userId"),
        "projectName": source.get("name", f"Workflow-{workflow_id}"),
        "metalType": source.get("metalType", "Aluminium"),
        "location": source.get("location", "Not specified"),
        "analysisDate": {"$date": {"$numberLong": str(now_ms)}},
        "createdAt": {"$date": {"$numberLong": str(now_ms)}},
        "updatedAt": {"$date": {"$numberLong": str(now_ms)}},
        "status": "completed",
        
        # ========== OVERALL LCA METRICS ==========
        "totalEnergyConsumption": compact.get("totalEnergyConsumption", 0),
        "totalCO2Emissions": compact.get("totalCO2Emissions", 0),
        "totalWaterUsage": compact.get("totalWaterUsage", 0),
        "totalWasteGeneration": compact.get("totalWasteGeneration", 0),
        "totalAirQualityImpact": compact.get("totalAirQualityImpact", 0),
        
        # Intensity metrics
        "energyIntensity": compact.get("energyIntensity", 0),
        "carbonIntensity": compact.get("carbonIntensity", 0),
        
        # Circularity metrics
        "circularityScore": compact.get("circularityScore", 0),
        "circularityRating": _get_circularity_rating(compact.get("circularityScore", 0)),
        "materialRecoveryRate": compact.get("materialRecoveryRate", 0),
        
        # ========== STAGE-SPECIFIC LCA PARAMETERS ==========
        # Each stage has its own object with relevant LCA metrics
        "lcaStages": {}
    }
    
    # Extract stage-specific data from compact output
    stage_data_list = compact.get("stageData", [])
    for stage_info in stage_data_list:
        stage_name = stage_info.get("stageName")
        if stage_name:
            doc["lcaStages"][stage_name] = {
                "energyConsumption": stage_info.get("energyConsumption", 0),
                "co2Emissions": stage_info.get("co2Emissions", 0),
                "waterUsage": stage_info.get("waterUsage", 0),
                "wasteGeneration": stage_info.get("wasteGeneration", 0),
                "airQualityImpact": stage_info.get("airQualityImpact", 0),
                "completed": stage_info.get("completed", False),
                # Include stage-specific parameters from source
                "parameters": source.get(stage_name, {})
            }

    # Ensure all known stages exist so frontend analytics never see missing keys
    default_stage_template = {
        "energyConsumption": 0,
        "co2Emissions": 0,
        "waterUsage": 0,
        "wasteGeneration": 0,
        "airQualityImpact": 0,
        "completed": False,
        "parameters": {},
    }
    for stage_name in [
        "mining",
        "beneficiation",
        "refining",
        "smelting",
        "manufacturing",
        "recycling",
        "valorization",
    ]:
        if stage_name not in doc["lcaStages"]:
            # Merge defaults with any raw parameters present in the source doc
            stage_block = default_stage_template.copy()
            stage_block["parameters"] = source.get(stage_name, {}) or {}
            doc["lcaStages"][stage_name] = stage_block
    
    # ========== IMPACT BREAKDOWN ==========
    impact_breakdown = compact.get("impactBreakdown", [])
    if impact_breakdown:
        doc["impactBreakdown"] = impact_breakdown

    # ========== SUSTAINABILITY PARAMETERS (UNIONED) ==========
    sust = extract_sustainability_parameters(source)
    if sust:
        doc["sustainabilityParameters"] = sust

    # ========== CIRCULARITY & LINEARITY INDICES ==========
    circ = compute_circularity_indices(source)
    doc["circularityIndex"] = circ.get("circularityIndex", 0.0)
    doc["linearityIndex"] = circ.get("linearityIndex", 1.0 - doc["circularityIndex"])
    components = circ.get("components")
    if isinstance(components, dict):
        doc["circularityComponents"] = components

    # ========== SANKEY DATA FOR CIRCULARITY FLOWS ==========
    sankey = build_sankey_data(source)
    if isinstance(sankey, dict):
        # Ensure minimum shape expected by frontend (nodes/links arrays)
        nodes = sankey.get("nodes") if isinstance(sankey.get("nodes"), list) else []
        links = sankey.get("links") if isinstance(sankey.get("links"), list) else []
        normalized = dict(sankey)
        normalized["nodes"] = nodes
        normalized["links"] = links
        doc["sankeyData"] = normalized
    else:
        # Provide empty structure so consumers can safely render/fallback
        doc["sankeyData"] = {"nodes": [], "links": []}

    # ========== RECOMMENDATIONS ==========
    if use_llm and llm_block and llm_block.get("success") and isinstance(llm_block.get("recommendations"), list):
        doc["recommendations"] = _trim_recommendations(llm_block["recommendations"])
    else:
        # Use recommendations from compact output or empty list
        recommendations = compact.get("recommendations", [])
        if isinstance(recommendations, list):
            doc["recommendations"] = _trim_recommendations(recommendations)
        else:
            doc["recommendations"] = []
    
    # ========== METADATA ==========
    doc["metadata"] = {
        "calculationEngine": "Aluminum LCA Engine v1.0",
        "calculationTimestamp": datetime.utcnow().isoformat() + 'Z',
        "sourceCollection": "wizardworkflowoutputs",
        "lcaMethodology": "Brightway2",
        "impactCategories": ["GWP", "Water Use", "Land Use"]
    }
    
    return doc


def _get_circularity_rating(score: float) -> str:
    """Convert circularity score to rating."""
    if score >= 80:
        return 'Excellent'
    elif score >= 65:
        return 'Good'
    elif score >= 45:
        return 'Fair'
    elif score >= 25:
        return 'Poor'
    else:
        return 'Very Poor'


def main():
    parser = argparse.ArgumentParser(
        description="Continuously calculate LCA for all workflows"
    )
    parser.add_argument("--db", default="LCA", help="Mongo DB name (default: LCA)")
    parser.add_argument(
        "--source", default="wizardworkflowoutputs", help="Source collection"
    )
    parser.add_argument(
        "--target", default="calculatelca", help="Target collection"
    )
    parser.add_argument(
        "--mongo-uri",
        dest="mongo_uri",
        default=None,
        help="MongoDB URI (overrides env/.env)",
    )
    parser.add_argument(
        "--llm", action="store_true", help="Include LLM recommendations"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=10,
        help="Seconds to wait between processing cycles (default: 10)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write to DB; just show summary",
    )
    args = parser.parse_args()

    # Connect to MongoDB
    client = get_mongo_client(uri=args.mongo_uri)
    db = client[args.db]
    src = db[args.source]
    tgt = db[args.target]

    # Initialize LCA engine once
    engine = AluminumLCAEngine()
    
    print(f"\n{'='*70}")
    print(f"CONTINUOUS LCA PROCESSING - Running indefinitely")
    print(f"Database: {args.db}")
    print(f"Source: {args.source} → Target: {args.target}")
    print(f"Interval: {args.interval} seconds between cycles")
    print(f"{'='*70}\n")
    
    cycle_number = 0
    
    # Run continuously
    while True:
        cycle_number += 1
        cycle_start = datetime.utcnow()
        
        print(f"\n{'='*70}")
        print(f"CYCLE #{cycle_number} - {cycle_start.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"{'='*70}\n")
        
        # Query for ALL workflows - get latest document for each workflowId
        pipeline = [
            {
                "$sort": {"updatedAt": -1}
            },
            {
                "$group": {
                    "_id": "$workflowId",
                    "latestDoc": {"$first": "$$ROOT"}
                }
            }
        ]

        try:
            workflows = list(src.aggregate(pipeline))
            
            if not workflows:
                print("No workflows found in collection.")
            else:
                print(f"Found {len(workflows)} workflow(s) to process\n")
                
                processed = 0
                failures = 0

                # Process each workflow
                for item in workflows:
                    doc = item["latestDoc"]
                    wf_id = item["_id"]
                    name = doc.get("name") or f"Workflow-{wf_id}"
                    
                    print(f"Processing: {name} (ID: {wf_id})")
                    
                    try:
                        # Calculate LCA with optional LLM recommendations
                        if args.llm:
                            wrapper = engine.compact_wizard_with_llm(doc, scenario_name=name)
                            compact = wrapper.get("compact", {})
                            llm_block = wrapper.get("llm")
                        else:
                            compact = engine.compact_wizard_document(doc, scenario_name=name)
                            llm_block = None
                        
                        # Build structured output document
                        lca_output = build_lca_output_doc(doc, compact, llm_block, use_llm=args.llm)
                        
                        # Write to target collection (upsert by workflowId)
                        if not args.dry_run:
                            tgt.replace_one({"_id": wf_id}, lca_output, upsert=True)
                            print(f"  ✓ LCA calculated and saved")
                        else:
                            print(f"  ✓ LCA calculated (dry-run, not saved)")
                        
                        processed += 1
                        
                        # Print key metrics
                        print(f"  📊 Total Energy: {lca_output['totalEnergyConsumption']:.2f} kWh")
                        print(f"  📊 Total CO2: {lca_output['totalCO2Emissions']:.2f} kg")
                        print(f"  📊 Circularity Score: {lca_output['circularityScore']:.1f}/100")
                        print(f"  📊 Stages: {len(lca_output['lcaStages'])}")
                        print()
                        
                    except Exception as e:
                        print(f"  ✗ Failed: {e}")
                        failures += 1
                        print()

                # Print cycle summary
                cycle_duration = (datetime.utcnow() - cycle_start).total_seconds()
                print(f"{'='*70}")
                print(f"CYCLE #{cycle_number} COMPLETE")
                print(f"{'='*70}")
                print(f"  Workflows processed: {processed}")
                print(f"  Failures: {failures}")
                print(f"  Cycle duration: {cycle_duration:.2f} seconds")
                if args.dry_run:
                    print("  (Dry run - no writes performed)")
                else:
                    print(f"  Results written to: {args.db}.{args.target}")
                print(f"{'='*70}\n")
                
        except Exception as e:
            print(f"ERROR in cycle #{cycle_number}: {e}\n")
        
        # Wait before next cycle
        print(f"⏳ Waiting {args.interval} seconds before next cycle...\n")
        time.sleep(args.interval)
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
