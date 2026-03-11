from agents.crew.db.mongo import jobs_col, resumes_col

def get_unprocessed_jobs():
    jobs = jobs_col.find({"tagTileStatus": "NEEDS_SHORTENING"})
    return [j["title"] for j in jobs]

def save_fixed_tags(job_title, tags):
    jobs_col.update_one(
        {"title": job_title},
        {"$set": {"proposedTags": tags, "tagTileStatus": "PENDING_REVIEW"}}
    )
    return f"Tags saved for {job_title}"

def get_resumes_for_matching():
    resumes = resumes_col.find({"matched": False})
    return list(resumes)

def save_match_results(resume_id, matches):
    resumes_col.update_one(
        {"_id": resume_id},
        {"$set": {"matches": matches, "matched": True}}
    )
