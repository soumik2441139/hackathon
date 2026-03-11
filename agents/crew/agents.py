from crewai import Agent
from agents.crew.memory.shared_memory import MongoMemory
from agents.crew.tools.db_tool import (
    get_unprocessed_jobs,
    save_fixed_tags,
    get_resumes_for_matching,
    save_match_results
)
from agents.crew.tools.llm_tool import rewrite_tags, verify_tags, llm
from agents.crew.tools.vector_tool import semantic_job_search
from agents.crew.tools.parser_tool import parse_resume

# Define Agents
recruiter = Agent(
    role="Data Acquisition Agent",
    goal="Collect new job data",
    backstory="Expert in sourcing job listings",
    memory=MongoMemory(agent_name="recruiter"),
    llm=llm
)

scanner = Agent(
    role="Data Quality Agent",
    goal="Detect messy or invalid job tags",
    backstory="Expert in job data hygiene",
    tools=[get_unprocessed_jobs],
    memory=MongoMemory(agent_name="scanner"),
    llm=llm
)

fixer = Agent(
    role="Content Repair Agent",
    goal="Rewrite messy tags into clean keywords",
    backstory="Taxonomy cleanup specialist",
    tools=[rewrite_tags, save_fixed_tags],
    memory=MongoMemory(agent_name="fixer"),
    llm=llm
)

supervisor = Agent(
    role="QA Critic Agent",
    goal="Validate tags and detect hallucinations",
    backstory="Quality assurance expert",
    tools=[verify_tags],
    memory=MongoMemory(agent_name="supervisor"),
    llm=llm
)

matcher = Agent(
    role="Job Matching Agent",
    goal="Find best job matches for candidates",
    backstory="Semantic search expert",
    tools=[semantic_job_search, parse_resume, get_resumes_for_matching, save_match_results],
    memory=MongoMemory(agent_name="matcher"),
    llm=llm
)

advisor = Agent(
    role="Career Advisor Agent",
    goal="Suggest skill gaps and learning paths",
    backstory="Mentor for students and juniors",
    memory=MongoMemory(agent_name="advisor"),
    llm=llm
)
