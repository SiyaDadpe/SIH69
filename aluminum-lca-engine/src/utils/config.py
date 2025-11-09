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
