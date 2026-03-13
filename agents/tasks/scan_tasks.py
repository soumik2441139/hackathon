from crewai import Crew
from agents.crew.agents import scanner, fixer, supervisor
from agents.crew.tasks import scan_task, fix_task, qa_task


def scan_job_tags(job):
    title = job.get('title', 'Unknown Job')
    print(f"[CrewAI] Scanning job: {title}")

    scan_crew = Crew(
        agents=[scanner, fixer, supervisor],
        tasks=[scan_task, fix_task, qa_task],
        verbose=True,
    )

    try:
        result = scan_crew.kickoff(inputs={"job_title": title})
        print(f"[CrewAI] Scan pipeline complete for: {title}")
        return result
    except Exception as e:
        print(f"[CrewAI] Scan pipeline failed for {title}: {e}")
        from agents.utils.failure_logger import log_failure
        log_failure("scan_job_tags", e, {"job": title})
