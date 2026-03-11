def scan_job_tags(job):
    print(f"Scanning job logic triggered for: {job.get('title', 'Unknown Job')}")
    # Integration logic for the specific CrewAI agent run goes here
    # For now, this acts as the receiver from the trigger.
