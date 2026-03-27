from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os

api_key = os.getenv("GROQ_API_KEY") 

# Using Langchain's Groq integration
llm = ChatGroq(model="llama3-70b-8192", api_key=api_key)

def rewrite_tags(text):
    prompt = ChatPromptTemplate.from_template(
        "Rewrite job tags into clean keywords: {text}"
    )
    return llm.invoke(prompt.format_messages(text=text)).content

def verify_tags(tags):
    prompt = ChatPromptTemplate.from_template(
        "Are these tags valid or hallucinated? {tags}"
    )
    return llm.invoke(prompt.format_messages(tags=tags)).content
