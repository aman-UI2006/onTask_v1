# AI Project Management - Full System Validation Guide

Version 2.0 (Real-Time & Analytics Edition)

Use this guide to verify all core features of the platform. Follow the steps sequentially for a complete end-to-end test.

---

## 🏗️ Phase 1: Project Initiation (Manager)
1.  **Dashboard**: Verify that the "Active Projects" list loads successfully.
2.  **New Project**: Click "+ New Project" and fill out the details.
    - Attach a transcript file (optional).
    - **Expected**: Project appears in the list with a **Unique Accent Color** (Check if color differs from existing projects).
3.  **Detail View**: Open the project.
    - Click **"AI Select Crew"**.
    - Verify that AI recommends employees based on skills.
    - Click **"AI Generate Flow"**.
    - Verify that tasks are generated.

## 👥 Phase 2: Employee Workflow
1.  **Login**: Logout as Manager and Login as a registered Employee.
2.  **Dashboard**: Verify your assigned tasks appear on the home screen.
3.  **Timeline**: 
    - Go to **"My Timeline"**.
    - **Expected**: A vertical roadmap showing your current tasks as "Planned" or "In-Progress".
4.  **Submission**:
    - Select a Task.
    - Click "Update Progress" or "Submit Report".
    - Type a report and attach a file.
    - **Expected**: Status changes to "Report Submitted".

## 🧐 Phase 3: Review & Approval (Manager)
1.  **Review Page**: Go to the **"Review Personnel Work"** tab.
2.  **AI Analysis**:
    - Select the employee submission.
    - Click **"Analyze with AI"**.
    - Verify Grok gives a quality score and Verdict.
3.  **Approve**:
    - Click **"Send Feedback & Approve"**.
    - **Expected**: Success alert "Submission approved".

## 📊 Phase 4: Analytics Sync (Real-Time)
1.  **Analytics Page**: Open the project analytics.
2.  **Timeline Check**:
    - **Expected**: The horizontal timeline node for the approved task turned **Green with a Checkmark**.
3.  **Project Health**:
    - Verify the "Project Vital Signs" and "Resource Allocation" charts reflect the new approval.

## 📧 Phase 5: Email & Automation
1.  **Email Automation**: Go to "Advanced Email Automation" tab.
2.  **Selection**: Select projects, teams, and specific employees.
3.  **Generate**: 
    - Set Tone to "Motivator".
    - Type "Meeting tomorrow".
    - Click "Generate Consolidated Email".
    - **Expected**: AI draft appears with recipient names correctly included.
4.  **Launch**: Click "Confirm & Launch Campaign".
    - **Expected**: "Campaign Successfully Launched!" alert. Check recipient inboxes for the message.

---

### 🚨 Critical Performance Checks
- [ ] No "Black Screen" when navigating tabs.
- [ ] Analytics load in < 1 second.
- [ ] Employee list is NOT empty in the "Employees" tab.
