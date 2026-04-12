from groq import Groq
from config import GROQ_API_KEY
import json

class CrewRecommender:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"

    def form_teams(self, project_requirements, employees, transcript_content=None):
        # Convert employees to readable text for AI
        emp_text = ""
        for e in employees:
            skills_str = ", ".join(e['skills'])
            emp_text += f"- {e['name']} (ID: {e['id']}), Skills: {skills_str}, Exp: {e['experience']} yrs, Projects: {e.get('projects_worked', 0)}\n"
        
        prompt = f"""
        You are an AI Manager. Form teams for a project: {project_requirements}
        
        Employee Database:
        {emp_text}
        """
        
        if transcript_content:
            prompt += f"\nAdditional Project Context (from meeting transcript/document):\n{transcript_content}\n"
            
        prompt += """
        Identify the best roles and form these 4 teams:
        1. Development Team
        2. Research Team
        3. Testing Team
        4. Documentation Team
        
        Output ONLY a valid JSON object with this structure:
        {
            "teams": {
                "Development": [id1, id2],
                "Research": [id3],
                "Testing": [id4],
                "Documentation": [id5]
            },
            "rationale": "one sentence summary explaining why these choices were made based on the requirements and transcript"
        }
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.choices[0].message.content
        try:
            # Basic JSON extraction
            import json
            start = content.find("{")
            end = content.rfind("}") + 1
            data = json.loads(content[start:end])
            return data
        except:
            # Fallback if AI fails to give clean JSON
            return {"teams": {"Development": [], "Research": [], "Testing": [], "Documentation": []}, "rationale": "Error parsing AI response."}

    def update_team_in_memory(self, mm, project_id, team_data):
        # team_data could be a dict of {team_name: [employee_ids]}
        # We assign tasks or set project metadata
        pass
