
import psycopg2
import os

DB_NAME = "income_processing_db"
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = "localhost"
DB_PORT = "5432"

def get_db_connection():
    try:
        return psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
    except Exception as e:
        print(f"Error: {e}")
        return None

def fetch_users(cursor, description, query):
    print(f"\n--- {description} ---")
    cursor.execute(query)
    rows = cursor.fetchall()
    for row in rows:
        print(f"Email: {row[0]:<35} | Phone: {row[1]}")

def main():
    conn = get_db_connection()
    if not conn: return
    cursor = conn.cursor()

    # 1. Active Good Payers (Current)
    fetch_users(cursor, "ACTIVE GOOD PAYERS (Standard)", """
        SELECT u.email, u.phone_number FROM users u
        JOIN loans l ON u.user_id = l.user_id
        WHERE l.loan_status = 'ACTIVE' AND l.dpd = 0 AND l.risk_bucket = 'CURRENT'
        LIMIT 5
    """)

    # 2. Late Payers (SMA - Late but active)
    fetch_users(cursor, "LATE PAYERS (SMA-1/2 - Active but Overdue)", """
        SELECT u.email, u.phone_number FROM users u
        JOIN loans l ON u.user_id = l.user_id
        WHERE l.loan_status = 'ACTIVE' AND l.dpd > 0
        LIMIT 5
    """)

    # 3. Defaulters (NPA)
    fetch_users(cursor, "DEFAULTERS (NPA - Defaulted)", """
        SELECT u.email, u.phone_number FROM users u
        JOIN loans l ON u.user_id = l.user_id
        WHERE l.loan_status = 'DEFAULTED'
        LIMIT 5
    """)

    # 4. Closed Loans (Completed)
    fetch_users(cursor, "CLOSED LOANS (History of successful repayment)", """
        SELECT u.email, u.phone_number FROM users u
        JOIN loans l ON u.user_id = l.user_id
        WHERE l.loan_status = 'CLOSED'
        LIMIT 5
    """)

    # 5. New Users (No Applications)
    fetch_users(cursor, "FRESH USERS (No Loans yet)", """
        SELECT u.email, u.phone_number FROM users u
        LEFT JOIN loan_applications la ON u.user_id = la.user_id
        WHERE la.application_id IS NULL AND u.role = 'BENEFICIARY'
        LIMIT 5
    """)

    conn.close()

if __name__ == "__main__":
    main()
