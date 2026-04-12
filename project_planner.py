from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def generate_project_plan(task):

    prompt = f"""
    You are an AI Project Manager.

    Project: {task}

    Create a complete project execution plan including:

    1. Project phases
    2. Step-by-step workflow
    3. Timeline (days required for each phase)
    4. Deadlines for each phase
    5. Review checkpoints
    6. Risks and solutions

    Make it structured and easy to follow.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content