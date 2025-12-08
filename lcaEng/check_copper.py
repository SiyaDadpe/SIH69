from pymongo import MongoClient

uri = "mongodb+srv://hashim:HASHIM2004@cluster0.pymuxwb.mongodb.net/LCA?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client['LCA']
collection = db['wizardworkflowoutputs']

print("Checking for copper workflows...")
print(f"Total documents: {collection.count_documents({})}")
print(f"\nDocuments with metalType field: {collection.count_documents({'metalType': {'$exists': True}})}")

# Check all unique metalType values
pipeline = [
    {"$group": {"_id": "$metalType", "count": {"$sum": 1}}}
]
metal_types = list(collection.aggregate(pipeline))
print(f"\nAll metalType values found:")
for mt in metal_types:
    print(f"  '{mt['_id']}': {mt['count']} documents")

# Try to find copper with case-insensitive search
copper_docs = list(collection.find({"metalType": {"$regex": "^copper$", "$options": "i"}}, {"_id": 1, "name": 1, "metalType": 1}).limit(3))
print(f"\nCopper workflows (case-insensitive): {len(copper_docs)}")
for doc in copper_docs:
    print(f"  {doc}")

# Try exact match
copper_exact = list(collection.find({"metalType": "Copper"}, {"_id": 1, "name": 1, "metalType": 1}).limit(3))
print(f"\nCopper workflows (exact 'Copper'): {len(copper_exact)}")
for doc in copper_exact:
    print(f"  {doc}")
