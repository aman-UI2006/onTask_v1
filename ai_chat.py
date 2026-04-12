from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def ai_chat(query, context):

    prompt = f"""
    You are an AI Manager Assistant.

    You have access to the following company data:

    {context}

    Answer the user query professionally and helpfully.

    Query:
    {query}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content