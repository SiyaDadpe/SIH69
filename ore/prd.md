# PRD: Aluminum Ore Visual Analysis System (AOVAS)

## 1\. Project Overview

**Goal:** Create a Python-based web application that accepts images related to Aluminum mining (ore samples, open pits, or machinery) and generates a "Mining Intelligence Report."
**Core Logic:** Since real-time chemical analysis via image is impossible, the system uses **Gemini 2.5 Flash** to identify visual features (color, texture, equipment type) and infers/estimates technical parameters based on industry averages.
**Target Audience:** Mining engineers needing quick, rough estimates (or a demonstration of AI capabilities).

## 2\. Tech Stack Requirements

  * **Frontend/UI:** Streamlit (`streamlit`) - for simplest drag-and-drop.
  * **Backend/AI:** Google Generative AI (`google-generativeai`) - using model `models/gemini-2.5-flash`.
  * **Image Handling:** Pillow (`PIL`).
  * **Data Formatting:** JSON.

## 3\. User Flow

1.  **Input:** User uploads an image (`.jpg`, `.png`).
2.  **Processing:**
      * System sends image + Context Prompt to Gemini API.
      * Gemini acts as a "Metallurgical Expert" to estimate values.
3.  **Output:** System parses the returned JSON and displays:
      * A structured table of metrics (Ore Grade, Water Usage, etc.).
      * A textual conclusion.

## 4\. Functional Specifications

### 4.1 Interface (Streamlit)

  * **Title:** "Aluminum Ore AI Analyst"
  * **Widget:** File Uploader (Images only).
  * **Action:** Automatically trigger analysis upon upload.
  * **Display:**
      * Show the uploaded image (resized to max width 400px).
      * Show a "Processing..." spinner.
      * Render the results in a clean UI (Metric cards or a Data Table).

### 4.2 The Intelligence Engine (Prompt Engineering)

**Constraint:** The model *must* return valid JSON. The model *must* provide values even if the image is vague (make reasonable estimates based on color/texture).

**System Prompt to use:**

> "You are a Senior Metallurgical Engineer. Analyze the provided image of an aluminum mining context (Ore, Pit, or Machinery).
>
> Your task is to extract or estimate the following parameters. If exact data is not visible, infer it based on the visual cues (e.g., Red soil implies high iron/bauxite, large trucks imply diesel/hybrid).
>
> Return ONLY a raw JSON object (no markdown) with these keys:
>
>   - `visual_summary`: Brief description of what is seen.
>   - `ore_grade`: Estimated Al2O3 percentage (e.g., '45-50%').
>   - `overburden_ratio`: Volume of waste per ore (e.g., '1:3').
>   - `equipment_type`: 'Diesel', 'Electric', 'Hybrid', or 'N/A'.
>   - `water_usage`: m³ per tonne estimation (e.g., '2.5 m³').
>   - `biodiversity_impact`: 'Low', 'Moderate', or 'High'.
>   - `red_mud_generation`: kg per tonne estimation (e.g., '500 kg').
>   - `technical_conclusion`: A 1-sentence professional assessment.
>
> If the image is not related to mining, set `visual_summary` to 'Invalid Image' and other fields to 'N/A'."

### 4.3 Fallback Mechanism

  * If the API fails or returns malformed JSON, display a generic error: "Analysis failed. Please try a clearer image."

## 5\. File Structure (Suggested)

```text
/aluminum-ai
    ├── main.py            # Streamlit app and logic
    ├── requirements.txt   # streamlit, google-generativeai, python-dotenv, pillow
    ├── .env               # GOOGLE_API_KEY=...
```

## 6\. Key Deliverables (Acceptance Criteria)

1.  **Code:** A working `main.py` that runs with `streamlit run main.py`.
2.  **Visuals:** The app must parse the JSON and display "Ore Grade" and "Red Mud" clearly.
3.  **Resilience:** It should not crash if the user uploads a blurry photo (Gemini should just guess/hallucinate a response).

-----

### **Instructions for the AI Developer (Antigravity):**

1.  Initialize a Python environment.
2.  Install `streamlit` and `google-generativeai`.
3.  Create a `.env` file for the API key.
4.  Write the `main.py` using the System Prompt defined in Section 4.2.
5.  Ensure the JSON parsing is robust (handle potential Markdown backticks from Gemini response).