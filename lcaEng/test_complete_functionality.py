"""
Complete Functionality Test for Aluminum LCA Engine
Tests all major components and features
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def test_imports():
    """Test 1: Verify all imports work"""
    print("\n" + "="*70)
    print("TEST 1: Imports")
    print("="*70)
    
    try:
        from src.utils.config import Config
        print("✓ Config imported")
        
        from src.engine.base_engine import BaseLCAManager
        print("✓ BaseLCAManager imported")
        
        from src.engine.database_manager import DatabaseManager, AluminumDatabaseManager
        print("✓ DatabaseManager imported")
        
        from src.engine.calculator import AluminumLCACalculator
        print("✓ AluminumLCACalculator imported")
        
        from src.engine.main_engine import AluminumLCAEngine
        print("✓ AluminumLCAEngine imported")
        
        from src.models.parameters import (
            MiningParameters, RefiningParameters, SmeltingParameters
        )
        print("✓ Parameter classes imported")
        
        from src.models.parameter_manager import ParameterManager
        print("✓ ParameterManager imported")
        
        print("\n✅ All imports successful")
        return True
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        return False


def test_brightway_setup():
    """Test 2: Verify Brightway2 setup"""
    print("\n" + "="*70)
    print("TEST 2: Brightway2 Setup")
    print("="*70)
    
    try:
        import brightway2 as bw
        from src.utils.config import Config
        
        # Check project
        print(f"✓ Current project: {bw.projects.current}")
        assert str(bw.projects.current) == Config.PROJECT_NAME
        
        # Check biosphere
        if Config.BIODB_NAME in bw.databases:
            print(f"✓ Biosphere database exists: {len(bw.Database(Config.BIODB_NAME))} flows")
        else:
            print("⚠ Biosphere database not found (will use placeholders)")
        
        print("\n✅ Brightway2 setup verified")
        return True
    except Exception as e:
        print(f"\n❌ Brightway2 setup failed: {e}")
        return False


def test_parameter_manager():
    """Test 3: Verify parameter management"""
    print("\n" + "="*70)
    print("TEST 3: Parameter Manager")
    print("="*70)
    
    try:
        from src.models.parameter_manager import ParameterManager
        
        pm = ParameterManager()
        print("✓ ParameterManager initialized")
        
        # Load defaults
        defaults = pm.load_default_parameters()
        print(f"✓ Default parameters loaded: {len(defaults)} stages")
        
        # Create scenario
        modifications = {
            "smelting": {"electricity_kwh_per_kg": 12.0}
        }
        scenario = pm.create_scenario_from_user_input(modifications)
        print(f"✓ Scenario created with modifications")
        assert scenario['smelting']['electricity_kwh_per_kg'] == 12.0
        
        # Validate
        is_valid, errors = pm.validate_parameters(scenario)
        print(f"✓ Validation: {'passed' if is_valid else 'failed'}")
        if not is_valid:
            print(f"  Errors: {errors}")
        
        # Get parameter info
        info = pm.get_parameter_info("smelting.electricity_kwh_per_kg")
        print(f"✓ Parameter info: {info['unit']}, range {info['typical_range']}")
        
        print("\n✅ Parameter manager working correctly")
        return True
    except Exception as e:
        print(f"\n❌ Parameter manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_creation():
    """Test 4: Verify database and chain creation"""
    print("\n" + "="*70)
    print("TEST 4: Database Creation")
    print("="*70)
    
    try:
        from src.engine.database_manager import AluminumDatabaseManager
        from src.models.parameter_manager import ParameterManager
        
        pm = ParameterManager()
        params = pm.load_default_parameters()
        
        db_manager = AluminumDatabaseManager()
        print("✓ Database manager initialized")
        
        # Build chain
        product = db_manager.build_complete_chain(params)
        print(f"✓ Production chain built: {product['name']}")
        print(f"  Code: {product['code']}")
        
        # Check exchanges
        exchanges = list(product.exchanges())
        print(f"✓ Product has {len(exchanges)} exchanges")
        
        # Verify stages
        import brightway2 as bw
        from src.utils.config import Config
        db = bw.Database(Config.ALUMINUM_DB_NAME)
        print(f"✓ Database contains {len(db)} activities")
        
        print("\n✅ Database creation successful")
        return True
    except Exception as e:
        print(f"\n❌ Database creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_lca_calculation():
    """Test 5: Verify LCA calculations"""
    print("\n" + "="*70)
    print("TEST 5: LCA Calculation")
    print("="*70)
    
    try:
        from src.engine.calculator import AluminumLCACalculator
        from src.engine.database_manager import AluminumDatabaseManager
        from src.models.parameter_manager import ParameterManager
        
        pm = ParameterManager()
        params = pm.load_default_parameters()
        
        db_manager = AluminumDatabaseManager()
        product = db_manager.build_complete_chain(params)
        
        calculator = AluminumLCACalculator(db_manager)
        print("✓ Calculator initialized")
        
        # Calculate impact
        result = calculator.calculate_impact(product, method_key='gwp')
        print(f"✓ GWP calculated: {result['score']:.2f} {result['unit']}")
        
        # Contribution analysis
        contributions = calculator.analyze_stage_contributions(product, method_key='gwp')
        print(f"✓ Contribution analysis: {len(contributions)} stages")
        for stage, contrib in list(contributions.items())[:3]:
            print(f"  - {stage}: {contrib:.2f}")
        
        print("\n✅ LCA calculation successful")
        return True
    except Exception as e:
        print(f"\n❌ LCA calculation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_main_engine():
    """Test 6: Verify main engine functionality"""
    print("\n" + "="*70)
    print("TEST 6: Main Engine")
    print("="*70)
    
    try:
        from src.engine.main_engine import AluminumLCAEngine
        
        engine = AluminumLCAEngine()
        print("✓ Main engine initialized")
        
        # Quick analysis
        result = engine.quick_analysis("Test Scenario")
        print("✓ Quick analysis completed")
        print(f"  GWP: {result['impacts']['gwp']['score']:.2f}")
        print(f"  Water: {result['impacts']['water_use']['score']:.2f}")
        print(f"  Land: {result['impacts']['land_use']['score']:.2f}")
        
        # Check contributions
        if 'contributions' in result:
            print(f"✓ Contributions available: {len(result['contributions'])} stages")
        
        print("\n✅ Main engine working correctly")
        return True
    except Exception as e:
        print(f"\n❌ Main engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_export_functionality():
    """Test 7: Verify export capabilities"""
    print("\n" + "="*70)
    print("TEST 7: Export Functionality")
    print("="*70)
    
    try:
        from src.engine.main_engine import AluminumLCAEngine
        from pathlib import Path
        
        engine = AluminumLCAEngine()
        
        # Run analysis
        scenarios = {
            "Test1": engine.param_manager.default_parameters,
            "Test2": engine.param_manager.create_scenario_from_user_input({
                "smelting": {"electricity_kwh_per_kg": 11.0}
            })
        }
        
        results = engine.batch_analysis(scenarios)
        print(f"✓ Batch analysis: {len(results)} scenarios")
        
        # Export Excel
        excel_file = "test_export.xlsx"
        engine.export_results(results, format='excel', filename='test_export')
        if Path(excel_file).exists():
            print(f"✓ Excel export created: {Path(excel_file).stat().st_size} bytes")
            Path(excel_file).unlink()  # Clean up
        
        # Export JSON
        json_file = "test_export.json"
        engine.export_results(results, format='json', filename='test_export')
        if Path(json_file).exists():
            print(f"✓ JSON export created: {Path(json_file).stat().st_size} bytes")
            Path(json_file).unlink()  # Clean up
        
        print("\n✅ Export functionality working")
        return True
    except Exception as e:
        print(f"\n❌ Export test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all functionality tests"""
    print("\n" + "="*70)
    print("ALUMINUM LCA ENGINE - COMPLETE FUNCTIONALITY TEST")
    print("="*70)
    
    tests = [
        ("Imports", test_imports),
        ("Brightway2 Setup", test_brightway_setup),
        ("Parameter Manager", test_parameter_manager),
        ("Database Creation", test_database_creation),
        ("LCA Calculation", test_lca_calculation),
        ("Main Engine", test_main_engine),
        ("Export Functionality", test_export_functionality),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results[name] = False
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("\n" + "="*70)
    print(f"RESULT: {passed}/{total} tests passed")
    print("="*70)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - SYSTEM FULLY FUNCTIONAL")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - review output above")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
