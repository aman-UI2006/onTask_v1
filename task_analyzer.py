from groq import Groq
from config import GROQ_API_KEY
client = Groq(api_key=GROQ_API_KEY)

def analyze_task(name, task, deadline):
    prompt = f"""
    You are an AI project manager.

    Employee: {name}
    Task: {task}
    Deadline: {deadline}

    Analyze this task and provide:

    1. Task understanding
    2. Step-by-step execution plan
    3. Possible risks
    4. Suggestions for better execution

    Keep response structured and professional.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content