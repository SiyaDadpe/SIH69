import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PROJECT_NAME = os.getenv("PROJECT_NAME", "Aluminum_LCA_Engine")
    BIODB_NAME = os.getenv("BIODB_NAME", "biosphere3")
    ALUMINUM_DB_NAME = os.getenv("ALUMINUM_DB_NAME", "aluminum_foreground")
    DEFAULT_METHODS = {
        'gwp': ('IPCC 2013', 'climate change', 'global warming potential (GWP100)'),
        'water_use': ('ReCiPe 2016 v1.03, midpoint (H)', 'water use', 'water consumption potential (WCP)'),
        'land_use': ('ReCiPe 2016 v1.03, midpoint (H)', 'land use', 'agricultural land occupation (LOP)')
    }

    # MongoDB integration
    MONGO_URI = os.getenv("MONGO_URI", "")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "LCA")
    MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "wizardworkflowoutputs")
    # Gemini LLM integration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
