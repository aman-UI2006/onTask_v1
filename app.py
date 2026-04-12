import streamlit as st
import pandas as pd
import os
from datetime import datetime

# Import Internal Modules
from memory_manager import MemoryManager
from analytics_engine import AnalyticsEngine
from advanced_email_system import AdvancedEmailSystem
from crew_recommender import CrewRecommender
from employee_search import EmployeeSearch
from project_planner import generate_project_plan
from ai_chat import ai_chat
from file_utils import extract_text, save_uploaded_file

# Set Page Config
st.set_page_config(page_title="AI Project Manager 2.0", page_icon="🚀", layout="wide")

# Initialize Managers
if 'mm' not in st.session_state: st.session_state.mm = MemoryManager()
if 'ae' not in st.session_state: st.session_state.ae = AnalyticsEngine()
if 'aes' not in st.session_state: st.session_state.aes = AdvancedEmailSystem()
if 'cr' not in st.session_state: st.session_state.cr = CrewRecommender()
if 'es' not in st.session_state: st.session_state.es = EmployeeSearch()

mm = st.session_state.mm
ae = st.session_state.ae
aes = st.session_state.aes
cr = st.session_state.cr
es = st.session_state.es

# Sidebar Navigation
st.sidebar.title("🚀 AI Manager v2.0")
st.sidebar.markdown("---")
page = st.sidebar.radio("Navigation", 
    ["📊 Dashboard", "🆕 Create Project", "📈 Project Analytics", "📝 Review Work", "📁 Submit Work", "📧 Email Automation", "🤝 Ai crew recommendation", "👥 Employee Directory", "💬 AI Assistant"]
)

# Shared Context Helpers
def get_status_color(status):
    colors = {"Pending": "gray", "In-Progress": "blue", "Completed": "green", "Planned": "orange", "Delayed": "red"}
    return colors.get(status, "black")

# 1. Dashboard View
if page == "📊 Dashboard":
    st.title("System Dashboard")
    
    col1, col2, col3, col4 = st.columns(4)
    projects = mm.get_projects()
    employees = mm.get_employees()
    tasks = mm.get_tasks()
    
    col1.metric("Total Projects", len(projects))
    col2.metric("Total Employees", len(employees))
    col3.metric("Running Tasks", len([t for t in tasks if t["status"] == "In-Progress"]))
    col4.metric("Completed Tasks", len([t for t in tasks if t["status"] == "Completed"]))
    
    st.markdown("### Recent Projects")
    if projects:
        df_p = pd.DataFrame(projects)
        st.table(df_p[["name", "status", "start_date", "end_date"]].tail(5))
    else:
        st.info("No projects yet. Go to Create Project to add some.")

# 2. Create Project View
elif page == "🆕 Create Project":
    st.title("🆕 Create New Project")
    st.markdown("Launch a new project with AI-driven crew recommendation.")

    with st.form("create_project_form"):
        p_title = st.text_input("Project Title")
        p_desc = st.text_area("Project Description")
        
        # Get all existing skills for multiselect
        all_emp = mm.get_employees()
        available_skills = sorted(list(set([sk for e in all_emp for sk in e["skills"]])))
        p_skills = st.multiselect("Required Skills", available_skills)
        
        p_transcript = st.file_uploader("Upload Document / Transcript (PDF, DOCX, TXT)", type=["pdf", "docx", "txt"])
        
        col1, col2 = st.columns(2)
        with col1:
            p_start = st.date_input("Start Date", datetime.now())
        with col2:
            p_end = st.date_input("Deadline (Optional)", datetime.now())
        
        submit = st.form_submit_button("Create Project")
        
        if submit:
            if not p_title or not p_desc:
                st.error("Project Title and Description are required.")
            else:
                with st.spinner("Creating project and analyzing transcript..."):
                    t_path = None
                    t_content = ""
                    if p_transcript:
                        t_path = save_uploaded_file(p_transcript)
                        t_content = extract_text(t_path)
                    
                    new_proj = mm.add_project(
                        p_title, p_desc, 
                        p_start.strftime("%Y-%m-%d"), 
                        p_end.strftime("%Y-%m-%d"),
                        required_skills=p_skills,
                        transcript_path=t_path,
                        transcript_content=t_content
                    )
                    
                    # Store generated crew in project context immediately
                    recommendation = cr.form_teams(p_desc + " " + " ".join(p_skills), all_emp, transcript_content=t_content)
                    
                    # Move to Success View
                    st.session_state.last_created_project = new_proj
                    st.session_state.last_recommendation = recommendation
                    st.success(f"Project '{p_title}' created successfully!")
                    st.rerun()

    if "last_created_project" in st.session_state:
        lp = st.session_state.last_created_project
        lr = st.session_state.last_recommendation
        
        st.markdown("---")
        st.header(f"🚀 Project: {lp['name']}")
        
        col_s1, col_s2, col_s3 = st.columns(3)
        if col_s1.button("🔙 Back to Dashboard"):
            del st.session_state.last_created_project
            st.rerun()
            
        if col_s2.button("👥 See Generated Crew"):
            # Set state for the Crew Recommendation page
            st.session_state.crew_data = lr["teams"]
            st.session_state.crew_rationale = lr.get("rationale", "")
            # Redirect to recommendation page
            # Actually, we can just show it here or let the user click the sidebar
            st.info("Directing you to the Crew Recommendation tab... (Click it in the sidebar)")
            
        if col_s3.button("📧 Notify Team"):
             st.info("Navigate to Email Automation to notify the team.")

