# How to Run the Application

## 📋 Prerequisites

Before running, ensure you have:
- ✅ **Java 17+** installed (`java -version`)
- ✅ **Maven 3.8+** installed (`mvn -version`)
- ✅ **Docker** (optional, for PostgreSQL) OR **PostgreSQL 15+** installed locally
- ✅ **Git** (if cloning from repository)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Start PostgreSQL Database

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify it's running
docker ps

# Check logs if needed
docker-compose logs -f postgres
```

**Option B: Using Local PostgreSQL**
```bash
# Create database
psql -U postgres
CREATE DATABASE income_processing_db;
\q
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root (optional, or set environment variables):

```bash
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT Secret (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-min-256-bits-change-this-in-production

# SMTP Configuration (for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Application URL
APP_BASE_URL=http://localhost:3000
```

**Note:** 
- For Gmail: Enable 2FA and use App Password (not regular password)
- For testing: Use Mailtrap (smtp.mailtrap.io) or leave SMTP empty (emails will fail but app will run)

### Step 3: Build the Project

```bash
# Clean and build
mvn clean install

# Skip tests (faster)
mvn clean install -DskipTests
```

### Step 4: Run the Application

```bash
# Run with Maven
mvn spring-boot:run

# Or run the JAR file
java -jar target/income-processing-system-1.0.0-SNAPSHOT.jar
```

**The application will:**
- ✅ Automatically run Flyway migrations
- ✅ Create all database tables
- ✅ Start on **http://localhost:8080**

### Step 5: Verify It's Running

```bash
# Check health endpoint
curl http://localhost:8080/actuator/health

# Or open in browser
# http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

---

## 🧪 Test the Application

### 1. Register a New User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "email": "test@example.com",
    "role": "BENEFICIARY",
    "expiresIn": 86400000
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Endpoint

```bash
# Save the accessToken from login response
TOKEN="your-access-token-here"

# Get current user profile
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test Forgot Password (if SMTP configured)

```bash
curl -X POST http://localhost:8080/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## 🔧 Configuration Options

### Run with Different Profile

```bash
# Development profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Production profile
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

### Change Port

Edit `application.yml`:
```yaml
server:
  port: 8081
```

Or set environment variable:
```bash
export SERVER_PORT=8081
mvn spring-boot:run
```

### Disable Email (for testing)

If you don't want to configure SMTP, the app will still run. Email sending will fail but won't crash the app.

---

## 📊 Database Verification

### Check Tables Created

```bash
# Connect to PostgreSQL
docker exec -it income-processing-postgres psql -U postgres -d income_processing_db

# List all tables
\dt

# Check a specific table
SELECT * FROM users;
SELECT * FROM feature_flags;
```

### View Flyway Migration Status

Check application logs for:
```
Flyway migration successful
```

---

## 🐛 Troubleshooting

### Issue: Port 8080 Already in Use

**Solution:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux

# Kill the process or change port in application.yml
```

### Issue: Database Connection Failed

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
# OR
pg_isready -U postgres  # If using local PostgreSQL

# Verify credentials in application.yml
# Test connection manually
psql -h localhost -U postgres -d income_processing_db
```

### Issue: JWT Secret Too Short

**Solution:**
Set a longer JWT secret (minimum 256 bits = 32 characters):
```bash
export JWT_SECRET=your-very-long-secret-key-at-least-32-characters-long-for-security
```

### Issue: Flyway Migration Failed

**Solution:**
```bash
# Check database exists
# Check user has permissions
# Check application logs for specific error

# Manual migration
mvn flyway:migrate
```

### Issue: SMTP Email Not Sending

**Solution:**
- For Gmail: Use App Password (not regular password)
- For testing: Use Mailtrap or disable email features
- Check firewall/network settings
- Application will still run even if email fails

---

## 🎯 Common Commands

```bash
# Start database
docker-compose up -d postgres

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Run tests
mvn test

# Check application health
curl http://localhost:8080/actuator/health

# View all endpoints (if Swagger added)
# http://localhost:8080/swagger-ui.html
```

---

## 📝 Next Steps After Running

1. **Test Authentication Flow:**
   - Register → Login → Access protected endpoint
   - Test forgot password (if SMTP configured)

2. **Create Admin User:**
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

3. **Test Feature Flags:**
   ```bash
   curl -X GET http://localhost:8080/api/v1/admin/feature-flags \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

4. **Explore APIs:**
   - Check `api_catalog.md` for all available endpoints
   - Use Postman/Insomnia to test APIs

---

## ✅ Success Checklist

- [ ] PostgreSQL is running
- [ ] Database `income_processing_db` exists
- [ ] Application starts without errors
- [ ] Health endpoint returns `{"status":"UP"}`
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can access protected endpoints with token
- [ ] Database tables are created (check with `\dt`)

---

## 🆘 Need Help?

1. Check application logs for errors
2. Verify all prerequisites are installed
3. Check database connection
4. Review `QUICK_START.md` for quick reference
5. Check `PROJECT_STATUS.md` for implementation details

---

**Application is now running! 🎉**

Access it at: **http://localhost:8080**

