from groq import Groq
from config import GROQ_API_KEY
import pandas as pd

class AdvancedEmailSystem:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"

    def get_recipient_options(self, employees, project_tasks):
        # Filter employees by those involved in project
        involved_ids = set([t["assigned_to"] for t in project_tasks])
        involved_employees = [e for e in employees if e["id"] in involved_ids]
        
        # Categorize by teams (simulated or by skills)
        teams = {
            "Development": [e for e in involved_employees if "Python" in e["skills"] or "React" in e["skills"]],
            "Testing": [e for e in involved_employees if "Testing" in e["skills"]],
            "Documentation": [e for e in involved_employees if "Documentation" in e["skills"]],
            "Others": [e for e in involved_employees if not any(kw in e["skills"] for kw in ["Python", "React", "Testing", "Documentation"])]
        }
        
        return involved_employees, teams

    def generate_email(self, project_name, recipients, prompt_instruction, tone="Professional", context_data=None):
        recipient_names = ", ".join([r["name"] for r in recipients])
        
        context_str = ""
        if context_data:
            context_str = f"Project Context: {context_data}"
        
        prompt = f"""
        You are an AI Project Manager.
        Write an email to {recipient_names} regarding project: {project_name}.
        
        Tone: {tone}
        Instruction: {prompt_instruction}
        {context_str}
        
        Requirements:
        1. Professional and clear.
        2. Reference tasks or deadlines if provided.
        3. Make it ready for sending.
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message.content

    def simulate_send(self, to_email, subject, body):
        # Log to email_logs.csv (existing functionality)
        try:
            from logger import log_email
            log_email("Group/Individual", to_email, "Bulk Update", "N/A", body)
            return True
        except ImportError:
            return False