# 3. Project Analytics View
elif page == "📈 Project Analytics":
    st.title("Project-wise Detailed Analytics")
    
    projects = mm.get_projects()
    if not projects:
        st.warning("Please add projects first.")
    else:
        p_names = [p["name"] for p in projects]
        selected_p_name = st.selectbox("Select Project", p_names)
        selected_p = next(p for p in projects if p["name"] == selected_p_name)
        
        st.markdown(f"## {selected_p['name']} - Analytics")
        st.info(f"**Description:** {selected_p['description']}")
        
        p_tasks = mm.get_tasks(selected_p["id"])
        employees = mm.get_employees()
        
        if not p_tasks:
            st.info("No tasks assigned to this project yet.")
        else:
            # Main Layout
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.plotly_chart(ae.get_project_timeline(p_tasks), use_container_width=True)
                st.plotly_chart(ae.get_pert_chart(p_tasks), use_container_width=True)
            
            with col2:
                risk_data = ae.get_risk_analysis(p_tasks)
                st.plotly_chart(ae.get_risk_gauge(risk_data), use_container_width=True)
                
                with st.expander("⚠️ Risk Assessment Details", expanded=True):
                    st.write(f"**Level:** {risk_data['risk_level']}")
                    st.write(f"**Overdue:** {risk_data['overdue_tasks']} / {risk_data['total_tasks']}")
                    st.write(f"**AI Recommendation:** {risk_data['recommendation']}")
            
            st.markdown("---")
            col3, col4 = st.columns(2)
            with col3:
                st.plotly_chart(ae.get_task_status_pie(p_tasks), use_container_width=True)
            with col4:
                st.plotly_chart(ae.get_stage_visualization(p_tasks), use_container_width=True)
            
            st.plotly_chart(ae.get_employee_workload_bar(p_tasks, employees), use_container_width=True)

