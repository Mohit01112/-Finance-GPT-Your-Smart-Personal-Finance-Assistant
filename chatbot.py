import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=api_key)

def chat_with_gpt(messages):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.6,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        # Handle specific Groq errors
        if "insufficient_quota" in str(e).lower():
            return "I'm sorry, but I've temporarily run out of Groq API quota. Please check your Groq billing details."
        elif "rate_limit_exceeded" in str(e).lower():
            return "I'm receiving too many requests right now. Please wait a moment and try again."
        elif "authentication" in str(e).lower() or "api key" in str(e).lower():
            return "I'm sorry, but I couldn't authenticate with the Groq API. Please check your GROQ_API_KEY in the .env file."
        elif "model_decommissioned" in str(e).lower() or "model" in str(e).lower():
            return "I'm sorry, but the requested model is no longer available. Please check for updated model names."
        else:
            # Re-raise the exception for other errors
            raise e
