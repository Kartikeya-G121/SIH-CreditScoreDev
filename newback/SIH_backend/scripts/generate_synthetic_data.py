
import psycopg2
import random
from faker import Faker
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import decimal
import json
import os

# --- Configuration ---
DB_NAME = "income_processing_db"
DB_USER = os.getenv("DB_USERNAME", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = "localhost"
DB_PORT = "5432"

# Adjust counts for this run
NUM_USERS = 1200 
NUM_GROUPS = 150
NUM_APPS = 900

fake = Faker('en_IN')

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def create_schemes(cursor):
    print("Ensuring Loan Schemes exist...")
    schemes = [
        ("Kisan Credit Scheme", "Agriculture", 10000, 300000, 7.0, 12, 60),
        ("Small Business Mudra", "Business", 50000, 1000000, 8.5, 12, 60),
        ("Education Future", "Education", 100000, 2000000, 9.0, 24, 120),
        ("Rural Housing", "Housing", 200000, 2500000, 8.0, 60, 240),
        ("SHG Micro Loan", "Group", 5000, 50000, 12.0, 6, 24)
    ]
    
    for name, cat, min_amt, max_amt, rate, min_tenure, max_tenure in schemes:
        cursor.execute("SELECT scheme_id FROM loan_schemes WHERE scheme_name = %s", (name,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO loan_schemes 
                (scheme_name, provider_name, loan_category, min_amount, max_amount, base_interest_rate, 
                min_tenure_months, max_tenure_months, is_active, created_at, allow_prepayment, 
                emi_bounce_charges, penalty_rate)
                VALUES (%s, 'Govt Bank', %s, %s, %s, %s, %s, %s, true, NOW(), true, 500.00, 2.0)
            """, (name, cat, min_amt, max_amt, rate, min_tenure, max_tenure))

def generate_users_and_profiles(conn, cursor):
    print(f"Generating {NUM_USERS} Users and Profiles...")
    
    states_districts = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
        "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Noida"],
        "Bihar": ["Patna", "Gaya", "Muzaffarpur"]
    }

    users_created = []

    for i in range(NUM_USERS):
        first_name = fake.first_name()
        last_name = fake.last_name()
        # Ensure unique email
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(10000,99999)}@example.com"
        phone = f"9{random.randint(100000000, 999999999)}"
        
        cursor.execute("""
            INSERT INTO users (email, phone_number, password_hash, role, is_active, is_blacklisted, preferred_language)
            VALUES (%s, %s, 'password123', 'BENEFICIARY', true, false, 'en')
            RETURNING user_id
        """, (email, phone))
        user_id = cursor.fetchone()[0]
        users_created.append(user_id)
        
        # Profile
        state = random.choice(list(states_districts.keys()))
        district = random.choice(states_districts[state])
        
        occupation_type = random.choices(
            ["Agriculture", "Business", "Salaried", "Daily Wage", "Student"],
            weights=[40, 20, 20, 15, 5]
        )[0]
        
        if occupation_type == "Agriculture":
            income = random.randint(30000, 300000)
            land = random.uniform(0.5, 10.0)
            education = random.choice(["Primary", "Secondary", "Illiterate"])
        elif occupation_type == "Business":
            income = random.randint(100000, 1500000)
            land = random.uniform(0, 2.0)
            education = random.choice(["Secondary", "Graduate"])
        elif occupation_type == "Salaried":
            income = random.randint(150000, 1200000)
            land = 0
            education = random.choice(["Graduate", "Post-Graduate"])
        else: 
            income = random.randint(20000, 100000)
            land = 0
            education = "Secondary"

        cursor.execute("""
            INSERT INTO beneficiary_profiles 
            (user_id, full_name, dob, gender, state, district, pincode, 
            income_source, verified_annual_income, land_owned, education, 
            literacy_score, is_profile_verified, family_size)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, f"{first_name} {last_name}", fake.date_of_birth(minimum_age=18, maximum_age=70),
            random.choice(["Male", "Female"]), state, district, fake.postcode(),
            occupation_type, income, land, education,
            random.randint(0, 100), True, random.randint(1, 8)
        ))
        
    conn.commit()
    print("Users and Profiles created.")
    return users_created

def generate_groups(conn, cursor, users):
    print(f"Generating groups for users...")
    random.shuffle(users)
    grouped_users = users[:NUM_GROUPS * 5] 
    
    idx = 0
    for i in range(NUM_GROUPS):
        group_name = f"{fake.city()} SHG Group {random.randint(1000, 9999)}"
        cursor.execute("""
            INSERT INTO borrower_groups (group_name, formation_date, is_active, group_status, group_score)
            VALUES (%s, %s, true, 'ACTIVE', %s)
            RETURNING group_id
        """, (group_name, fake.date_this_decade(), decimal.Decimal(random.uniform(300, 850))))
        group_id = cursor.fetchone()[0]
        
        for _ in range(5):
            if idx < len(grouped_users):
                u_id = grouped_users[idx]
                role = 'LEADER' if _ == 0 else 'MEMBER'
                cursor.execute("""
                    INSERT INTO group_members (group_id, user_id, role, status, joined_at)
                    VALUES (%s, %s, %s, 'APPROVED', %s)
                    ON CONFLICT DO NOTHING
                """, (group_id, u_id, role, datetime.now()))
                idx += 1
    conn.commit()

def generate_full_loan_data(conn, cursor, users):
    print(f"Generating Applications, Loans, and Repayment History...")
    
    cursor.execute("SELECT scheme_id, scheme_name, min_amount, max_amount, base_interest_rate, min_tenure_months, max_tenure_months FROM loan_schemes")
    schemes = cursor.fetchall()
    
    for _ in range(NUM_APPS):
        user_id = random.choice(users)
        scheme = random.choice(schemes)
        scheme_id, scheme_name, min_amt, max_amt, rate, min_t, max_t = scheme
        
        req_amount = random.randint(int(min_amt), int(max_amt))
        # Tenure
        tenure = random.randint(min_t, max_t) # months
        
        status = random.choices(
            ['DRAFT', 'SUBMITTED', 'SCORING', 'APPROVED', 'SANCTIONED', 'REJECTED'],
            weights=[5, 10, 5, 20, 50, 10]
        )[0]
        
        # Application
        cursor.execute("""
            INSERT INTO loan_applications 
            (user_id, scheme_id, requested_amount, purpose, status, stage_timestamp, tenure_months)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s)
            RETURNING application_id
        """, (user_id, scheme_id, req_amount, f"Loan for {scheme_name}", status, tenure))
        app_id = cursor.fetchone()[0]
        
        if status == 'SANCTIONED':
            sanctioned_amt = decimal.Decimal(req_amount)
            interest_rate = decimal.Decimal(rate)
            
            # Start date 3-18 months ago
            start_date = date.today() - relativedelta(months=random.randint(3, 18))
            
            # Calculate EMI (Simple Interest approx or reducing balance - stick to simple flat rate for synthetic simplicity or use PMT logic)
            # Standard PMT Formula: P * r * (1+r)^n / ((1+r)^n - 1) where r = rate/12/100
            monthly_rate = interest_rate / 12 / 100
            
            if monthly_rate == 0:
                emi = sanctioned_amt / tenure
            else:
                emi = sanctioned_amt * monthly_rate * ((1 + monthly_rate)**tenure) / (((1 + monthly_rate)**tenure) - 1)
            
            emi = round(emi, 2)
            total_interest = (emi * tenure) - sanctioned_amt
            total_principal = sanctioned_amt
            
            # --- Generate History & Determine Current State ---
            outstanding_principal = total_principal
            outstanding_interest = total_interest # Initially full interest planned
            # Actually typically outstanding principal reduces. Total interest is accrued over time or upfront. 
            # Simplified: Outstanding Principal reduces with each principal component paid. 

            # Randomly decide intended behavior: Good Payer, Late Payer, Defaulter
            behavior = random.choices(['GOOD', 'LATE', 'DEFAULT'], weights=[70, 20, 10])[0]
            
            payment_day = start_date.day
            curr_date = start_date
            
            repayments_data = []
            transactions_data = []

            # We will generate the loan record first to get ID, then update it later
            cursor.execute("""
                INSERT INTO loans 
                (application_id, user_id, total_principal, total_interest, outstanding_principal, 
                loan_status, interest_rate, dpd, risk_bucket, start_date, next_payment_date, 
                monthly_emi, original_tenure_months, remaining_tenure)
                VALUES (%s, %s, %s, %s, %s, 'ACTIVE', %s, 0, 'CURRENT', %s, %s, %s, %s, %s)
                RETURNING loan_id
            """, (
                app_id, user_id, total_principal, total_interest, total_principal,
                interest_rate, start_date, start_date + relativedelta(months=1),
                emi, tenure, tenure
            ))
            loan_id = cursor.fetchone()[0]

            # Simulate Months
            months_passed = (date.today().year - start_date.year) * 12 + (date.today().month - start_date.month)
            
            dpd = 0
            risk = 'CURRENT'
            loan_status = 'ACTIVE'
            
            actual_outstanding_principal = total_principal

            for m in range(1, tenure + 1):
                due_date = start_date + relativedelta(months=m)
                is_past = due_date <= date.today()
                
                # Split EMI (Amortization logic simplified)
                # Interest for this month = Outstanding * monthly_rate
                interest_comp = actual_outstanding_principal * monthly_rate
                principal_comp = emi - interest_comp
                if principal_comp < 0: principal_comp = 0 # Should not happen with valid PMT
                
                repayment_status = 'PENDING'
                paid_date = None
                txn_amount = 0
                
                if is_past:
                    # Decide if paid based on behavior
                    paid = True
                    if behavior == 'DEFAULT' and m > 3: 
                        paid = False # Stop paying after 3 months
                    elif behavior == 'LATE' and random.random() < 0.3:
                        # Paid late (maybe next month or just marked overdue for now if very recent)
                        if (date.today() - due_date).days < 10:
                            paid = False # Currently overdue
                        else:
                            paid_date = due_date + timedelta(days=random.randint(5, 45))
                            
                    if paid:
                        if paid_date is None: paid_date = due_date # On time
                        
                        repayment_status = 'COMPLETED'
                        txn_amount = emi
                        actual_outstanding_principal -= principal_comp
                        
                        # Add Transaction
                        cursor.execute("""
                            INSERT INTO loan_transactions 
                            (loan_id, txn_type, amount, principal_component, interest_component, 
                             value_date, payment_mode, external_ref)
                            VALUES (%s, 'EMI_PAYMENT', %s, %s, %s, %s, 'UPI', %s)
                        """, (loan_id, txn_amount, principal_comp, interest_comp, paid_date, f"TXN{random.randint(10000,99999)}"))

                        # Check if fully paid
                        if m == tenure or actual_outstanding_principal <= 10:
                            loan_status = 'CLOSED'
                            actual_outstanding_principal = 0
                    else:
                        repayment_status = 'OVERDUE'
                        # DPD Calculation
                        this_dpd = (date.today() - due_date).days
                        dpd = max(dpd, this_dpd)
                
                # Insert Repayment
                cursor.execute("""
                    INSERT INTO repayments 
                    (loan_id, due_date, paid_date, amount_due, amount_paid, 
                     principal_component, interest_component, status, is_on_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    loan_id, due_date, paid_date, emi, txn_amount if repayment_status == 'COMPLETED' else 0,
                    principal_comp, interest_comp, repayment_status, (paid_date == due_date) if paid_date else False
                ))

                if loan_status == 'CLOSED':
                    break
            
            # Post-simulation updates
            if dpd > 0:
                if dpd <= 30: risk = 'SMA_0'
                elif dpd <= 60: risk = 'SMA_1'
                elif dpd <= 90: risk = 'SMA_2'
                else: 
                    risk = 'NPA'
                    loan_status = 'DEFAULTED'
            
            next_payment = start_date + relativedelta(months=months_passed + 1)
            
            cursor.execute("""
                UPDATE loans 
                SET outstanding_principal = %s, 
                    dpd = %s, 
                    risk_bucket = %s, 
                    loan_status = %s,
                    next_payment_date = %s,
                    remaining_tenure = %s
                WHERE loan_id = %s
            """, (
                actual_outstanding_principal, dpd, risk, loan_status, 
                next_payment if loan_status == 'ACTIVE' else None, 
                max(0, tenure - months_passed) if loan_status == 'ACTIVE' else 0,
                loan_id
            ))
            
    conn.commit()
    print("Applications, Loans, Repayments, and Transactions created.")

def main():
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()
    try:
        create_schemes(cursor)
        users = generate_users_and_profiles(conn, cursor)
        generate_groups(conn, cursor, users)
        generate_full_loan_data(conn, cursor, users)
        print("SUCCESS: Full synthetic data generation complete.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
