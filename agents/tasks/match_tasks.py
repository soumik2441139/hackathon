from crewai import Crew
from agents.crew.agents import matcher, advisor
from agents.crew.tasks import match_task, advise_task


def match_resume(resume):
    resume_id = str(resume.get('_id', 'Unknown'))
    print(f"[CrewAI] Matching resume: {resume_id}")

    match_crew = Crew(
        agents=[matcher, advisor],
        tasks=[match_task, advise_task],
        verbose=True,
    )

    try:
        result = match_crew.kickoff(inputs={"resume_id": resume_id})
        print(f"[CrewAI] Match pipeline complete for: {resume_id}")
        return result
    except Exception as e:
        print(f"[CrewAI] Match pipeline failed for {resume_id}: {e}")
        from agents.utils.failure_logger import log_failure
        log_failure("match_resume", {"resume_id": resume_id, "error": str(e)})
