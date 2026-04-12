from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def generate_template(tone):
    prompt = f"""
    Write a professional email template for assigning tasks to employees.

    Tone: {tone}

    Use placeholders:
    - {{name}}
    - {{task}}
    - {{deadline}}

    Include:
    - Subject line
    - Proper greeting
    - Clear instructions
    - Professional closing

    Keep it clean and structured.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # best quality in Groq
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content