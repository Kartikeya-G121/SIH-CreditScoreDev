
import psycopg2
import os
import bcrypt  # Try to import bcrypt

DB_NAME = "income_processing_db"
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = "localhost"
DB_PORT = "5432"

# Target password
PLAIN_PASSWORD = "Password@123"

def main():
    try:
        # Generate new hash
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(PLAIN_PASSWORD.encode('utf-8'), salt).decode('utf-8')
        print(f"Generated hash for '{PLAIN_PASSWORD}': {hashed}")
        
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
        )
        cursor = conn.cursor()
        
        print("Updating all users with new hash...")
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, 
                is_active = true
        """, (hashed,))
        
        updated_count = cursor.rowcount
        conn.commit()
        
        print(f"SUCCESS: Updated {updated_count} users to password '{PLAIN_PASSWORD}'")
        
        conn.close()
    except ImportError:
        print("Error: 'bcrypt' library not found. Please install it (pip install bcrypt) or provided a pre-calculated hash.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