# 4. Review Work View
elif page == "📝 Review Work":
    st.title("📝 Review Personnel Work")
    st.markdown("Managers can browse submissions by project and team to provide AI-driven feedback.")

    projects = mm.get_projects()
    if not projects:
        st.info("No projects created yet.")
    else:
        for p in projects:
            with st.expander(f"📁 Project: {p['name']}", expanded=False):
                p_tasks = mm.get_tasks(p["id"])
                p_subs = mm.get_submissions(p["id"])
                employees = mm.get_employees()
                
                # Mock grouping by teams (since teams aren't perfectly persistent yet, we use unique teams from involved employees)
                teams = sorted(list(set([e.get("department", "General") for e in employees if any(t["assigned_to"] == e["id"] for t in p_tasks)])))
                if not teams: teams = ["General"]
                
                for team in teams:
                    st.markdown(f"**🔹 Team: {team}**")
                    team_emps = [e for e in employees if e.get("department") == team or team == "General"]
                    team_involved = [e for e in team_emps if any(t["assigned_to"] == e["id"] for t in p_tasks)]
                    
                    for e in team_involved:
                        e_subs = [s for s in p_subs if s["employee_id"] == e["id"]]
                        col_e1, col_e2 = st.columns([4, 1])
                        col_e1.write(f"👤 {e['name']} ({len(e_subs)} submissions)")
                        if col_e2.button("Review", key=f"rev_{p['id']}_{e['id']}"):
                            st.session_state.current_review = {"project": p, "employee": e, "submissions": e_subs}

    if "current_review" in st.session_state:
        rev = st.session_state.current_review
        st.markdown("---")
        st.subheader(f"Reviewing: {rev['employee']['name']} - {rev['project']['name']}")
        
        if not rev['submissions']:
            st.warning("No work submitted by this employee for this project yet.")
        else:
            for s in rev['submissions']:
                with st.container(border=True):
                    st.write(f"**Date:** {s['timestamp']}")
                    st.write(f"**Description:** {s['description']}")
                    st.write(f"**File:** {os.path.basename(s['file_path'])}")
                    if st.button("Download/View File", key=f"dl_{s['id']}"):
                        st.info(f"File located at: {s['file_path']}")
        
        st.markdown("### 🤖 Generate AI Feedback Email")
        feedback_instr = st.text_area("Guidance for AI Email", placeholder="e.g. Great work on the UI, but check the responsive layout on mobile.")
        if st.button("Generate Mail"):
            with st.spinner("Generating..."):
                context = f"Project: {rev['project']['name']}, Employee: {rev['employee']['name']}, Submissions: {len(rev['submissions'])}"
                email = aes.generate_email(rev['project']['name'], [rev['employee']], feedback_instr, "Professional", context)
                st.session_state.current_email = email
                st.info("Directing to Email Automation... (Scroll down or check preview)")
                st.write(email)

# 5. Submit Work View
elif page == "📁 Submit Work":
    st.title("📁 Submit Your Work")
    st.markdown("Upload your progress files and descriptions for manager review.")

    projects = mm.get_projects()
    employees = mm.get_employees()
    
    with st.form("submit_work_form"):
        s_emp = st.selectbox("I am...", employees, format_func=lambda x: x["name"])
        s_proj = st.selectbox("Submitting for Project", projects, format_func=lambda x: x["name"])
        s_desc = st.text_area("Detailed Description of Work Performed")
        s_file = st.file_uploader("Upload Work File")
        
        submit = st.form_submit_button("Submit Work")
        
        if submit:
            if not s_desc or not s_file:
                st.error("Please provide both a description and a file.")
            else:
                f_path = save_uploaded_file(s_file, directory="data/submissions")
                mm.add_submission(s_proj["id"], s_emp["id"], s_desc, f_path)
                st.success("Work submitted successfully!")

# 6. Email Automation View
elif page == "📧 Email Automation":
    st.title("📧 Advanced Email Automation")
    st.markdown("Send emails smartly via AI by selecting projects, teams, or individuals.")
    
    projects = mm.get_projects()
    if not projects:
        st.warning("No projects found.")
    else:
        st.markdown("### Select Projects & Teams")
        selected_recipients_ids = set()
        
        # We'll use a container for the project list
        for p in projects:
            col_p1, col_p2, col_p3 = st.columns([1, 4, 1])
            
            # Checkbox for project-wide selection
            select_p = col_p1.checkbox("", key=f"sel_p_check_{p['id']}")
            col_p2.write(f"**Project: {p['name']}**")
            
            p_tasks = mm.get_tasks(p["id"])
            employees = mm.get_employees()
            involved, teams = aes.get_recipient_options(employees, p_tasks)
            
            if select_p:
                for r in involved: selected_recipients_ids.add(r['id'])
            
            # Select Teams Button/Expander
            with col_p3:
                with st.expander("Teams"):
                    for team_name, members in teams.items():
                        if st.checkbox(f"T: {team_name}", key=f"sel_team_{p['id']}_{team_name}"):
                            for m in members: selected_recipients_ids.add(m['id'])
        
        all_emp = mm.get_employees()
        emp_dict = {e['id']: e for e in all_emp}
        unique_recipients = [emp_dict[eid] for eid in selected_recipients_ids if eid in emp_dict]
        
        st.markdown("---")
        st.write(f"**Total Recipients Selected:** {len(unique_recipients)}")
        
        st.markdown("### 🤖 AI Email Generator")
        col_g1, col_g2 = st.columns(2)
        with col_g1:
            tone = st.selectbox("Tone", ["Professional", "Collaborative", "Motivator", "Strict", "Urgent"])
            prompt_instr = st.text_area("What should this email be about?", height=150)
            
        with col_g2:
            if st.button("Generate Mail"):
                if not unique_recipients or not prompt_instr:
                    st.error("Please select recipients and provide a prompt.")
                else:
                    with st.spinner("Crafting smart email..."):
                        email_body = aes.generate_email("Selected Projects/Teams", unique_recipients, prompt_instr, tone, "Multi-project context")
                        st.session_state.current_email = email_body
            
            if "current_email" in st.session_state:
                st.markdown("### 📝 Preview")
                final_email = st.text_area("Edit manually:", value=st.session_state.current_email, height=250)
                
                sc_f1, sc_f2 = st.columns(2)
                if sc_f1.button("Send Email", type="primary"):
                    with st.spinner("Sending..."):
                        st.success(f"Successfully sent to {len(unique_recipients)} recipients!")
                        del st.session_state.current_email
                if sc_f2.button("Regenerate"):
                    del st.session_state.current_email
                    st.rerun()

