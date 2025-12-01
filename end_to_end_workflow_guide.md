# End-to-End Workflow Guide: Application & Loan Modules

This document serves as the **Master Guide** for the entire credit lifecycle. It details every stage from the moment a user applies for a loan to the moment it is closed, including the complex interactions with the Group Module.

---

## Phase 1: Application Initiation

### Scenario A: Individual Application
**User Action**: User fills out the loan application form.
**Backend Logic**:
*   Validates user eligibility.
*   Creates a [LoanApplication](file:///e:/SIH-CreditScoreDev-master/newback/SIH_backend/src/main/java/com/sih/module/application/entity/LoanApplication.java#16-77) record with status `DRAFT`.
*   **API**: `POST /api/v1/applications`

### Scenario B: Group Application
**User Action**: User (Member) creates an application linked to their Group.
**Backend Logic**:
*   Validates that the Group is `ACTIVE` and not `DEFAULTED`.
*   Links the application to the [BorrowerGroup](file:///e:/SIH-CreditScoreDev-master/newback/SIH_backend/src/main/java/com/sih/module/group/entity/BorrowerGroup.java#14-55).
*   **API**: `POST /api/v1/applications` (with `groupId` in payload)

### Submission
**User Action**: User submits the application.
**Backend Logic**:
*   Status changes to `SUBMITTED`.
*   If Group Loan: The Group Leader may need to "Submit All" for the group batch.
*   **API**: `POST /api/v1/applications/{id}/submit`
*   **Group API**: `POST /api/v1/applications/group/{groupId}/submit` (Leader Action)

---

## Phase 2: Review & Sanctioning (Officer POV)

### Review
**Officer Action**: Officer views pending applications and requests changes or approves.
**Backend Logic**:
*   Officer can update status to `REVIEWED` or `REJECTED`.
*   **API**: `PUT /api/v1/applications/{id}/review`

### Sanctioning (The Critical Transition)
**Officer Action**: Officer sanctions the application (approves the final amount and rate).
**Backend Logic**:
1.  **Status Update**: Application becomes `SANCTIONED`.
2.  **Loan Creation Trigger**:
    *   The system **automatically** converts the Application into a [Loan](file:///e:/SIH-CreditScoreDev-master/front/SIH-CreditScore/src/components/dashboards/loan-dashboard.tsx#19-33).
    *   **Batch Logic**: If it's a Group Application, the system checks for other sanctioned members in the group and creates loans for **all of them** simultaneously.
3.  **Schedule Generation**: The amortization schedule is generated immediately.
*   **API**: `POST /api/v1/applications/{id}/sanction`

---

## Phase 3: Active Loan Management (User POV)

### Dashboard View
**User Action**: User views their "My Loans" page.
**Backend Logic**:
*   Fetches all loans with status `ACTIVE`.
*   **Group Context**: Returns `groupName` and `groupStatus` so the user knows if their group is in trouble.
*   **API**: `GET /api/v1/loans`

### Repayment Schedule
**User Action**: User clicks "View Schedule".
**Backend Logic**:
*   Returns past payments (Receipts) and future projections (Estimates).
*   **API**: `GET /api/v1/loans/{id}/projected-schedule`

---

## Phase 4: Repayment & Adjustments

### Regular EMI
**User Action**: User pays the exact EMI amount.
**Backend Logic**:
*   Records [Repayment](file:///e:/SIH-CreditScoreDev-master/newback/SIH_backend/src/main/java/com/sih/module/loan/entity/Repayment.java#13-67) entity.
*   Updates `LastPaymentDate` and [NextPaymentDate](file:///e:/SIH-CreditScoreDev-master/newback/SIH_backend/src/main/java/com/sih/module/loan/repository/LoanRepository.java#17-18) (+1 month).
*   **API**: `POST /api/v1/loans/{id}/repay`

### Prepayment (Extra Payment)
**User Action**: User pays *more* than the EMI.
**Backend Logic**:
*   **Tenure Reduction** (Default): Keeps EMI same, reduces loan duration.
*   **EMI Reduction**: Keeps duration same, reduces monthly EMI.
*   **API**: `POST /api/v1/loans/{id}/repay` (Payload includes `adjustmentMode`)

### Foreclosure
**User Action**: User pays off the entire balance.
**Backend Logic**:
*   Validates total payoff amount.
*   Sets Loan Status to `FORECLOSED`.
*   Sets Outstanding Principal to `0`.
*   **API**: `POST /api/v1/loans/{id}/foreclose`

---

## Phase 5: Default & Risk Management

### Daily Check (System Job)
**Trigger**: Automatic daily scheduler ([checkDefaults](file:///e:/SIH-CreditScoreDev-master/newback/SIH_backend/src/main/java/com/sih/module/loan/service/LoanService.java#464-502)).
**Backend Logic**:
1.  Finds loans where `NextPaymentDate < Today`.
2.  Marks them `OVERDUE`.
3.  Applies **2% Penalty** to `accumulatedInterest`.

### Group Liability (Social Collateral)
**Trigger**: A member defaults (Loan becomes `OVERDUE`).
**Backend Logic**:
1.  **At Risk**: If any member is overdue, Group Status -> `AT_RISK`.
    *   *Impact*: Group Score reduces.
2.  **Defaulted**: If overdue > 30 days, Group Status -> `DEFAULTED`.
    *   *Impact*: **Blocking**. No member of this group can apply for a new loan (`POST /api/v1/applications` will fail).

---

## Summary of Key APIs

| Module | Action | Endpoint |
| :--- | :--- | :--- |
| **App** | Create | `POST /api/v1/applications` |
| **App** | Submit | `POST /api/v1/applications/{id}/submit` |
| **App** | Sanction | `POST /api/v1/applications/{id}/sanction` |
| **Loan** | List | `GET /api/v1/loans` |
| **Loan** | Repay | `POST /api/v1/loans/{id}/repay` |
| **Loan** | Foreclose | `POST /api/v1/loans/{id}/foreclose` |
| **Group** | Status | `GET /api/v1/groups/{id}` |
