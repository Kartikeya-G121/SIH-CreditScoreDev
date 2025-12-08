
import psycopg2
import os

DB_NAME = "income_processing_db"
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = "localhost"
DB_PORT = "5432"

TARGET_HASH = "$2a$10$mZNsygEF5uB280ypqa3mKOYGB08PtfGI1BIK221wpU40OsjHl.0zm"

def main():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cursor = conn.cursor()
        
        print("Updating all users...")
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, 
                is_active = true
        """, (TARGET_HASH,))
        
        updated_count = cursor.rowcount
        conn.commit()
        
        print(f"SUCCESS: Updated {updated_count} users.")
        print(f"Set password hash to: {TARGET_HASH}")
        print("Set is_active = true for all users.")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
