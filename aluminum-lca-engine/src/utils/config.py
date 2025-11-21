import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PROJECT_NAME = os.getenv("PROJECT_NAME", "Aluminum_LCA_Engine")
    BIODB_NAME = os.getenv("BIODB_NAME", "biosphere3")
    ALUMINUM_DB_NAME = os.getenv("ALUMINUM_DB_NAME", "aluminum_foreground")
    DEFAULT_METHODS = {
        'gwp': ('IPCC 2013', 'climate change', 'GWP 100a'),
        'water_use': ('Boulay et al. 2011', 'water use', 'water use'),
        'land_use': ('IPCC 2013', 'land use', 'land use')
    }

    # MongoDB integration
    MONGO_URI = os.getenv("MONGO_URI", "")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "LCA")
    MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "wizardworkflowoutputs")
    # Gemini LLM integration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
