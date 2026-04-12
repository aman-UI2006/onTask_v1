from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def recommend_employee(df):
    
    # Convert dataframe to text
    data_text = ""
    for _, row in df.iterrows():
        data_text += f"{row['Name']} is assigned task: {row['Task']} with deadline {row['Deadline']}\n"

    prompt = f"""
    You are an AI manager.

    Here are employee task assignments:
    {data_text}

    Analyze and provide:

    1. Best suited employee for each task
    2. If reassignment is needed
    3. Reasons for recommendation
    4. Execution strategy

    Be clear and structured.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content