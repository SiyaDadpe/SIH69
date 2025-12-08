from pymongo import MongoClient
from bson import ObjectId

uri = "mongodb+srv://hashim:HASHIM2004@cluster0.pymuxwb.mongodb.net/LCA?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client['LCA']
collection = db['wizardworkflowoutputs']

# Check for the specific copper document ID
doc_id = "6936b0eedc1a1e36b35d8af3"
print(f"Looking for document with _id: {doc_id}")

doc = collection.find_one({"_id": ObjectId(doc_id)})
if doc:
    print(f"\n✓ Document found!")
    print(f"  Name: {doc.get('name')}")
    print(f"  metalType: {doc.get('metalType')}")
    print(f"  Status: {doc.get('status')}")
    print(f"  Has copperMining: {bool(doc.get('copperMining'))}")
else:
    print(f"\n✗ Document NOT found in wizardworkflowoutputs collection")
    
# Check all collections for this document
print(f"\nChecking all collections in LCA database:")
for coll_name in db.list_collection_names():
    count = db[coll_name].count_documents({"_id": ObjectId(doc_id)})
    if count > 0:
        print(f"  ✓ Found in: {coll_name}")
        doc_in_coll = db[coll_name].find_one({"_id": ObjectId(doc_id)})
        print(f"    metalType: {doc_in_coll.get('metalType')}")
