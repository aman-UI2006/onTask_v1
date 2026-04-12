import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

class AnalyticsEngine:
    @staticmethod
    def get_task_status_pie(tasks):
        if not tasks:
            return None
        df = pd.DataFrame(tasks)
        fig = px.pie(df, names='status', title='Task Progress Distribution',
                     color_discrete_sequence=px.colors.qualitative.Pastel)
        fig.update_traces(textinfo='percent+label', hole=.3)
        return fig

    @staticmethod
    def get_employee_workload_bar(tasks, employees):
        if not tasks:
            return None
        
        task_counts = {}
        for t in tasks:
            eid = t["assigned_to"]
            task_counts[eid] = task_counts.get(eid, 0) + 1
        
        data = []
        for e in employees:
            data.append({
                "Employee": e["name"],
                "Tasks": task_counts.get(e["id"], 0)
            })
        
        df = pd.DataFrame(data)
        fig = px.bar(df, x='Employee', y='Tasks', title='Employee Workload (Tasks Assigned)',
                     color='Tasks', color_continuous_scale='Viridis')
        return fig

    @staticmethod
    def get_project_timeline(tasks):
        if not tasks:
            return None
        
        df = pd.DataFrame(tasks)
        import datetime
        today = datetime.date.today().isoformat()
        
        fig = px.timeline(df, x_start=[today]*len(df), x_end='deadline', y='name', 
                          color='status', title='Project Roadmap (Gantt Chart)',
                          hover_data=['assigned_to', 'progress'],
                          color_discrete_map={"Completed": "#2ecc71", "In-Progress": "#3498db", "Pending": "#95a5a6"})
        fig.update_yaxes(autorange="reversed")
        fig.update_layout(showlegend=True, template="plotly_white")
        return fig

    @staticmethod
    def get_pert_chart(tasks):
        if not tasks:
            return None
        
        df = pd.DataFrame(tasks).sort_values("deadline")
        fig = go.Figure()
        
        # Nodes
        x_coords = list(range(len(df)))
        y_coords = [0] * len(df)
        
        fig.add_trace(go.Scatter(
            x=x_coords, y=y_coords,
            mode='markers+text',
            marker=dict(size=40, color='#3498db', line=dict(width=2, color='DarkSlateGrey')),
            text=df['name'],
            textposition="top center",
            hoverinfo='text',
            hovertext=df.apply(lambda r: f"Task: {r['name']}<br>Deadline: {r['deadline']}<br>Status: {r['status']}", axis=1)
        ))
        
        # Edges
        for i in range(len(df) - 1):
            fig.add_annotation(
                x=x_coords[i+1], y=y_coords[i+1],
                ax=x_coords[i], ay=y_coords[i],
                xref="x", yref="y", axref="x", ayref="y",
                showarrow=True, arrowhead=2, arrowsize=1, arrowwidth=2, arrowcolor="#636E72"
            )
            
        fig.update_layout(
            title="Simplified PERT Network",
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False, range=[-1, 1]),
            template="plotly_white"
        )
        return fig

    @staticmethod
    def get_stage_visualization(tasks):
        if not tasks:
            return None
        
        counts = {"Pending": 0, "In-Progress": 0, "Completed": 0}
        for t in tasks:
            counts[t["status"]] = counts.get(t["status"], 0) + 1
        
        fig = go.Figure(data=[go.Funnel(
            y=list(counts.keys()),
            x=list(counts.values()),
            textinfo="value+percent initial",
            marker=dict(color=["#95a5a6", "#3498db", "#2ecc71"])
        )])
        fig.update_layout(title="Work Performance per Stage", template="plotly_white")
        return fig

    @staticmethod
    def get_risk_gauge(risk_data):
        score = 25 if risk_data['risk_level'] == "Low" else (60 if risk_data['risk_level'] == "Medium" else 90)
        
        fig = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = score,
            title = {'text': "Project Risk Index"},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': "#2c3e50"},
                'steps' : [
                    {'range': [0, 30], 'color': "lightgreen"},
                    {'range': [30, 70], 'color': "yellow"},
                    {'range': [70, 100], 'color': "red"}],
                'threshold' : {'line': {'color': "black", 'width': 4}, 'thickness': 0.75, 'value': score}}))
        
        fig.update_layout(height=300, template="plotly_white")
        return fig

    @staticmethod
    def get_risk_analysis(tasks):
        overdue = 0
        import datetime
        today = datetime.date.today()
        for t in tasks:
            deadline = datetime.datetime.strptime(t["deadline"], "%Y-%m-%d").date()
            if deadline < today and t["status"] != "Completed":
                overdue += 1
        
        risk_level = "Low"
        if overdue > 2: risk_level = "High"
        elif overdue > 0: risk_level = "Medium"
        
        return {
            "risk_level": risk_level,
            "overdue_tasks": overdue,
            "total_tasks": len(tasks),
            "recommendation": "Address overdue tasks immediately." if overdue > 0 else "Project on track."
        }
