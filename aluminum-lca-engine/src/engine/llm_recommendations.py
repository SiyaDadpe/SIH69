from __future__ import annotations

"""LLM-powered recommendations for Aluminum LCA Engine.

Uses Google Gemini via the `google-generativeai` client if GEMINI_API_KEY is set.
Falls back to rule-based recommendations from `compact_output` when unavailable
or on errors.

Public function:
    generate_llm_recommendations(compact_doc: dict) -> dict

Returns a dict with keys:
    {
      "model": <model name or "rule-based-fallback">,
      "success": bool,
      "recommendations": [ { priority, title, description, expectedImpact?, category? } ],
      "raw_output": <original text from model or error message>
    }
"""

from typing import Dict, Any, List
import json
import re
from .compact_output import _default_recommendations  # reuse baseline recs
from ..utils.config import Config


PROMPT_TEMPLATE = """
You are an expert aluminum Life Cycle Assessment improvement advisor.
Given the following compact JSON for a production scenario, produce a JSON array
"recommendations" with 4-7 prioritized items. Each item must be an object with:
  priority: HIGH | MEDIUM | LOW
  title: short actionable heading
  description: concise recommendation (max 35 words, no marketing fluff)
  expectedImpact: qualitative string (e.g., "~15% GWP reduction", "improves water circularity")
  category: one of [energy, carbon, water, waste, air, circularity, data_quality]
Rules:
 - Reference ONLY data present; if data quality is placeholder or uncertain, include a data_quality recommendation.
 - Avoid numeric precision you can't infer; use ranges or qualitative terms.
 - If smelting dominates energy or CO2 include at least one smelting improvement.
 - If refining waste (red mud) is high include waste valorization.
 - If circularityScore < 40 include circularity improvement.
Return ONLY valid JSON: {"recommendations": [...]} with no extra commentary.

Compact JSON:
"""


def _extract_json(text: str) -> Dict[str, Any]:
    """Try to extract a JSON object with 'recommendations' from model output."""
    # Direct parse attempt
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and 'recommendations' in parsed:
            return parsed
    except Exception:
        pass
    # Fallback: find first JSON object substring
    match = re.search(r'\{[^\n]*"recommendations"[\s\S]*?\}', text)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict) and 'recommendations' in parsed:
                return parsed
        except Exception:
            pass
    return {"recommendations": []}


def _rule_based_only(compact_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "model": "rule-based-fallback",
        "success": True,
        "recommendations": _default_recommendations(compact_doc),
        "raw_output": "Rule-based generator used (LLM unavailable)."
    }


def generate_llm_recommendations(compact_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Generate LLM recommendations using Gemini, with graceful fallback."""
    api_key = Config.GEMINI_API_KEY
    model_name = Config.GEMINI_MODEL
    if not api_key:
        return _rule_based_only(compact_doc)

    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        prompt = PROMPT_TEMPLATE + json.dumps(compact_doc, indent=2)
        response = model.generate_content(prompt)
        # Gemini responses may return candidates with parts
        text_parts = []
        if hasattr(response, 'candidates'):
            for c in response.candidates:
                for p in getattr(c, 'content', {}).parts:
                    if getattr(p, 'text', None):
                        text_parts.append(p.text)
        # Fallback to top-level text
        if not text_parts and hasattr(response, 'text'):
            text_parts.append(response.text)
        combined = '\n'.join(text_parts).strip()
        parsed = _extract_json(combined)
        recs = parsed.get('recommendations', [])
        # Validate structure minimally
        cleaned: List[Dict[str, Any]] = []
        for r in recs:
            if not isinstance(r, dict):
                continue
            item = {
                'priority': r.get('priority', 'MEDIUM'),
                'title': r.get('title', '')[:120],
                'description': r.get('description', '')[:220],
                'expectedImpact': r.get('expectedImpact', ''),
                'category': r.get('category', 'energy')
            }
            cleaned.append(item)
        if not cleaned:
            # fallback augmenting rule-based
            rb = _default_recommendations(compact_doc)
            cleaned = rb
            return {
                'model': model_name,
                'success': False,
                'recommendations': cleaned,
                'raw_output': combined
            }
        return {
            'model': model_name,
            'success': True,
            'recommendations': cleaned,
            'raw_output': combined
        }
    except Exception as e:
        # On any error fallback
        rb = _default_recommendations(compact_doc)
        return {
            'model': model_name,
            'success': False,
            'recommendations': rb,
            'raw_output': f'LLM error: {e}'
        }
