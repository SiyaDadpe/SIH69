from setuptools import setup, find_packages

setup(
    name="aluminum-lca-engine",
    version="0.1.0",
    description="Aluminum LCA Engine built on Brightway2",
    author="",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    include_package_data=True,
    install_requires=[
        "brightway2>=2.4",
        "bw2io>=0.8",
        "pandas>=1.3",
        "numpy>=1.21",
        "matplotlib>=3.5",
        "seaborn>=0.11",
        "jupyter>=1.0",
        "python-dotenv>=0.19",
    ],
    python_requires=">=3.8",
)
