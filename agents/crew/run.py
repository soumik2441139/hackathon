import agents.windows_patch
from crewai import Crew
from agents.crew.agents import recruiter, scanner, fixer, supervisor, matcher, advisor
from agents.crew.tasks import scan_task, fix_task, qa_task, match_task, advise_task

# Initialize the central Orchestrator
crew = Crew(
    agents=[recruiter, scanner, fixer, supervisor, matcher, advisor],
    tasks=[scan_task, fix_task, qa_task, match_task, advise_task],
    verbose=True
)

if __name__ == "__main__":
    crew.kickoff()
