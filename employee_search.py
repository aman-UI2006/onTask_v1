import pandas as pd

class EmployeeSearch:
    @staticmethod
    def filter_employees(employees, tasks, skills=None, experience=None, gender=None, availability=True, projects_worked=None):
        # Build availability status
        involved_ids = set([t["assigned_to"] for t in tasks if t["status"] != "Completed"])
        
        filtered = []
        for e in employees:
            # Check availability (if requested)
            is_available = e["id"] not in involved_ids
            if availability and not is_available:
                continue
            
            # Check gender (if requested)
            if gender and gender != "All" and e["gender"] != gender:
                continue
            
            # Check experience (minimum years)
            if experience is not None and e["experience"] < experience:
                continue
                
            # Check projects worked (minimum count)
            if projects_worked is not None and e.get("projects_worked", 0) < projects_worked:
                continue
            
            # Check skills (multiple skills selection support)
            if skills:
                # Assuming skills is a list of strings
                matched_skills = [s.lower() for s in skills if any(s.lower() in sk.lower() for sk in e["skills"])]
                if len(matched_skills) == 0:
                    continue
            
            e_copy = e.copy()
            e_copy["is_available"] = is_available
            filtered.append(e_copy)
            
        return filtered

    @staticmethod
    def search_by_name(employees, query):
        if not query:
            return employees
        return [e for e in employees if query.lower() in e["name"].lower()]
