from __future__ import annotations

from typing import Any, Dict, List


STAGE_NAMES: List[str] = [
    "mining",
    "beneficiation",
    "refining",
    "smelting",
    "manufacturing",
    "recycling",
    "valorization",
]


def _get_stage_sust(stage: Dict[str, Any] | None) -> Dict[str, Any]:
    if not isinstance(stage, dict):
        return {}
    sust = stage.get("sustainabilityParameters")
    return sust if isinstance(sust, dict) else {}


def extract_sustainability_parameters(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Collect per-stage sustainabilityParameters into a single structured block.

    Returns a dict like {stageName: {..sust fields..}, ...}.
    """
    result: Dict[str, Any] = {}
    for stage_name in STAGE_NAMES:
        stage = workflow.get(stage_name) or {}
        stage_sust = _get_stage_sust(stage)
        if stage_sust:
            result[stage_name] = stage_sust
    return result


def compute_circularity_indices(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Compute simple circularity vs linearity indices from workflow sustainability data.

    All values are in [0, 1]. If inputs are missing, defaults skew towards more linear.
    """
    manuf = workflow.get("manufacturing") or {}
    manuf_sust = _get_stage_sust(manuf)

    recycling = workflow.get("recycling") or {}
    rec_sust = _get_stage_sust(recycling)

    valor = workflow.get("valorization") or {}
    valor_sust = _get_stage_sust(valor)

    # Recycled content factor Cr
    recycled_content = None
    if isinstance(manuf_sust.get("recycled_content_percent"), (int, float)):
        recycled_content = manuf_sust["recycled_content_percent"]
    elif isinstance(recycling.get("scrapInputPercent"), (int, float)):
        recycled_content = recycling["scrapInputPercent"]

    if recycled_content is None:
        Cr = 0.0
    else:
        Cr = max(0.0, min(1.0, recycled_content / 100.0))

    # End-of-life recovery factor Ce
    collection_rate = rec_sust.get("collection_efficiency_percent")
    if not isinstance(collection_rate, (int, float)):
        collection_rate = recycling.get("collectionRatePercent")

    eff = rec_sust.get("recycling_efficiency_percent")
    if not isinstance(eff, (int, float)):
        eff = recycling.get("recyclingEfficiencyPercent")
    if not isinstance(eff, (int, float)):
        eff = recycling.get("recoveryYieldPercent")

    if isinstance(collection_rate, (int, float)) and isinstance(eff, (int, float)):
        Ce = max(0.0, min(1.0, (collection_rate / 100.0) * (eff / 100.0)))
    else:
        Ce = 0.0

    # Valorization factor Cv
    valor_rate = valor_sust.get("waste_valorization_rate_percent")
    if not isinstance(valor_rate, (int, float)):
        valor_rate = valor_sust.get("zero_waste_target_progress_percent")

    if isinstance(valor_rate, (int, float)):
        Cv = max(0.0, min(1.0, valor_rate / 100.0))
    else:
        Cv = 0.0

    if valor_sust.get("circular_economy_integration") is True:
        Cv = min(1.0, Cv + 0.1)

    # Weighted combination
    wr, we, wv = 0.4, 0.4, 0.2
    C = max(0.0, min(1.0, wr * Cr + we * Ce + wv * Cv))
    L = 1.0 - C

    return {
        "circularityIndex": C,
        "linearityIndex": L,
        "components": {
            "recycledContentFactor": Cr,
            "endOfLifeRecoveryFactor": Ce,
            "valorizationFactor": Cv,
        },
    }


def build_sankey_data(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Build a normalized material flow structure for Sankey diagrams.

    All flows are normalized to 1 tonne of final product.
    """
    manuf = workflow.get("manufacturing") or {}
    manuf_sust = _get_stage_sust(manuf)
    recycling = workflow.get("recycling") or {}
    rec_sust = _get_stage_sust(recycling)
    valor = workflow.get("valorization") or {}
    valor_sust = _get_stage_sust(valor)

    # Extract percentages with safe defaults
    def pct(val: Any, default: float = 0.0) -> float:
        return float(val) if isinstance(val, (int, float)) else default

    recycled_content_pct = pct(manuf_sust.get("recycled_content_percent"), pct(recycling.get("scrapInputPercent")))
    scrap_rate_pct = pct(manuf.get("scrapRate"))
    scrap_recovery_pct = pct(manuf_sust.get("scrap_recovery_rate"))

    collection_rate_pct = pct(rec_sust.get("collection_efficiency_percent"), pct(recycling.get("collectionRatePercent")))
    recycling_eff_pct = pct(rec_sust.get("recycling_efficiency_percent"), pct(recycling.get("recyclingEfficiencyPercent"), pct(recycling.get("recoveryYieldPercent"))))

    valorization_rate_pct = pct(valor_sust.get("waste_valorization_rate_percent"), pct(valor_sust.get("environmental_impact_reduction_percent")))

    # Normalize to fractions
    R = max(0.0, min(1.0, recycled_content_pct / 100.0))
    S = max(0.0, min(1.0, scrap_rate_pct / 100.0))
    Sr = max(0.0, min(1.0, scrap_recovery_pct / 100.0))
    Cr = max(0.0, min(1.0, collection_rate_pct / 100.0))
    Ry = max(0.0, min(1.0, recycling_eff_pct / 100.0))
    V = max(0.0, min(1.0, valorization_rate_pct / 100.0))

    final_product = 1.0

    primary_to_manuf = max(0.0, final_product * (1.0 - R))
    recycling_to_manuf = max(0.0, final_product * R)

    manuf_scrap = max(0.0, final_product * S)
    scrap_to_recycling = manuf_scrap * Sr
    scrap_to_loss = manuf_scrap * (1.0 - Sr)

    product_to_collection = final_product * Cr
    product_to_loss = final_product * (1.0 - Cr)

    collection_to_recycling = product_to_collection * Ry
    collection_loss = product_to_collection * (1.0 - Ry)

    waste_total = scrap_to_loss + product_to_loss + collection_loss
    waste_to_valorization = waste_total * V
    waste_to_landfill = waste_total * (1.0 - V)

    nodes: List[str] = [
        "Primary Production",
        "Recycling Input",
        "Manufacturing",
        "Manufacturing Scrap",
        "Product Use",
        "Post-use Collection",
        "Recycling Plant",
        "Valorization",
        "Landfill / Losses",
    ]

    # Helper to get node index
    node_index = {name: i for i, name in enumerate(nodes)}

    def link(src: str, dst: str, value: float) -> Dict[str, Any]:
        return {"source": node_index[src], "target": node_index[dst], "value": max(0.0, float(value))}

    links: List[Dict[str, Any]] = [
        link("Primary Production", "Manufacturing", primary_to_manuf),
        link("Recycling Input", "Manufacturing", recycling_to_manuf),
        link("Manufacturing", "Manufacturing Scrap", manuf_scrap),
        link("Manufacturing Scrap", "Recycling Plant", scrap_to_recycling),
        link("Manufacturing Scrap", "Landfill / Losses", scrap_to_loss),
        link("Manufacturing", "Product Use", final_product),
        link("Product Use", "Post-use Collection", product_to_collection),
        link("Product Use", "Landfill / Losses", product_to_loss),
        link("Post-use Collection", "Recycling Plant", collection_to_recycling),
        link("Post-use Collection", "Landfill / Losses", collection_loss),
        link("Recycling Plant", "Recycling Input", collection_to_recycling + scrap_to_recycling),
        link("Landfill / Losses", "Valorization", waste_to_valorization),
        link("Landfill / Losses", "Landfill / Losses", waste_to_landfill),
    ]

    return {
        "normalizationBasisTonnes": final_product,
        "nodes": nodes,
        "links": links,
    }
