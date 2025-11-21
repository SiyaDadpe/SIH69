"""
Main Engine Interface for Aluminum LCA Engine

Provides high-level API for single and batch scenario analysis,
comparison reporting, and result export.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
import json

import pandas as pd
import brightway2 as bw

from .database_manager import AluminumDatabaseManager
from .calculator import AluminumLCACalculator
from ..models.parameter_manager import ParameterManager
from ..models.wizard_input_mapper import map_wizard_to_engine_params
from .compact_output import build_compact_output
from .llm_recommendations import generate_llm_recommendations


class AluminumLCAEngine:
    """High-level interface for aluminum LCA analysis."""
    
    def __init__(self):
        """Initialize the LCA engine with database, calculator, and parameter managers."""
        self.db_manager = AluminumDatabaseManager()
        self.calculator = AluminumLCACalculator(self.db_manager)
        self.param_manager = ParameterManager()
        print("✓ Aluminum LCA Engine initialized")
    
    # ---------- Single scenario analysis ----------
    def analyze_single_scenario(self, scenario_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Full analysis for a single scenario.
        
        Args:
            scenario_name: Name for this scenario
            parameters: Parameter dict for all stages
        
        Returns:
            Dict with scenario_name, product, impacts, contributions
        """
        print(f"\nAnalyzing scenario: {scenario_name}")
        
        # Validate parameters
        is_valid, errors = self.param_manager.validate_parameters(parameters)
        if not is_valid:
            print(f"Warning: Parameter validation issues: {errors}")
        
        # Build production system
        product = self.db_manager.build_complete_chain(parameters)
        print(f"  ✓ Built production chain for: {product.get('name', 'unknown')}")
        
        # Calculate impacts for multiple methods
        results = {}
        for method in ['gwp', 'water_use', 'land_use']:
            try:
                impact = self.calculator.calculate_impact(product, amount=1000.0, method=method)
                results[method] = impact
                print(f"  ✓ {method.upper()}: {impact['score']:.2f} {impact['unit']}")
            except Exception as e:
                print(f"  ⚠ {method.upper()} calculation failed: {e}")
                results[method] = {
                    'score': float('nan'),
                    'method': method,
                    'unit': 'N/A',
                    'lca_object': None
                }
        
        # Contribution analysis
        try:
            lca = results['gwp']['lca_object']
            contributions = self.calculator.analyze_stage_contributions(lca, product)
            print(f"  ✓ Contribution analysis complete")
        except Exception as e:
            print(f"  ⚠ Contribution analysis failed: {e}")
            contributions = {}
        
        return {
            'scenario_name': scenario_name,
            'product': product,
            'impacts': results,
            'contributions': contributions,
            'parameters': parameters,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    
    # ---------- Batch processing ----------
    def batch_analysis(self, scenarios_dict: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Process multiple scenarios efficiently.
        
        Args:
            scenarios_dict: Dict mapping scenario names to parameter dicts
        
        Returns:
            Dict mapping scenario names to analysis results
        """
        print(f"\n{'='*60}")
        print(f"BATCH ANALYSIS: {len(scenarios_dict)} scenarios")
        print(f"{'='*60}")
        
        results = {}
        
        for i, (scenario_name, parameters) in enumerate(scenarios_dict.items(), 1):
            print(f"\n[{i}/{len(scenarios_dict)}] Processing: {scenario_name}")
            try:
                result = self.analyze_single_scenario(scenario_name, parameters)
                results[scenario_name] = result
            except Exception as e:
                print(f"  ✗ Error processing {scenario_name}: {e}")
                import traceback
                traceback.print_exc()
                results[scenario_name] = {
                    'scenario_name': scenario_name,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                }
        
        print(f"\n{'='*60}")
        print(f"Batch analysis complete: {len([r for r in results.values() if 'error' not in r])}/{len(scenarios_dict)} successful")
        print(f"{'='*60}")
        
        return results
    
    # ---------- Reporting ----------
    def generate_comparison_report(self, batch_results: Dict[str, Any]) -> pd.DataFrame:
        """Generate comprehensive comparison report as DataFrame.
        
        Args:
            batch_results: Results from batch_analysis
        
        Returns:
            DataFrame with scenario comparison
        """
        report_data = []
        
        for scenario_name, result in batch_results.items():
            if 'error' in result:
                row = {
                    'Scenario': scenario_name,
                    'Status': 'Error',
                    'Error': result['error']
                }
            else:
                row = {
                    'Scenario': scenario_name,
                    'Status': 'Success'
                }
                
                # Add impact scores
                for method, impact_data in result['impacts'].items():
                    col_name = f"{method.upper().replace('_', ' ')} ({impact_data.get('unit', 'N/A')})"
                    row[col_name] = impact_data.get('score', float('nan'))
                
                # Add stage contributions
                if 'contributions' in result:
                    for stage, impact in result['contributions'].items():
                        row[f'{stage.title()} Contribution'] = impact
                    row['Total Contribution'] = sum(result['contributions'].values())
                
                report_data.append(row)
        
        return pd.DataFrame(report_data)
    
    def print_summary(self, batch_results: Dict[str, Any]):
        """Print a formatted summary of batch results to console."""
        print("\n" + "="*80)
        print("ALUMINUM LCA ANALYSIS SUMMARY")
        print("="*80)
        
        report = self.generate_comparison_report(batch_results)
        print(report.to_string(index=False))
        print("="*80 + "\n")
    
    # ---------- Export ----------
    def export_results(self, 
                      results: Dict[str, Any], 
                      format: str = 'excel', 
                      filename: Optional[str] = None,
                      output_dir: Optional[Path] = None,
                      include_parameters: bool = True) -> Path:
        """Export results to various formats.
        
        Args:
            results: Results from batch_analysis
            format: Export format ('excel' or 'json')
            filename: Output filename (without extension). Auto-generated if None.
            output_dir: Output directory. Current dir if None.
        
        Returns:
            Path to output file
        """
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"aluminum_lca_results_{timestamp}"
        
        if output_dir is None:
            output_dir = Path.cwd()
        else:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
        
        if format == 'excel':
            output_path = output_dir / f"{filename}.xlsx"
            self._export_excel(results, output_path)
        
        elif format == 'json':
            output_path = output_dir / f"{filename}.json"
            self._export_json(results, output_path, include_parameters=include_parameters)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        print(f"\n✓ Results exported to: {output_path.absolute()}")
        return output_path
    
    def _export_excel(self, results: Dict[str, Any], output_path: Path):
        """Export to Excel with multiple sheets."""
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Summary sheet
            summary_df = self.generate_comparison_report(results)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Detailed contributions sheet
            details_data = []
            for scenario, result in results.items():
                if 'error' not in result and 'contributions' in result:
                    for stage, impact in result['contributions'].items():
                        details_data.append({
                            'Scenario': scenario,
                            'Stage': stage,
                            'Impact (kg CO₂-eq)': impact
                        })
            
            if details_data:
                details_df = pd.DataFrame(details_data)
                details_df.to_excel(writer, sheet_name='Stage Contributions', index=False)
            
            # Impact method details sheet
            impacts_data = []
            for scenario, result in results.items():
                if 'error' not in result and 'impacts' in result:
                    row = {'Scenario': scenario}
                    for method, impact_data in result['impacts'].items():
                        row[f'{method}_score'] = impact_data.get('score', float('nan'))
                        row[f'{method}_unit'] = impact_data.get('unit', 'N/A')
                    impacts_data.append(row)
            
            if impacts_data:
                impacts_df = pd.DataFrame(impacts_data)
                impacts_df.to_excel(writer, sheet_name='Impact Details', index=False)
    
    def _serialize_results(self, results: Dict[str, Any], include_parameters: bool = True) -> Dict[str, Any]:
        serializable: Dict[str, Any] = {}
        for scenario, result in results.items():
            if 'error' in result:
                serializable[scenario] = {
                    'error': result['error'],
                    'timestamp': result.get('timestamp') or datetime.utcnow().isoformat() + 'Z'
                }
                continue
            product = result.get('product')
            impacts_out: Dict[str, Any] = {}
            placeholders_used = False
            for method, data in (result.get('impacts') or {}).items():
                score_val = data.get('score')
                try:
                    score_val = None if (score_val is None or pd.isna(score_val)) else float(score_val)
                except Exception:
                    score_val = None
                if data.get('lca_object') is None:
                    placeholders_used = True
                impacts_out[method] = {
                    'score': score_val,
                    'unit': data.get('unit'),
                }
            entry: Dict[str, Any] = {
                'scenario_name': result.get('scenario_name'),
                'product_code': product.get('code') if product else None,
                'impacts': impacts_out,
                'contributions': result.get('contributions', {}),
                'timestamp': result.get('timestamp') or datetime.utcnow().isoformat() + 'Z',
                'placeholders_used': placeholders_used,
                'methods_used': list(impacts_out.keys()),
            }
            if include_parameters and 'parameters' in result:
                entry['parameters'] = result['parameters']
            serializable[scenario] = entry
        return serializable

    def _export_json(self, results: Dict[str, Any], output_path: Path, include_parameters: bool = True):
        serializable_results = self._serialize_results(results, include_parameters=include_parameters)
        with open(output_path, 'w') as f:
            json.dump(serializable_results, f, indent=2)
    
    # ---------- Convenience methods ----------
    def quick_analysis(self, scenario_name: str = "Default", 
                      modifications: Optional[Dict[str, Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Quick single-scenario analysis with optional modifications.
        
        Args:
            scenario_name: Name for the scenario
            modifications: Optional modifications to default parameters
        
        Returns:
            Analysis result dict
        """
        if modifications:
            parameters = self.param_manager.create_scenario_from_user_input(modifications)
        else:
            parameters = self.param_manager.default_parameters
        
        return self.analyze_single_scenario(scenario_name, parameters)

    # ---------- Wizard JSON convenience ----------
    def analyze_wizard_document(self, doc: Dict[str, Any], scenario_name: str = "Wizard Scenario") -> Dict[str, Any]:
        """Accept a Wizard/Mongo-style JSON document, map it, and analyze.

        Args:
            doc: Wizard-style input dict
            scenario_name: Name to tag in results

        Returns:
            Single scenario analysis result dict
        """
        params = map_wizard_to_engine_params(doc)
        # Merge with defaults to keep unspecified stages sensible
        merged = self.param_manager.create_scenario_from_user_input(params)
        return self.analyze_single_scenario(scenario_name, merged)

    def analyze_to_json(self, scenarios: Dict[str, Dict[str, Any]], include_parameters: bool = True) -> Dict[str, Any]:
        raw = self.batch_analysis(scenarios)
        return self._serialize_results(raw, include_parameters=include_parameters)

    # ---------- Compact output (single scenario) ----------
    def compact_analysis(self, scenario_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single scenario and return compact aggregated JSON structure."""
        serialized = self._serialize_results({scenario_name: self.analyze_single_scenario(scenario_name, parameters)})
        return build_compact_output(serialized[scenario_name])

    def compact_wizard_document(self, doc: Dict[str, Any], scenario_name: str = "Wizard Scenario") -> Dict[str, Any]:
        params = map_wizard_to_engine_params(doc)
        merged = self.param_manager.create_scenario_from_user_input(params)
        return self.compact_analysis(scenario_name, merged)

    def compact_wizard_with_llm(self, doc: Dict[str, Any], scenario_name: str = "Wizard Scenario", include_rule_based: bool = True) -> Dict[str, Any]:
        """Return compact output merged with LLM recommendations.

        Structure:
        {
          "compact": <compact_doc>,
          "llm": { model, success, recommendations, raw_output },
          "rule_based": [...] (optional)
        }
        """
        compact_doc = self.compact_wizard_document(doc, scenario_name)
        llm = generate_llm_recommendations(compact_doc)
        result = {"compact": compact_doc, "llm": llm}
        if include_rule_based and llm.get("success") is False:
            # Provide underlying rule-based separately only if LLM failed
            result["rule_based"] = compact_doc.get("recommendations", [])
        return result
