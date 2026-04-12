import json
import os
import pandas as pd
from datetime import datetime

class MemoryManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.projects_file = os.path.join(data_dir, "projects.json")
        self.employees_file = os.path.join(data_dir, "employees.json")
        self.tasks_file = os.path.join(data_dir, "tasks.json")
        self.submissions_file = os.path.join(data_dir, "submissions.json")
        self._initialize_files()

    def _initialize_files(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        for file_path in [self.projects_file, self.employees_file, self.tasks_file, self.submissions_file]:
            if not os.path.exists(file_path):
                with open(file_path, "w") as f:
                    json.dump([], f)

    def load_data(self, file_path):
        with open(file_path, "r") as f:
            return json.load(f)

    def save_data(self, file_path, data):
        with open(file_path, "w") as f:
            json.dump(data, f, indent=4)

    # Project Methods
    def get_projects(self):
        return self.load_data(self.projects_file)

    def add_project(self, project_name, description, start_date, end_date, required_skills=None, transcript_path=None, transcript_content=None, status="Planned"):
        projects = self.get_projects()
        new_project = {
            "id": len(projects) + 1,
            "name": project_name,
            "description": description,
            "start_date": start_date,
            "end_date": end_date,
            "required_skills": required_skills if isinstance(required_skills, list) else [s.strip() for s in (required_skills or "").split(",") if s.strip()],
            "transcript_path": transcript_path,
            "transcript_content": transcript_content,
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        projects.append(new_project)
        self.save_data(self.projects_file, projects)
        return new_project

    # Employee Methods
    def get_employees(self):
        return self.load_data(self.employees_file)

    def add_employee(self, name, email, skills, experience, gender, bio="", availability=True):
        employees = self.get_employees()
        new_employee = {
            "id": len(employees) + 1,
            "name": name,
            "email": email,
            "skills": skills if isinstance(skills, list) else [s.strip() for s in skills.split(",")],
            "experience": experience,
            "gender": gender,
            "bio": bio,
            "availability": availability,
            "projects_worked": 0
        }
        employees.append(new_employee)
        self.save_data(self.employees_file, employees)
        return new_employee

    # Task Methods
    def get_tasks(self, project_id=None):
        tasks = self.load_data(self.tasks_file)
        if project_id:
            return [t for t in tasks if t["project_id"] == project_id]
        return tasks

    def add_task(self, project_id, employee_id, task_name, deadline, status="Pending", progress=0):
        tasks = self.load_data(self.tasks_file)
        new_task = {
            "id": len(tasks) + 1,
            "project_id": project_id,
            "assigned_to": employee_id,
            "name": task_name,
            "deadline": deadline,
            "status": status,
            "progress": progress
        }
        tasks.append(new_task)
        self.save_data(self.tasks_file, tasks)
        return new_task

    def update_task_progress(self, task_id, progress, status=None):
        tasks = self.load_data(self.tasks_file)
        for task in tasks:
            if task["id"] == task_id:
                task["progress"] = progress
                if status:
                    task["status"] = status
                elif progress == 100:
                    task["status"] = "Completed"
                elif progress > 0:
                    task["status"] = "In-Progress"
                break
        self.save_data(self.tasks_file, tasks)

    # Submission Methods
    def get_submissions(self, project_id=None, employee_id=None):
        subs = self.load_data(self.submissions_file)
        if project_id:
            subs = [s for s in subs if s["project_id"] == project_id]
        if employee_id:
            subs = [s for s in subs if s["employee_id"] == employee_id]
        return subs

    def add_submission(self, project_id, employee_id, description, file_path):
        subs = self.load_data(self.submissions_file)
        new_sub = {
            "id": len(subs) + 1,
            "project_id": project_id,
            "employee_id": employee_id,
            "description": description,
            "file_path": file_path,
            "timestamp": datetime.now().isoformat()
        }
        subs.append(new_sub)
        self.save_data(self.submissions_file, subs)
        return new_sub

    def get_full_context(self):
        # Aggregated data for AI prompts
        return {
            "projects": self.get_projects(),
            "employees": self.get_employees(),
            "tasks": self.get_tasks(),
            "submissions": self.get_submissions()
        }

    def seed_data(self):
        # Seed only if empty
        if not self.get_projects():
            p1 = self.add_project("AI Dashboard Upgrade", "Migrating basic charts to Plotly and improving UX.", "2024-04-01", "2024-05-15", "In-Progress")
            p2 = self.add_project("Customer Support Bot", "LLM-driven automation for support tickets.", "2024-04-10", "2024-06-01", "Planned")
            
            e1 = self.add_employee("Ketan", "kabadeketan2@gmail.com", ["Python", "Streamlit", "Plotly"], 5, "Male")
            e2 = self.add_employee("Alice", "alice@example.com", ["React", "CSS", "UI/UX"], 3, "Female")
            e3 = self.add_employee("Bob", "bob@example.com", ["Backend", "FastAPI", "PostgreSQL"], 7, "Male")
            e4 = self.add_employee("Diana", "diana@example.com", ["Documentation", "Communication"], 2, "Female")

            self.add_task(p1["id"], e1["id"], "Setup Plotly logic", "2024-04-20", "In-Progress", 40)
            self.add_task(p1["id"], e2["id"], "Design sidebar UI", "2024-04-22", "Completed", 100)
            self.add_task(p2["id"], e3["id"], "Initialize VectorDB", "2024-05-01", "Pending", 0)
            self.add_task(p2["id"], e1["id"], "Test Groq Integration", "2024-05-05", "Pending", 0)
