from crewai import Task
from agents.crew.agents import recruiter, scanner, fixer, supervisor, matcher, advisor

scan_task = Task(
    description="Scan database and find jobs with messy tags",
    expected_output="List of problematic jobs",
    agent=scanner
)

fix_task = Task(
    description="Rewrite messy tags into clean keywords",
    expected_output="Clean tag list",
    agent=fixer
)

qa_task = Task(
    description="Verify tags are valid and not hallucinated",
    expected_output="Validation result",
    agent=supervisor
)

match_task = Task(
    description="Match resumes to relevant jobs semantically",
    expected_output="Ranked job list",
    agent=matcher
)

advise_task = Task(
    description="Generate skill gaps and learning path",
    expected_output="Career improvement plan",
    agent=advisor
)