# 4. AI Crew Recommendation View
elif page == "🤝 Ai crew recommendation":
    st.title("👨‍👩‍👧‍👦 AI Crew Recommendation & Team Management")
    st.markdown("AI forms specialized teams based on project complexity. You can refine and manage these crews interactively.")
    
    requirements = st.text_area("Enter Project Description / Resource Requirements", 
                                placeholder="e.g. Need a team to build a React dashboard with Python backend and documentation.")
    
    col1, col2 = st.columns([1, 4])
    if col1.button("Generate Recommendation"):
        if not requirements:
            st.error("Please enter project requirements.")
        else:
            with st.spinner("AI is analyzing talent and forming teams..."):
                all_employees = mm.get_employees()
                recommendation = cr.form_teams(requirements, all_employees)
                # Store recommendation in state
                st.session_state.crew_data = recommendation["teams"]
                st.session_state.crew_rationale = recommendation.get("rationale", "")
                st.session_state.show_editor = True

    if "crew_data" in st.session_state:
        st.markdown(f"**AI Rationale:** {st.session_state.crew_rationale}")
        st.markdown("---")
        
        all_emp = mm.get_employees()
        emp_dict = {e["id"]: e for e in all_emp}
        
        # Systematic Team Display
        for team_name, member_ids in list(st.session_state.crew_data.items()):
            with st.expander(f"📁 {team_name} ({len(member_ids)} members)", expanded=True):
                # Team actions
                t_col1, t_col2 = st.columns([4, 1])
                with t_col2:
                    if st.button(f"🗑️ Drop {team_name}", key=f"drop_t_{team_name}"):
                        del st.session_state.crew_data[team_name]
                        st.rerun()
                
                # Members list
                for mid in member_ids:
                    if mid not in emp_dict: continue
                    e = emp_dict[mid]
                    
                    m_col1, m_col2, m_col3 = st.columns([3, 1, 1])
                    with m_col1:
                        st.markdown(f"**{e['name']}** - {', '.join(e['skills'])}")
                        st.caption(f"Bio: {e.get('bio', 'No bio provided.')}")
                    with m_col2:
                        if st.button("Drop", key=f"drop_m_{team_name}_{mid}"):
                            st.session_state.crew_data[team_name].remove(mid)
                            st.rerun()
                    with m_col3:
                        if st.button("Replace", key=f"repl_m_{team_name}_{mid}"):
                            st.session_state.target_team = team_name
                            st.session_state.target_mid = mid
                            st.session_state.show_search = True
                            st.rerun()
                
                if st.button("➕ Add Employee", key=f"add_m_{team_name}"):
                    st.session_state.target_team = team_name
                    st.session_state.target_mid = None # Just adding
                    st.session_state.show_search = True
                    st.rerun()

        # Add New Team option
        new_t_name = st.text_input("Create New Team Name")
        if st.button("Add Team") and new_t_name:
            if new_t_name not in st.session_state.crew_data:
                st.session_state.crew_data[new_t_name] = []
                st.rerun()

    # Search Popup / Section
    if st.session_state.get("show_search", False):
        st.markdown("---")
        st.markdown(f"### 🔍 Search & Select Employee for **{st.session_state.target_team}**")
        
        sc1, sc2, sc3 = st.columns(3)
        with sc1:
            s_name = st.text_input("Name Query")
            s_gender = st.selectbox("Gender", ["All", "Male", "Female"], index=0)
        with sc2:
            s_exp = st.number_input("Min Experience (Yrs)", 0, 50, 0)
            s_proj = st.number_input("Min Projects Worked", 0, 100, 0)
        with sc3:
            all_skills = set()
            for e in mm.get_employees(): all_skills.update(e["skills"])
            s_skills = st.multiselect("Select Skills", list(all_skills))
        
        all_emp = mm.get_employees()
        active_tasks = mm.get_tasks()
        
        # Apply filters
        filtered = es.filter_employees(all_emp, active_tasks, skills=s_skills, experience=s_exp, gender=s_gender, projects_worked=s_proj)
        filtered = es.search_by_name(filtered, s_name)
        
        if not filtered:
            st.warning("No employees match these filters.")
        else:
            for fe in filtered[:10]: # Limit display
                c_f1, c_f2 = st.columns([4, 1])
                c_f1.write(f"**{fe['name']}** ({fe['experience']} yrs, {fe.get('projects_worked', 0)} projects) - {', '.join(fe['skills'])}")
                if c_f2.button("Select", key=f"sel_{fe['id']}"):
                    t_name = st.session_state.target_team
                    if st.session_state.target_mid: # Replace mode
                        idx = st.session_state.crew_data[t_name].index(st.session_state.target_mid)
                        st.session_state.crew_data[t_name][idx] = fe["id"]
                    else: # Add mode
                        if fe["id"] not in st.session_state.crew_data[t_name]:
                            st.session_state.crew_data[t_name].append(fe["id"])
                    
                    st.session_state.show_search = False
                    st.rerun()
        
        if st.button("Close Search"):
            st.session_state.show_search = False
            st.rerun()

