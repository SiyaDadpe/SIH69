from dotenv import load_dotenv
import google.generativeai as genai
import os

load_dotenv()

api_key = os.getenv("gemini_api_key")
if not api_key:
    raise ValueError("gemini_api_key not found in environment variables")
genai.configure(api_key=api_key)
genai.configure(transport='grpc')

def list_models():
    for m in genai.list_models():
        print("-" * 80)
        print(f"Name: {m.name}")
        print(f"Display Name: {m.display_name}")
        print(f"Description: {m.description}")
        print(f"Generation Methods: {m.supported_generation_methods}")

if __name__ == "__main__":
    list_models()