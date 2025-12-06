
import psycopg2
import os

DB_NAME = "income_processing_db"
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = "localhost"
DB_PORT = "5432"

def main():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cursor = conn.cursor()
        email = "codingid143@gmail.com"
        cursor.execute("SELECT password_hash FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        if row:
            with open("temp_hash.txt", "w") as f:
                f.write(row[0])
            print(f"Password Hash for {email} written to temp_hash.txt")
        else:
            print(f"User {email} not found.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
