"""
Validation script for Part 3: Calculation Engine and Analysis Tools

Tests:
1. LCA calculation on manufacturing activity
2. Stage contribution analysis
3. Scenario comparison (baseline vs improved)
4. Sensitivity analysis on electricity
5. Visualization generation
"""

import json
from pathlib import Path
import brightway2 as bw

from src.engine.database_manager import AluminumDatabaseManager
from src.engine.calculator import AluminumLCACalculator
from src.utils.config import Config


def test_lca_calculation(calc, product):
    """Test 1: Basic LCA calculation"""
    print("\n" + "="*60)
    print("TEST 1: LCA Calculation")
    print("="*60)
    try:
        result = calc.calculate_impact(product, amount=1.0, method="gwp")
        print(f"✓ GWP Score: {result['score']:.4f} {result['unit']}")
        print(f"  Method: {result['method']}")
        print(f"  LCA object: {result['lca_object']}")
        return True, result
    except Exception as e:
        print(f"✗ FAILED: {e}")
        return False, None


def test_contribution_analysis(calc, product, lca_result):
    """Test 2: Stage contribution analysis"""
    print("\n" + "="*60)
    print("TEST 2: Stage Contribution Analysis")
    print("="*60)
    try:
        lca = lca_result["lca_object"]
        contributions = calc.analyze_stage_contributions(lca, product)
        print(f"✓ Contribution breakdown:")
        for stage, impact in contributions.items():
            print(f"  {stage:15s}: {impact:10.4f}")
        total = sum(contributions.values())
        print(f"  {'TOTAL':15s}: {total:10.4f}")
        return True, contributions
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def test_scenario_comparison(calc, base_params):
    """Test 3: Scenario comparison"""
    print("\n" + "="*60)
    print("TEST 3: Scenario Comparison")
    print("="*60)
    
    # Create two scenarios: baseline and improved (lower ore grade, lower electricity)
    scenarios = {
        "baseline": base_params,
        "improved": {
            **base_params,
            "smelting": {
                **base_params.get("smelting", {}),
                "electricity_kwh_per_kg": 12.0,  # reduced from default 13.5
            }
        }
    }
    
    try:
        results = calc.compare_scenarios(scenarios)
        print(f"✓ Scenario comparison results:")
        for name, data in results.items():
            print(f"\n  Scenario: {name}")
            print(f"    GWP (1000 kg): {data['impacts'].get('gwp', float('nan')):.2f}")
            print(f"    Water use:     {data['impacts'].get('water_use', float('nan')):.2f}")
            print(f"    Land use:      {data['impacts'].get('land_use', float('nan')):.2f}")
        return True, results
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def test_sensitivity_analysis(calc, base_params):
    """Test 4: Sensitivity analysis"""
    print("\n" + "="*60)
    print("TEST 4: Sensitivity Analysis")
    print("="*60)
    
    variable_params = {
        "smelting.electricity_kwh_per_kg": [11.0, 13.5, 16.0]
    }
    
    try:
        df = calc.sensitivity_analysis(base_params, variable_params)
        print(f"✓ Sensitivity analysis results:")
        print(df.to_string(index=False))
        return True, df
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def test_visualization(calc, contributions):
    """Test 5: Visualization generation"""
    print("\n" + "="*60)
    print("TEST 5: Visualization")
    print("="*60)
    
    try:
        fig = calc.visualize_contributions(contributions, title="Stage Contributions Test")
        output_path = Path("validation_output_contributions.png")
        fig.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"✓ Visualization saved to: {output_path.absolute()}")
        return True, output_path
    except Exception as e:
        print(f"✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def main():
    print("\n" + "="*60)
    print("PART 3 VALIDATION: Calculation Engine and Analysis Tools")
    print("="*60)
    
    # Setup
    print("\n[Setup] Building database and chain...")
    db_mgr = AluminumDatabaseManager()
    
    # Load default parameters
    params_path = Path("data/default_parameters.json")
    if params_path.exists():
        params = json.loads(params_path.read_text())
    else:
        params = {}
    
    full_params = {
        "mining": params.get("mining", {}),
        "refining": params.get("refining", {}),
        "smelting": params.get("smelting", {}),
        "beneficiation": {},
        "manufacturing": {},
        "recycling": params.get("recycling", {}),
        "waste": {}
    }
    
    product = db_mgr.build_complete_chain(full_params)
    print(f"✓ Product activity: {product['name']} ({product['code']})")
    
    calc = AluminumLCACalculator(db_mgr)
    print(f"✓ Calculator initialized")
    
    # Run tests
    results = {
        "lca_calculation": False,
        "contribution_analysis": False,
        "scenario_comparison": False,
        "sensitivity_analysis": False,
        "visualization": False,
    }
    
    success, lca_result = test_lca_calculation(calc, product)
    results["lca_calculation"] = success
    
    if success and lca_result:
        success, contributions = test_contribution_analysis(calc, product, lca_result)
        results["contribution_analysis"] = success
        
        if success and contributions:
            success, _ = test_visualization(calc, contributions)
            results["visualization"] = success
    
    success, _ = test_scenario_comparison(calc, full_params)
    results["scenario_comparison"] = success
    
    success, _ = test_sensitivity_analysis(calc, full_params)
    results["sensitivity_analysis"] = success
    
    # Summary
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:8s} {test_name}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    print(f"\nOverall: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 All Part 3 validations PASSED!")
        return 0
    else:
        print("\n⚠️  Some validations FAILED - check output above")
        return 1


if __name__ == "__main__":
    exit(main())
