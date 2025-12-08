"""
Demonstration of Aluminum LCA Engine Full Capabilities

This script demonstrates:
1. Single scenario analysis
2. Batch processing of multiple scenarios
3. Comparison reporting
4. Export to Excel and JSON
5. Visualization
"""

import sys
from pathlib import Path

# Add parent directory to path to import src modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.engine.main_engine import AluminumLCAEngine


def run_demonstration():
    """Demonstrate the full capabilities of the Aluminum LCA Engine."""
    
    print("\n" + "="*80)
    print(" "*20 + "ALUMINUM LCA ENGINE DEMONSTRATION")
    print("="*80)
    
    # Initialize engine
    print("\n[1] Initializing Aluminum LCA Engine...")
    engine = AluminumLCAEngine()
    
    # Define different scenarios
    print("\n[2] Defining scenarios...")
    
    # Baseline scenario with defaults
    baseline_params = engine.param_manager.default_parameters
    
    # Renewable energy scenario
    renewable_params = engine.param_manager.create_scenario_from_user_input({
        "smelting": {
            "electricity_kwh_per_kg": 13.2,
            "electricity_source": "hydro",
            "co2_emissions": 1.2  # Lower due to cleaner energy
        }
    })
    
    # High recycling scenario
    high_recycling_params = engine.param_manager.create_scenario_from_user_input({
        "recycling": {
            "scrap_input_fraction": 0.75,
            "electricity_kwh_per_kg": 0.6,
            "recovery_yield": 0.95
        },
        "smelting": {
            "electricity_kwh_per_kg": 11.0  # Lower due to more recycled content
        }
    })
    
    # Improved efficiency scenario
    efficiency_params = engine.param_manager.create_scenario_from_user_input({
        "mining": {
            "Water Usage (m³ per tonne of ore)": 1.5,  # Reduced from 2.5
            "Ore Grade (%)": 50  # Higher grade = less processing
        },
        "smelting": {
            "electricity_kwh_per_kg": 12.5,  # Best available technology
            "co2_emissions": 1.3
        },
        "manufacturing": {
            "yield_rate": 0.99,  # Improved efficiency
            "electricity_kwh_per_kg": 0.6
        }
    })
    
    scenarios = {
        "Baseline": baseline_params,
        "Renewable Energy": renewable_params,
        "High Recycling": high_recycling_params,
        "Improved Efficiency": efficiency_params
    }
    
    print(f"✓ Defined {len(scenarios)} scenarios:")
    for name in scenarios.keys():
        print(f"  - {name}")
    
    # Run batch analysis
    print("\n[3] Running batch LCA analysis...")
    results = engine.batch_analysis(scenarios)
    
    # Print summary
    print("\n[4] Generating comparison report...")
    engine.print_summary(results)
    
    # Export results
    print("\n[5] Exporting results...")
    
    # Export to Excel
    excel_path = engine.export_results(results, format='excel', filename='demo_results')
    
    # Export to JSON
    json_path = engine.export_results(results, format='json', filename='demo_results')
    
    # Generate visualizations for each scenario
    print("\n[6] Generating visualizations...")
    for scenario_name, result in results.items():
        if 'error' not in result and 'contributions' in result:
            try:
                fig = engine.calculator.visualize_contributions(
                    result['contributions'],
                    title=f"Stage Contributions - {scenario_name}"
                )
                output_path = Path(f"demo_viz_{scenario_name.replace(' ', '_').lower()}.png")
                fig.savefig(output_path, dpi=150, bbox_inches='tight')
                print(f"  ✓ Saved visualization: {output_path}")
            except Exception as e:
                print(f"  ⚠ Visualization failed for {scenario_name}: {e}")
    
    # Sensitivity analysis example
    print("\n[7] Running sensitivity analysis (electricity variation)...")
    try:
        variable_params = {
            "smelting.electricity_kwh_per_kg": [11.0, 12.0, 13.5, 15.0, 17.0]
        }
        sensitivity_df = engine.calculator.sensitivity_analysis(
            baseline_params,
            variable_params
        )
        print("\nSensitivity Analysis Results:")
        print(sensitivity_df.to_string(index=False))
        
        # Save sensitivity results
        sensitivity_df.to_excel("demo_sensitivity_analysis.xlsx", index=False)
        print("\n✓ Sensitivity analysis saved to: demo_sensitivity_analysis.xlsx")
    except Exception as e:
        print(f"  ⚠ Sensitivity analysis failed: {e}")
    
    # Summary
    print("\n" + "="*80)
    print("DEMONSTRATION COMPLETE")
    print("="*80)
    print("\nGenerated files:")
    print(f"  - {excel_path}")
    print(f"  - {json_path}")
    print(f"  - demo_viz_*.png (visualization charts)")
    print(f"  - demo_sensitivity_analysis.xlsx")
    print("\nThe Aluminum LCA Engine is ready for use!")
    print("="*80 + "\n")
    
    return results


def run_quick_example():
    """Quick example of single scenario analysis."""
    print("\n" + "="*80)
    print(" "*25 + "QUICK EXAMPLE")
    print("="*80)
    
    engine = AluminumLCAEngine()
    
    # Run quick analysis with modifications
    result = engine.quick_analysis(
        scenario_name="Quick Test",
        modifications={
            "smelting": {
                "electricity_kwh_per_kg": 12.0,
                "electricity_source": "renewable"
            }
        }
    )
    
    print(f"\n✓ Analysis complete for: {result['scenario_name']}")
    print(f"  GWP Score: {result['impacts']['gwp']['score']:.2f} {result['impacts']['gwp']['unit']}")
    print("\n" + "="*80 + "\n")
    
    return result


if __name__ == "__main__":
    # Run full demonstration
    results = run_demonstration()
    
    # Optionally run quick example
    # quick_result = run_quick_example()
