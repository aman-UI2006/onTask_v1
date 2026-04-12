import smtplib
from email.mime.text import MIMEText

def send_email(to_email, content):
    msg = MIMEText(content)
    msg['Subject'] = "Task Assignment"
    msg['From'] = "kabadeketan2@gmail.com"
    msg['To'] = to_email

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login("kabadeketan2@gmail.com", "zgzwgbknttreozgu")

    server.send_message(msg)
    server.quit()