"""Skill normalisation + a small offline vocabulary used when Gemini is unavailable."""
import re

ALIASES = {
    "js": "javascript", "reactjs": "react", "react.js": "react", "node": "node.js", "nodejs": "node.js",
    "postgres": "postgresql", "k8s": "kubernetes", "ml": "machine learning", "py": "python",
    "ts": "typescript", "golang": "go", "amazon web services": "aws", "gcp": "google cloud",
    "vuejs": "vue", "vue.js": "vue", "nextjs": "next.js", "expressjs": "express", "mongo": "mongodb",
    "ci/cd": "ci cd", "rest": "rest api", "restful api": "rest api", "restful apis": "rest api",
}

VOCAB = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php", "sql",
    "react", "vue", "angular", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring",
    "html", "css", "tailwind", "postgresql", "mysql", "mongodb", "redis", "sqlalchemy", "docker",
    "kubernetes", "aws", "azure", "google cloud", "git", "linux", "ci cd", "rest api", "graphql",
    "machine learning", "deep learning", "pandas", "numpy", "tensorflow", "pytorch", "nlp", "kafka",
    "jenkins", "terraform", "agile", "scrum", "figma",
]


def normalize(skill: str) -> str:
    s = re.sub(r"\s+", " ", skill.strip().lower())
    return ALIASES.get(s, s)


def find_skills(text: str) -> list[str]:
    low = text.lower()
    found = []
    for skill in VOCAB:
        pattern = r"(?<![a-z0-9+#.])" + re.escape(skill) + r"(?![a-z0-9+#])"
        if re.search(pattern, low):
            found.append(skill)
    return found
