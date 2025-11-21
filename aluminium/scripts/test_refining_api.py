"""
Test script for Refining API with MongoDB integration
Run this after starting the API server on port 5002
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5002"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing /health ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_model_info():
    """Test model info endpoint"""
    print("\n=== Testing /model-info ===")
    response = requests.get(f"{BASE_URL}/model-info")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_features():
    """Test features endpoint"""
    print("\n=== Testing /features ===")
    response = requests.get(f"{BASE_URL}/features")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total features: {data['count']}")
    print("Sample features:")
    for feature in data['features'][:5]:
        print(f"  - {feature['name']}: {feature['type']}")

def test_list_workflows():
    """List available workflows"""
    print("\n=== Testing /wizard (list workflows) ===")
    response = requests.get(f"{BASE_URL}/wizard?limit=5")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found {data['count']} workflows")
    for item in data['items']:
        print(f"  - {item['_id']}: {item['name']}")
    return data['items'][0]['_id'] if data['items'] else None

def test_get_refining(workflow_id):
    """Get refining object from workflow"""
    print(f"\n=== Testing /wizard/{workflow_id}/refining ===")
    response = requests.get(f"{BASE_URL}/wizard/{workflow_id}/refining")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Collection: {data['collection']}")
        print(f"Metal Type: {data['metalType']}")
        print(f"Refining object keys: {list(data['refining'].keys())}")
    else:
        print(response.json())

def test_refining_metadata(workflow_id):
    """Test metadata analysis endpoint"""
    print(f"\n=== Testing /wizard/{workflow_id}/refining/metadata ===")
    response = requests.get(f"{BASE_URL}/wizard/{workflow_id}/refining/metadata")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Analysis:")
        print(f"  Total Expected Fields: {data['analysis']['totalExpectedFields']}")
        print(f"  Present Fields: {data['analysis']['presentFields']}")
        print(f"  Missing Fields: {data['analysis']['missingFields']}")
        print(f"\nMissing Fields:")
        for field in data['missingFields']:
            print(f"  - {field['name']} ({field['type']})")
        print(f"\nProposed Defaults:")
        print(json.dumps(data['proposedDefaults'], indent=2))
        print(f"\nAvailable Options:")
        print(f"  Locations: {data['availableOptions']['locations'][:5]}... ({len(data['availableOptions']['locations'])} total)")
        print(f"  Toxicity Levels: {data['availableOptions']['toxicityLevels']}")
        print(f"  Processes: {data['availableOptions']['processes']}")
        print(f"  Variants: {data['availableOptions']['variants']}")
    else:
        print(response.json())

def test_direct_predict():
    """Test direct prediction endpoint"""
    print("\n=== Testing /predict (direct prediction) ===")
    # Sample input with all required fields
    sample_input = {
        "process_crushing": 1,
        "process_digestion": 1,
        "process_clarification": 1,
        "process_precipitation": 1,
        "process_calcination": 0,
        "variant_high_pressure": 1,
        "variant_multi_stage": 0,
        "variant_heat_recovery": 1,
        "variant_green_add": 0,
        "variant_automation": 1,
        "digestionTemperature": 145.0,
        "digestionPressure": 5.2,
        "causticConcentration": 250.0,
        "processIntensityFactor": 0.85,
        "techImprovementFactor": 0.92,
        "operationalVariability": 0.15,
        "location": "China",
        "toxicity_Red_Mud": "Moderate"
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=sample_input)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Timestamp: {data['timestamp']}")
        print(f"Predictions:")
        for target, pred in data['predictions'].items():
            print(f"  {target}: {pred['prediction']:.4f} (confidence: {pred.get('confidence', 'N/A')})")
    else:
        print(response.json())

def test_predict_and_save(workflow_id):
    """Test predict-and-save endpoint"""
    print(f"\n=== Testing /wizard/{workflow_id}/refining/predict-and-save ===")
    response = requests.post(f"{BASE_URL}/wizard/{workflow_id}/refining/predict-and-save")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data['success']}")
        print(f"Updated Fields: {data['updatedFields']}")
        print(f"Average Confidence: {data['avgConfidence']}")
        print(f"Timestamp: {data['timestamp']}")
    else:
        print(response.json())

def main():
    """Run all tests"""
    print("=" * 60)
    print("Refining API Test Suite")
    print("=" * 60)
    
    # Test basic endpoints
    test_health()
    test_model_info()
    test_features()
    
    # Test MongoDB endpoints
    workflow_id = test_list_workflows()
    
    if workflow_id:
        test_get_refining(workflow_id)
        test_refining_metadata(workflow_id)
        # Uncomment to test predict-and-save (writes to DB)
        # test_predict_and_save(workflow_id)
    else:
        print("\n⚠ No workflows found in database. Skipping workflow-specific tests.")
    
    # Test direct prediction
    test_direct_predict()
    
    print("\n" + "=" * 60)
    print("Test suite complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
