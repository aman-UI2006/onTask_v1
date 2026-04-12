import csv
from datetime import datetime
import os

FEEDBACK_FILE = "feedback_logs.csv"

def log_feedback(name, email, decision, rating, comment):
    file_exists = os.path.isfile(FEEDBACK_FILE)

    with open(FEEDBACK_FILE, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "Name", "Email", "Decision", "Rating", "Comment", "Timestamp"
            ])

        writer.writerow([
            name,
            email,
            decision,
            rating,
            comment,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])