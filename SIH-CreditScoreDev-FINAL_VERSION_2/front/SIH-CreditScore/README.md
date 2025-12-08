# Beneficiary Credit Scoring with Income Verification Layer for Direct Digital Lending

### Smart India Hackathon 2025 — Team UDAAN
**Problem Statement ID:** 25150  
**Theme:** Smart Automation  
**Category:** Software  
**Team ID:** BMS/SIH2025/07  

---

## Problem Overview

Current government and NGO loan systems often fail to target genuine low-income beneficiaries due to:

- Lack of verified or reliable income data  
- Manual, time-consuming loan approvals  
- Incomplete or inconsistent applicant data  
- No AI-driven or explainable risk scoring system  

As a result, deserving applicants are often excluded, while ineligible individuals gain access to funds.

---

## Solution — UDAAN

An AI-powered credit scoring system with an income verification layer designed for direct digital lending.

### Key Highlights
- Uses alternative income data sources (bills, recharges, digital transactions)
- Implements ML-based income and risk classification
- Uses Explainable AI (LIME, SHAP) for transparency
- Automates loan evaluation and risk categorization
- Generates a composite credit score combining income & repayment risk

---

## System Architecture

```
Data Layer → Preprocessing → ML Ensemble → Explainability (LIME/SHAP)
     ↓              ↓                ↓
Spring Boot Backend → API Layer → Frontend Dashboard
```

### Components
| Layer | Description |
|--------|-------------|
| AI/ML Layer | Credit scoring, clustering (K-Means), ensemble models |
| Backend | Spring Boot REST API + Re-scoring Engine |
| Frontend | React.js dashboard for admins & beneficiaries |
| Database | PostgreSQL / MongoDB |
| Deployment | Docker + Vercel |

---

## Core Pipelines

### Income Classification Pipeline
- Groups beneficiaries using K-Means based on alternative data  
- Explains predictions with LIME and SHAP  
- Classifies income bracket → Low / Medium / High

### Risk Assessment Pipeline
- Predicts repayment probability using ensemble ML models  
- Combines risk and income → Composite Credit Score  
- Generates a transparent risk report

---

## Tech Stack

| Category | Technology |
|-----------|-------------|
| Backend | Spring Boot |
| AI/ML | Python, Scikit-learn, Pandas, LIME, SHAP |
| Frontend | React.js, Vercel |
| Database | PostgreSQL / MongoDB |
| Deployment | Docker, Render, Vercel |

---

## Output Matrix

| Risk Level | Income Level | Result |
|-------------|---------------|--------|
| Low | Low | Genuine Low-Income Beneficiary |
| Low | High | Non-Low Income, Good Credit |
| High | Low | Risky Borrower |
| High | High | Reject / Re-verify |

---

## Impact

- Enables financial inclusion for genuine low-income citizens  
- Reduces manual bias and paperwork  
- Improves transparency and accountability  
- Speeds up loan approvals from days to minutes  

---

## Future Roadmap

- Integration with government APIs for income verification  
- Regional language support  
- Cloud-native microservices for scalability  
- Mobile-first dashboard & live risk monitoring  

---
