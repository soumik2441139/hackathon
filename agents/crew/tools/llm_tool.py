from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import os

api_key = os.getenv("GEMINI_API_KEY") 

# Using Langchain's Google GenAI integration for Gemini models
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", api_key=api_key)

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
