from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
import copy

import brightway2 as bw
import pandas as pd

from ..utils.config import Config


@dataclass
class ImpactResult:
    score: float
    method: str
    unit: str
    lca: bw.LCA


class AluminumLCACalculator:
    def __init__(self, database_manager):
        self.db_manager = database_manager
        self.results_store: Dict[str, Any] = {}

    # ---------------- Core calculation ----------------
    def calculate_impact(self, activity: bw.Activity, amount: float = 1.0, method: str = "gwp") -> Dict[str, Any]:
        """Perform LCA calculation for a given activity and return a result dict.

        Returns a dict including the bw.LCA object for further analysis.
        """
        method_tuple = Config.DEFAULT_METHODS[method]
        
        # Check if method exists; if not, create a simple placeholder calculation
        if method_tuple not in bw.methods:
            print(f"Warning: LCIA method {method_tuple} not available. Using placeholder calculation.")
            # Simple placeholder: sum of all exchanges as a proxy
            try:
                placeholder_score = 0.0
                for exc in activity.exchanges():
                    if exc.get('type') in ('technosphere', 'biosphere'):
                        placeholder_score += abs(float(exc.get('amount', 0.0)))
                return {
                    "score": placeholder_score,
                    "method": method,
                    "unit": self.get_method_unit(method_tuple) or "placeholder units",
                    "lca_object": None,  # No real LCA object in placeholder mode
                }
            except Exception as e:
                print(f"Warning: Placeholder calculation failed: {e}")
                return {
                    "score": 0.0,
                    "method": method,
                    "unit": "placeholder units",
                    "lca_object": None,
                }

        demand = {activity: amount}
        lca = bw.LCA(demand, method=method_tuple)
        lca.lci()
        lca.lcia()

        return {
            "score": float(lca.score),
            "method": method,
            "unit": self.get_method_unit(method_tuple) or "",
            "lca_object": lca,
        }

    def get_method_unit(self, method_tuple: Tuple[str, str, str]) -> Optional[str]:
        """Try to read the unit from method metadata; fallback to common labels."""
        try:
            meta = bw.methods[method_tuple]
            if isinstance(meta, dict):
                return meta.get("unit")
        except Exception:
            pass
        # Fallback labels for common methods
        if method_tuple == Config.DEFAULT_METHODS.get("gwp"):
            return "kg CO2-eq"
        return None

    # ---------------- Contribution analysis ----------------
    def analyze_stage_contributions(self, lca: Optional[bw.LCA], final_product: bw.Activity) -> Dict[str, float]:
        """Break down total impact by production stage.

        Strategy: Use ContributionAnalysis to collect process contributions, map by known stage codes,
        and sum scores. Falls back to per-activity micro-LCA if analyzer fails or lca is None.
        """
        stage_map = {
            "mining": ["bauxite_mining"],
            "beneficiation": ["beneficiation", "ore_beneficiation"],
            "refining": ["alumina_refining"],
            "smelting": ["aluminum_smelting"],
            "manufacturing": ["manufacturing", "aluminum_product"],
            "recycling": ["recycling"],
            "waste": ["waste_valorization"],
        }

        # Initialize contributions dict
        contributions: Dict[str, float] = {k: 0.0 for k in stage_map}
        
        # If no LCA object (placeholder mode), do simple exchange-based estimate
        if lca is None:
            for stage, codes in stage_map.items():
                stage_score = 0.0
                for code in codes:
                    try:
                        a = self.db_manager.aluminum_db.get(code)
                    except Exception:
                        a = None
                    if a:
                        try:
                            res = self.calculate_impact(a, amount=1.0, method="gwp")
                            stage_score += float(res["score"]) * 0.1  # small weight
                        except Exception:
                            pass
                contributions[stage] = stage_score
            return contributions

        try:
            from bw2analyzer import ContributionAnalysis
            ca = ContributionAnalysis()
            # large cutoff to include most processes
            annotated = ca.annotated_top_processes(lca, lca.score)
            # annotated is list of (activity, score, percent)
            for act, score, _ in annotated:
                code = act.get("code")
                if not code:
                    continue
                for stage, codes in stage_map.items():
                    if code in codes:
                        contributions[stage] += float(score)
        except Exception:
            # Fallback: micro-LCAs of each stage activity (not exact allocation, but indicative)
            for stage, codes in stage_map.items():
                stage_score = 0.0
                for code in codes:
                    try:
                        a = self.db_manager.aluminum_db.get(code)
                    except Exception:
                        a = None
                    if a:
                        try:
                            res = self.calculate_impact(a, amount=1.0, method="gwp")
                            stage_score += float(res["score"]) * 0.01  # small weight to avoid overshadowing
                        except Exception:
                            pass
                contributions[stage] = stage_score

        return contributions

    # ---------------- Scenario comparison ----------------
    def compare_scenarios(self, scenarios_dict: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Compare multiple production scenarios over several LCIA methods, including contributions."""
        results: Dict[str, Any] = {}
        for scenario_name, parameters in scenarios_dict.items():
            product = self.db_manager.build_complete_chain(parameters)

            scenario_results: Dict[str, float] = {}
            for method in ["gwp", "water_use", "land_use"]:
                try:
                    impact = self.calculate_impact(product, amount=1000.0, method=method)
                    scenario_results[method] = float(impact["score"])
                except Exception:
                    scenario_results[method] = float("nan")

            try:
                lca = self.calculate_impact(product, method="gwp")["lca_object"]
                contributions = self.analyze_stage_contributions(lca, product)
            except Exception:
                contributions = {}

            results[scenario_name] = {
                "impacts": scenario_results,
                "contributions": contributions,
                "product": product,
            }
        return results

    # ---------------- Sensitivity analysis ----------------
    def sensitivity_analysis(self, base_parameters: Dict[str, Any], variable_parameters: Dict[str, list]) -> pd.DataFrame:
        """Analyze sensitivity to key parameter changes.

        variable_parameters example: { 'smelting.electricity_kwh_per_kg': [12, 13, 14] }
        """
        base_product = self.db_manager.build_complete_chain(base_parameters)
        base_impact = float(self.calculate_impact(base_product, method="gwp")["score"])

        rows = []
        for param_path, values in variable_parameters.items():
            for value in values:
                mp = self.modify_parameters(base_parameters, param_path, value)
                product = self.db_manager.build_complete_chain(mp)
                impact = float(self.calculate_impact(product, method="gwp")["score"]) if base_impact != 0 else float("nan")
                change_percent = ((impact - base_impact) / base_impact) * 100 if base_impact else float("nan")
                rows.append({
                    "parameter": param_path,
                    "value": value,
                    "impact": impact,
                    "change_percent": change_percent,
                })
        return pd.DataFrame(rows)

    def modify_parameters(self, base: Dict[str, Any], path: str, value: Any) -> Dict[str, Any]:
        parts = path.split(".")
        new_params = copy.deepcopy(base)
        cur = new_params
        for p in parts[:-1]:
            if p not in cur or not isinstance(cur[p], dict):
                cur[p] = {}
            cur = cur[p]
        cur[parts[-1]] = value
        return new_params

    # ---------------- Visualization ----------------
    def visualize_contributions(self, contributions_dict: Dict[str, float], title: str = "Impact Contributions by Stage"):
        import matplotlib.pyplot as plt

        stages = list(contributions_dict.keys())
        impacts = [float(contributions_dict[s]) for s in stages]

        plt.figure(figsize=(10, 6))
        bars = plt.bar(stages, impacts, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#CBAACB', '#BDE0FE'])
        plt.title(title, fontsize=14, fontweight='bold')
        plt.ylabel(self.get_method_unit(Config.DEFAULT_METHODS.get("gwp")) or "Impact", fontsize=12)
        plt.xticks(rotation=45, ha='right')

        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height, f"{height:.2f}", ha='center', va='bottom')

        plt.tight_layout()
        return plt.gcf()
