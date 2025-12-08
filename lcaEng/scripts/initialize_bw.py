"""Initialize Brightway2 project with biosphere and LCIA methods.

Usage (PowerShell):
  python -m scripts.initialize_bw --project Aluminum_LCA_Engine

This runs bw2setup() which installs the biosphere database and a set of
LCIA methods. After completion, you can inspect available methods and
verify that the climate change GWP 100a method exists.

If you plan to use proprietary background data (e.g. ecoinvent), import
it AFTER this setup using its importer.
"""
from __future__ import annotations

import argparse
import brightway2 as bw


def main():
    parser = argparse.ArgumentParser(description="Brightway2 initialization helper")
    parser.add_argument("--project", default="Aluminum_LCA_Engine", help="Project name to set/create")
    args = parser.parse_args()

    bw.projects.set_current(args.project)
    print(f"✓ Current Brightway project: {bw.projects.current}")

    # Run standard setup (biosphere + basic LCIA methods)
    print("Running bw2setup() – this may take a minute...")
    from bw2io import bw2setup
    bw2setup()
    print("✓ bw2setup complete")

    # List a few relevant methods
    print("\nAvailable climate change methods containing 'GWP':")
    for m in bw.methods:
        if isinstance(m, tuple) and any("gwp" in part.lower() for part in m):
            print("  -", m)

    print("\nSample of total methods:")
    for i, m in enumerate(sorted(list(bw.methods))[:15]):
        print("  -", m)
    print(f"... (total {len(bw.methods)} methods)")

    print("\nNext steps:")
    print("  1. Import foreground/background databases (e.g., aluminum data, ecoinvent).")
    print("  2. Adjust Config.DEFAULT_METHODS in src/utils/config.py if tuples differ.")
    print("  3. Re-run your LCA scripts; 'realCalculation': true will appear when all methods resolve.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
