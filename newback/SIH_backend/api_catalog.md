# Master API Catalog (Exhaustive - Pass 2)

## Global Standards
- **Base URL**: `/api/v1`
- **Authentication**: Bearer Token (JWT) required.
- **Pagination**: `?page=0&size=10&sort=createdAt,desc`
- **Response Format**:
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": { ... },
    "error": null,
    "timestamp": "2023-10-27T10:00:00Z"
  }
  ```

---

## Module 1: Auth & User Management
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login with email/phone & password | Public |
| POST | `/auth/refresh-token` | Refresh access token | Public |
| POST | `/auth/logout` | Logout (invalidate token) | Any |
| POST | `/auth/forgot-password` | Initiate password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| GET | `/users/me` | Get current user profile | Any |
| PUT | `/users/me` | Update current user profile | Any |
| PUT | `/users/me/change-password` | Change password | Any |
| GET | `/users` | List all users (Filter by role) | Admin |
| GET | `/users/{id}` | Get specific user details | Admin |
| PUT | `/users/{id}/status` | Activate/Deactivate user | Admin |
| DELETE | `/users/{id}` | Soft delete user | Admin |
| **GET** | `/admin/feature-flags` | List all feature flags | Admin |
| **PUT** | `/admin/feature-flags/{name}` | Toggle feature flag | Admin |

## Module 2: Beneficiary & Analytics
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/beneficiaries` | Create beneficiary profile | User |
| GET | `/beneficiaries/me` | Get my beneficiary profile | User |
| PUT | `/beneficiaries/me` | Update my profile | User |
| POST | `/beneficiaries/upload-certificate` | Upload caste/income cert | User |
| GET | `/beneficiaries/certificate/download` | Download certificate | User, Officer |
| GET | `/beneficiaries` | Search beneficiaries | Officer, Admin |
| GET | `/beneficiaries/{id}` | Get specific profile | Officer, Admin |
| PUT | `/beneficiaries/{id}/verify` | Mark profile as verified | Officer |
| **GET** | `/analytics/heatmap/state-wise` | Get state-wise risk/income data | Admin, Officer |
| **GET** | `/analytics/heatmap/district-wise` | Get district-wise data | Admin, Officer |
| **GET** | `/analytics/heatmap/clusters` | Get Red/Green zone clusters | Admin, Officer |
| **GET** | `/beneficiaries/stats/demographics` | Get demographic stats | Admin |

## Module 3: Group Lending
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/groups` | Create a new borrower group | User |
| GET | `/groups` | List groups | User, Officer |
| GET | `/groups/my-groups` | List my groups | User |
| GET | `/groups/{id}` | Get group details | User, Officer |
| PUT | `/groups/{id}` | Update group details | Leader |
| DELETE | `/groups/{id}` | Disband group | Leader |
| POST | `/groups/{id}/join` | Request to join | User |
| POST | `/groups/{id}/leave` | Leave group | User |
| GET | `/groups/{id}/members` | List members | User, Officer |
| PUT | `/groups/{id}/members/{userId}/approve` | Approve member | Leader |
| DELETE | `/groups/{id}/members/{userId}` | Remove member | Leader |

## Module 4: Consumption
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/consumption/upload` | Upload bill/recharge data | User |
| GET | `/consumption` | List my entries | User |
| GET | `/consumption/{id}` | Get entry details | User, Officer |
| DELETE | `/consumption/{id}` | Delete entry | User |
| GET | `/consumption/summary` | Get aggregated stats | User, Officer |
| PUT | `/consumption/{id}/verify` | Manually verify entry | Officer |
| GET | `/consumption/admin/search` | Search entries | Officer |
| **POST** | `/sync/offline-data` | Batch upload offline data | User |

## Module 5: Fraud
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/fraud/alerts` | List fraud alerts | Officer, Admin |
| GET | `/fraud/alerts/{id}` | Get alert details | Officer, Admin |
| PUT | `/fraud/alerts/{id}/resolve` | Resolve alert | Officer, Admin |
| POST | `/fraud/check-user/{userId}` | Trigger manual check | Officer |
| POST | `/fraud/blacklist/{userId}` | Blacklist user | Admin |
| GET | `/fraud/blacklist` | List blacklisted users | Officer, Admin |
| **GET** | `/fraud/rules` | List active fraud rules | Admin |
| **PUT** | `/fraud/rules/{id}` | Update rule thresholds | Admin |

## Module 6: Loan Schemes & Regional
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/schemes` | Create new scheme | Admin |
| GET | `/schemes` | List active schemes | Public |
| GET | `/schemes/{id}` | Get scheme details | Public |
| PUT | `/schemes/{id}` | Update scheme | Admin |
| DELETE | `/schemes/{id}` | Soft delete scheme | Admin |
| PUT | `/schemes/{id}/toggle` | Toggle active | Admin |
| **GET** | `/admin/regional-parameters` | List regional params | Admin |
| **POST** | `/admin/regional-parameters` | Add regional param | Admin |
| **PUT** | `/admin/regional-parameters/{id}` | Update param | Admin |

## Module 7: Loan Applications
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/applications` | Create draft application | User |
| GET | `/applications` | List my applications | User |
| GET | `/applications/{id}` | Get application details | User, Officer |
| PUT | `/applications/{id}` | Update draft | User |
| POST | `/applications/{id}/submit` | Submit for review | User |
| POST | `/applications/{id}/withdraw` | Withdraw application | User |
| GET | `/applications/officer/pending` | List pending apps | Officer |
| PUT | `/applications/{id}/review` | Review (Approve/Reject) | Officer |
| POST | `/applications/{id}/sanction` | Sanction loan | Officer |
| GET | `/applications/{id}/timeline` | Get status timeline | User, Officer |

## Module 8: Scoring Engine
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/scoring/assess/{applicationId}` | Trigger assessment | System, Officer |
| GET | `/scoring/assessments/{applicationId}` | Get result | Officer |
| GET | `/scoring/models` | List ML models | Admin |
| POST | `/scoring/models` | Register new model | Admin |
| PUT | `/scoring/models/{id}/activate` | Activate model | Admin |
| POST | `/scoring/simulate` | Simulate score | Admin |

## Module 9: Loans & Repayments
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/loans` | List my loans | User |
| GET | `/loans/{id}` | Get loan details | User, Officer |
| GET | `/loans/admin/search` | Search loans | Officer |
| GET | `/loans/{id}/schedule` | Get repayment schedule | User, Officer |
| GET | `/loans/{id}/transactions` | Get history | User, Officer |
| POST | `/loans/{id}/repay` | Make repayment | User |
| POST | `/loans/{id}/foreclose` | Foreclose loan | User |
| POST | `/loans/{id}/waive-off` | Waive off loan | Admin |

## Module 10: Notifications
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/notifications` | Get my notifications | User |
| PUT | `/notifications/{id}/read` | Mark as read | User |
| PUT | `/notifications/read-all` | Mark all read | User |
| POST | `/notifications/send` | Send manual notification | Admin |
| GET | `/notifications/templates` | List templates | Admin |

## Module 11: Voice
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/voice/command` | Upload audio command | User |
| GET | `/voice/history` | Get interaction history | User |
| GET | `/voice/supported-languages` | Get supported languages | Public |

## Module 12: Audit & Logging
| Method | Endpoint | Description | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/audit/logs` | Search system logs | Auditor, Admin |
| GET | `/audit/logs/{id}` | Get log details | Auditor, Admin |
| GET | `/audit/rescore-logs` | View scoring changes | Auditor |
| POST | `/audit/export` | Export logs (CSV/PDF) | Auditor |
