import streamlit as st
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image
import json

# Load environment variables
load_dotenv()

# Configure Gemini API
API_KEY = os.getenv("gemini_api_key")
if not API_KEY:
    raise ValueError("gemini_api_key not found in environment variables")

# Configure with REST transport to avoid potential gRPC/ADC auth conflicts
genai.configure(api_key=API_KEY, transport="rest")
MODEL_NAME = "models/gemini-2.5-flash"

def analyze_image(image):
    """
    Sends the image to Gemini 2.5 Flash with the specific metallurgical system prompt.
    Returns the parsed JSON response.
    """
    model = genai.GenerativeModel(MODEL_NAME)
    
    system_prompt = """
    You are a Senior Metallurgical Engineer. Analyze the provided image of an aluminum mining context (Ore, Pit, or Machinery).

    Your task is to extract or estimate the following parameters. If exact data is not visible, infer it based on the visual cues (e.g., Red soil implies high iron/bauxite, large trucks imply diesel/hybrid).

    Return ONLY a raw JSON object (no markdown) with these keys:

      - `visual_summary`: Brief description of what is seen.
      - `ore_grade`: Estimated Al2O3 percentage (e.g., '45-50%').
      - `overburden_ratio`: Volume of waste per ore (e.g., '1:3').
      - `equipment_type`: 'Diesel', 'Electric', 'Hybrid', or 'N/A'.
      - `water_usage`: m³ per tonne estimation (e.g., '2.5 m³').
      - `biodiversity_impact`: 'Low', 'Moderate', or 'High'.
      - `red_mud_generation`: kg per tonne estimation (e.g., '500 kg').
      - `technical_conclusion`: A 1-sentence professional assessment.

    If the image is not related to mining, set `visual_summary` to 'Invalid Image' and other fields to 'N/A'.
    """
    
    try:
        response = model.generate_content([system_prompt, image])
        return response.text
    except Exception as e:
        return f"Error: {e}"

def main():
    st.set_page_config(page_title="Aluminum Ore AI Analyst", layout="centered")
    
    st.title("Aluminum Ore AI Analyst")
    st.markdown("Upload an image of ore, open pits, or machinery to generate a Mining Intelligence Report.")
    
    uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "png", "jpeg"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption='Uploaded Image', use_container_width=True)
        
        with st.spinner('Processing image with Gemini 2.5 Flash...'):
            result_text = analyze_image(image)
            
            # Simple JSON cleanup (handling markdown code blocks if present)
            clean_json = result_text.replace("```json", "").replace("```", "").strip()
            
            try:
                data = json.loads(clean_json)
                
                if data.get("visual_summary") == "Invalid Image":
                    st.error("The image does not appear to be related to mining.")
                else:
                    st.success("Analysis Complete!")
                    
                    # Display metrics
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Ore Grade (Al2O3)", data.get("ore_grade", "N/A"))
                        st.metric("Overburden Ratio", data.get("overburden_ratio", "N/A"))
                        st.metric("Equipment Type", data.get("equipment_type", "N/A"))
                    
                    with col2:
                        st.metric("Red Mud Generation", data.get("red_mud_generation", "N/A"))
                        st.metric("Water Usage", data.get("water_usage", "N/A"))
                        st.metric("Biodiversity Impact", data.get("biodiversity_impact", "N/A"))
                    
                    st.markdown("### Technical Conclusion")
                    st.info(data.get("technical_conclusion", "N/A"))
                    
                    with st.expander("View Raw Analysis"):
                        st.json(data)
                        
            except json.JSONDecodeError:
                st.error("Failed to parse the response from Gemini. Please try a clearer image.")
                with st.expander("Debug Info"):
                    st.write(result_text)

if __name__ == "__main__":
    main()