# 5. Employee Directory View
elif page == "👥 Employee Directory":
    st.title("Employee Management")
    
    tab1, tab2 = st.tabs(["Directory & Filtering", "Add New Employee"])
    
    with tab1:
        st.markdown("### Advanced Search & Filter")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            q_name = st.text_input("Search by Name")
        with col2:
            q_gender = st.selectbox("Gender Filter", ["All", "Male", "Female", "Other"])
        with col3:
            q_avail = st.checkbox("Only show available", value=True)
            
        all_emp = mm.get_employees()
        all_tasks = mm.get_tasks()
        
        filtered = es.filter_employees(all_emp, all_tasks, gender=q_gender, availability=q_avail)
        filtered = es.search_by_name(filtered, q_name)
        
        if not filtered:
            st.warning("No employees matching the filters.")
        else:
            df_e = pd.DataFrame(filtered)
            st.dataframe(df_e[["name", "email", "skills", "experience", "gender", "is_available"]])
            
    with tab2:
        st.markdown("### Register New Employee")
        with st.form("add_emp_form"):
            name = st.text_input("Full Name")
            email = st.text_input("Email")
            skills = st.text_input("Skills (comma separated)")
            exp = st.number_input("Experience (Years)", min_value=0, max_value=50, value=0)
            gender = st.selectbox("Gender", ["Male", "Female", "Other"])
            
            if st.form_submit_button("Add Employee"):
                if name and email and skills:
                    mm.add_employee(name, email, skills, exp, gender)
                    st.success(f"{name} added successfully!")
                else:
                    st.error("Please fill all required fields.")

# 6. AI Assistant View
elif page == "💬 AI Assistant":
    st.title("AI Manager Chat")
    st.info("Context-aware assistant utilizing latest project and employee data.")
    
    user_query = st.text_input("Ask AI Manager anything...", placeholder="Who is free for a documentation task?")
    
    if user_query:
        # Build context from memory
        full_context = mm.get_full_context()
        context_str = f"Current Projects: {len(full_context['projects'])}, Employees: {len(full_context['employees'])}, Tasks: {len(full_context['tasks'])}"
        
        with st.spinner("Assistant is thinking..."):
            response = ai_chat(user_query, context_str)
        
        st.markdown(f"**AI Response:**")
        st.write(response)