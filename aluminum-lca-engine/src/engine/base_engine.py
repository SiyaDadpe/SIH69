import brightway2 as bw
from ..utils.config import Config

class BaseLCAManager:
    def __init__(self, project_name=None):
        self.project_name = project_name or Config.PROJECT_NAME
        self.setup_project()
    
    def setup_project(self):
        """Initialize Brightway2 project and biosphere database"""
        bw.projects.set_current(self.project_name)
        if Config.BIODB_NAME not in bw.databases:
            # set up default biosphere and methods
            bw.bw2setup()
        print(f"\u2713 Project '{self.project_name}' initialized")
    
    def get_biosphere_flow(self, name, category):
        """Helper to get biosphere flows"""
        biosphere = bw.Database(Config.BIODB_NAME)
        # Accept either a tuple of categories or a string for top-level category
        def cat_matches(act_cats, wanted):
            if isinstance(wanted, (list, tuple)):
                return tuple(act_cats or ())[: len(wanted)] == tuple(wanted)
            # string fuzzy: check any category contains the wanted substring (case-insensitive)
            wanted_s = str(wanted).lower()
            return any(wanted_s in str(c).lower() for c in (act_cats or ()))

        # Try exact name + category match first
        matches = [act for act in biosphere if act.get('name') == name and cat_matches(act.get('categories'), category)]
        if matches:
            return matches[0]

        # Fallback: fuzzy name contains and category substring
        lname = name.lower()
        fuzzy = [act for act in biosphere if lname in act.get('name', '').lower() and cat_matches(act.get('categories'), category)]
        if fuzzy:
            return fuzzy[0]

        # Last resort: any flow with name contains
        fuzzy_name_only = [act for act in biosphere if lname in act.get('name', '').lower()]
        if fuzzy_name_only:
            return fuzzy_name_only[0]

        raise KeyError(f"Biosphere flow not found (tried fuzzy): {name} / {category}")
