from agents.crew.tools.llm_tool import llm
from langchain_core.prompts import ChatPromptTemplate
import json


def parse_resume(text):
    """Extract skills and domains from resume text using Gemini LLM."""
    if not text or not text.strip():
        return {"skills": [], "domains": []}

    prompt = ChatPromptTemplate.from_template(
        """Extract skills and domains from this resume text. Return ONLY valid JSON.

Resume:
{text}

Return format:
{{"skills": ["skill1", "skill2", ...], "domains": ["domain1", "domain2", ...]}}

Rules:
- skills: specific technologies, languages, frameworks, tools (e.g. Python, React, Docker)
- domains: broad areas (e.g. Backend, Frontend, ML, Cloud, DevOps, Data Science)
- Maximum 15 skills, 5 domains
- Only include skills actually mentioned in the text"""
    )

    try:
        response = llm.invoke(prompt.format_messages(text=text[:3000]))
        content = response.content.strip()
        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0]
        return json.loads(content)
    except Exception as e:
        print(f"[Parser] LLM parsing failed, using regex fallback: {e}")
        # Regex fallback for common tech skills
        known_skills = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust",
            "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes",
            "SQL", "PostgreSQL", "MongoDB", "Redis",
            "Git", "Linux", "TensorFlow", "PyTorch",
        ]
        text_lower = text.lower()
        found = [s for s in known_skills if s.lower() in text_lower]
        domains = []
        if any(s in found for s in ["React", "Angular", "Vue"]): domains.append("Frontend")
        if any(s in found for s in ["Node.js", "Express", "Django", "Flask"]): domains.append("Backend")
        if any(s in found for s in ["TensorFlow", "PyTorch"]): domains.append("ML")
        if any(s in found for s in ["AWS", "Azure", "GCP", "Docker"]): domains.append("Cloud")
        return {"skills": found[:15], "domains": domains[:5] or ["Software Engineering"]}
