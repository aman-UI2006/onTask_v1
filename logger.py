import csv
from datetime import datetime
import os

LOG_FILE = "email_logs.csv"

def log_email(name, email, task, deadline, content):
    file_exists = os.path.isfile(LOG_FILE)

    with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)

        # Write header if file is new
        if not file_exists:
            writer.writerow([
                "Name", "Email", "Task", "Deadline", "Content", "Timestamp"
            ])

        writer.writerow([
            name,
            email,
            task,
            deadline,
            content,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])