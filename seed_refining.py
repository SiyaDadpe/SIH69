from pymongo import MongoClient
from datetime import datetime
import os

# Use explicit URI matching your .env
MONGO_URI = os.environ.get("MONGODB_URI") or "mongodb+srv://hashim:HASHIM2004@cluster0.pymuxwb.mongodb.net/LCA?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client.get_database()  # Uses DB from URI (LCA)

payload = {
    'name': 'Test Workflow (Refining)',
    'metalType': 'Aluminium',
    'status': 'submitted',
    'createdAt': datetime.utcnow(),
    'updatedAt': datetime.utcnow(),
    'predictionMetadata': {
        'stepsWithPredictions': [],
        'generatedAt': None,
        'lastUpdatedAt': None,
    },
    'refining': {
        # Valid location from model features
        'location': 'Odisha',
        'redMudToxicity': 'Moderate',
        'processes': ['digestion','clarification'],
        'variants': ['heat_recovery'],
        # Leave numeric values missing to test defaults/medians
        'digestionTemperature': None,
        'digestionPressure': None,
        'causticConcentration': None,
        'processIntensityFactor': None,
        'techImprovementFactor': None,
        'operationalVariability': None,
    }
}

res = db['wizardworkflows'].insert_one(payload)
print(str(res.inserted_id))
