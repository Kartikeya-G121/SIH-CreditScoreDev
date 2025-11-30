# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start PostgreSQL

```bash
# Using Docker (recommended)
docker-compose up -d postgres

# Or use existing PostgreSQL
# Make sure PostgreSQL is running on localhost:5432
```

### Step 2: Configure Environment

Create a `.env` file or set environment variables:

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres

# SMTP (for forgot password emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application
APP_BASE_URL=http://localhost:3000
```

**For Gmail SMTP:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password)

**For Testing (Mailtrap):**
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
```

### Step 3: Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The application will:
- ✅ Automatically run Flyway migrations
- ✅ Create all database tables
- ✅ Start on http://localhost:8080

### Step 4: Test the API

#### Register a User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "password123"
  }'
```

#### Forgot Password
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

This will send an email with a reset link!

#### Reset Password
```bash
curl -X POST http://localhost:8080/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_FROM_EMAIL",
    "newPassword": "newpassword123"
  }'
```

## 📋 Available Endpoints

### Public Endpoints
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /actuator/health` - Health check

### Protected Endpoints (Requires Authentication)
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/admin/feature-flags` - List feature flags (Admin only)
- `PUT /api/v1/admin/feature-flags/{name}` - Update feature flag (Admin only)

## 🗄️ Database

The database will be automatically created with all tables:
- `users` - User accounts
- `feature_flags` - System feature toggles
- `beneficiary_profiles` - Beneficiary information
- `borrower_groups` - Group lending
- `consumption_entries` - Consumption data
- `loan_schemes` - Loan products
- `loan_applications` - Loan applications
- `loans` - Active loans
- `repayments` - Repayment records
- And more...

## 🔍 Verify Setup

1. **Check Database**: Connect to PostgreSQL and verify tables exist
   ```sql
   \dt
   ```

2. **Check Application**: Visit http://localhost:8080/actuator/health

3. **Check Logs**: Look for "Started IncomeProcessingSystemApplication"

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in `application.yml`
- Verify database exists: `CREATE DATABASE income_processing_db;`

### SMTP Email Not Sending
- Check SMTP credentials
- For Gmail: Use App Password, not regular password
- Check firewall/network settings
- Try Mailtrap for testing

### Port Already in Use
- Change port in `application.yml`:
  ```yaml
  server:
    port: 8081
  ```

## 📚 Next Steps

1. Review `PROJECT_STATUS.md` for implementation progress
2. Check `api_catalog.md` for all API endpoints
3. Read module SRS files in `module_srs/` for detailed specifications
4. Start implementing remaining modules!

## 💡 Tips

- Use Postman or Insomnia for API testing
- Enable SQL logging in `application-dev.yml` for debugging
- Check Flyway migration status in logs
- Use Docker Compose for consistent local environment

