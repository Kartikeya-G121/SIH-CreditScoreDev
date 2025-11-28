# SIH Credit Scoring System - Workspace Index

## Project Overview
Smart India Hackathon project implementing a comprehensive credit scoring and loan management system with AI-powered features.

## Directory Structure

### Frontend (`front/SIH-CreditScore/`)
**Technology Stack:** Next.js, TypeScript, React, Tailwind CSS

#### Core Application
- `src/app/` - Next.js app router pages
  - `dashboard/` - Main dashboard and group management
  - `login/`, `register/`, `verify-otp/` - Authentication flows
  - `page.tsx` - Landing page

#### Components Architecture
- `src/components/`
  - `auth/` - Authentication forms (login, register, OTP)
  - `dashboards/` - Dashboard components for different user roles
  - `chatbot/` - AI chatbot integration
  - `credit-scoring/` - Credit assessment UI
  - `ui/` - Reusable UI components (shadcn/ui)

#### AI Integration
- `src/ai/` - AI/ML integration layer
  - `flows/` - AI workflow implementations
  - `ai-credit-scoring.ts` - Credit scoring AI logic
  - `genkit.ts` - AI toolkit configuration

#### Services & Data
- `src/services/` - API service layers
- `src/contexts/` - React context providers
- `src/lib/` - Utilities and data management
- `src/types/` - TypeScript type definitions

### Backend (`newback/SIH_backend/`)
**Technology Stack:** Java Spring Boot, PostgreSQL, Redis

#### Module Documentation
- `module_srs/` - Software Requirements Specifications
  - 12 modules covering auth, beneficiary, groups, loans, scoring, etc.

#### Core Application (`src/main/java/com/sih/`)
- `common/` - Shared configurations and utilities
- `module/` - Feature modules:
  - `auth/` - User authentication and management
  - `beneficiary/` - Beneficiary profile management
  - `group/` - Group lending functionality
  - `consumption/` - Consumption tracking with OCR
  - `scoring/` - AI-powered credit scoring
  - `loan/` - Loan management and repayments
  - `fraud/` - Fraud detection system
  - `notification/` - SMS/email notifications
  - `voice/` - Voice interaction support
  - `audit/` - Audit logging

#### Database
- `src/main/resources/db/migration/` - Flyway database migrations
- `master_schema.sql` - Complete database schema

#### OCR Service
- `ocr-service/` - Python-based OCR microservice
  - Flask application for document processing
  - Field extraction and validation

## Key Features

### 1. Multi-Role Dashboard System
- **Admin Dashboard** - System administration and oversight
- **Officer Dashboard** - Loan officer management interface  
- **Beneficiary Dashboard** - End-user interface
- **Group Dashboard** - Group lending management

### 2. AI-Powered Credit Scoring
- Machine learning models for credit assessment
- Regional parameter consideration
- Explainable AI for score transparency
- Risk monitoring and alerts

### 3. Document Processing
- OCR integration for bill/document parsing
- BBPS (Bharat Bill Payment System) integration
- Automated field extraction and validation

### 4. Group Lending System
- Group formation and management
- Collective responsibility tracking
- Group-based risk assessment

### 5. Fraud Detection
- Real-time fraud monitoring
- Alert system with resolution workflow
- Blacklist management

### 6. Multi-Channel Support
- Web interface (React/Next.js)
- Voice interaction support
- SMS notifications
- Chatbot assistance

## Quick Start Guides
- `QUICK_START.md` - General setup instructions
- `QUICK_START_CONSUMPTION.md` - Consumption module setup
- `RUN_APPLICATION.md` - Application execution guide
- `RUN_WITH_DOCKER.md` - Docker deployment guide

## API Documentation
- `api_catalog.md` - Complete API catalog
- `API_COMPLETE_PROFILE.md` - Profile API documentation
- Test collections in `tests/` directory

## Development Setup

### Frontend
```bash
cd front/SIH-CreditScore
npm install
npm run dev
```

### Backend
```bash
cd newback/SIH_backend
./mvnw spring-boot:run
```

### OCR Service
```bash
cd newback/SIH_backend/ocr-service
docker-compose up
```

## Configuration Files
- Frontend: `next.config.ts`, `tailwind.config.ts`, `components.json`
- Backend: `application.yml`, `pom.xml`, `docker-compose.yml`
- Environment: `.env`, `.env.example`

## Documentation
- `master_system_documentation.md` - Complete system documentation
- `PROJECT_STATUS.md` - Current project status
- `DATABASE_MIGRATION_GUIDE.md` - Database setup guide
- `CONSUMPTION_MODULE_SETUP.md` - Consumption module guide

## Deployment
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-service deployment
- `apphosting.yaml` - Firebase hosting configuration
- `start-services.ps1` - Windows service startup script