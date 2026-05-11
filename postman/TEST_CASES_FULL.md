# OWRMS Full Test Cases - Rental, Contract, Payment

## Rental Feature Test Cases

| ID | API | Test Case | Expected Result |
|---|---|---|---|
| R-01 | POST /auth/login | Login renter with valid account | 200, token returned |
| R-02 | POST /auth/login | Login owner with valid account | 200, token returned |
| R-03 | GET /warehouse/approved | Load approved warehouses | 200, list not empty |
| R-04 | GET /warehouse/approved/search | Search warehouses default filters | 200, paged list returned |
| R-05 | GET /warehouse/{id} | Get selected warehouse detail | 200, warehouse detail returned |
| R-06 | POST /rental-requests | Create request with valid payload | 200/201, requestId created |
| R-07 | POST /rental-requests/{id}/send | Send request from DRAFT to PENDING | 200, status transition success |
| R-08 | GET /rental-requests/pending | Owner view pending queue | 200, pending requests listed |
| R-09 | POST /rental-requests/{id}/approve | Owner approve pending request | 200, contractId returned |
| R-10 | GET /rental-requests/{id} | Verify approved request detail | 200, status APPROVED/IN_PROGRESS |
| R-11 | GET /rental-requests/my-requests | Renter view own requests | 200, list returned |
| R-12 | POST /rental-requests/{id}/reject | Owner reject pending request | 200, rejection accepted |
| R-13 | GET /rental-requests/{id} | Verify rejected request detail | 200, status REJECTED |
| R-14 | POST /rental-requests/{id}/cancel | Renter cancel pending request | 200, cancellation accepted |
| R-15 | GET /rental-requests/{id} | Verify canceled request detail | 200, canceled-like status |
| R-16 | GET /rental-requests/owner/all | Owner view all requests | 200, full owner list returned |
| R-17 | POST /rental-requests | Unauthorized create request | 401/403 |
| R-18 | GET /rental-requests/pending | Renter tries owner queue | 401/403 |

## Contract Feature Test Cases

| ID | API | Test Case | Expected Result |
|---|---|---|---|
| C-01 | Bootstrap via rental endpoints | Create contract for sign scenario | contractIdSign created |
| C-02 | Bootstrap via rental endpoints | Create contract for decline scenario | contractIdDecline created |
| C-03 | POST /rental-contracts/{id}/send-otp | Send OTP before signing | 200/204 |
| C-04 | POST /rental-contracts/{id}/verify-otp | Verify invalid OTP | 400/401/422 |
| C-05 | POST /rental-contracts/{id}/verify-otp | Verify valid OTP | 200 |
| C-06 | POST /rental-contracts/{id}/owner-sign | Owner signs contract | 200 |
| C-07 | POST /rental-contracts/{id}/sign | Renter signs contract | 200 |
| C-08 | GET /rental-contracts/{id} | Verify signed contract detail | 200, status SIGNED/PENDING_PAYMENT/ACTIVE |
| C-09 | GET /rental-contracts/{id}/signing-history | View signing history | 200, timeline returned |
| C-10 | GET /rental-contracts/{id}/logs | View contract logs | 200 |
| C-11 | GET /rental-contracts/{id}/audit-logs | View audit logs | 200 or 404 depending backend |
| C-12 | GET /rental-contracts/my-contracts | Renter contract list | 200 |
| C-13 | GET /rental-contracts/owner-contracts | Owner contract list | 200 |
| C-14 | GET /rental-contracts/warehouse/{warehouseId} | Contract list by warehouse | 200 |
| C-15 | POST /rental-contracts/{id}/decline | Renter declines contract | 200 |
| C-16 | GET /rental-contracts/{id} | Verify declined contract detail | 200, declined-like status |
| C-17 | POST /rental-contracts/{id}/owner-sign | Owner signs declined contract | 400/404/409 |
| C-18 | POST /rental-contracts/{id}/extend | Extend signed contract | 200/400/409 |
| C-19 | GET /rental-contracts/{id} | Unauthorized get contract detail | 401/403 |

## Payment Feature Test Cases

| ID | API | Test Case | Expected Result |
|---|---|---|---|
| P-01 | Bootstrap via rental + contract signing | Create signed contract for payment tests | contractIdPayment created |
| P-02 | POST /payments/create | Create DEPOSIT bank transfer payment | 200/201, paymentId and paymentCode |
| P-03 | GET /payments/{id}/qr-info | Get QR payment info | 200, qrImageUrl exists |
| P-04 | GET /payments/{id}/status | Check status before webhook | 200, valid status |
| P-05 | POST /payments/sepay-webhook | Simulate webhook success | 200, processed |
| P-06 | POST /payments/sepay-webhook | Send duplicate webhook transaction | 200, idempotent handling |
| P-07 | GET /payments/{id}/status | Verify status after webhook | 200, status valid or completed |
| P-08 | GET /payments/contract/{contractId} | List contract payments | 200, includes created payment |
| P-09 | GET /payments/history | Renter payment history | 200 |
| P-10 | POST /payments/cash | Create cash payment approve path | 200/201, cash payment id |
| P-11 | GET /payments/pending-confirmation | Owner pending cash queue | 200 |
| P-12 | POST /payments/{id}/confirm | Owner approve cash payment | 200 |
| P-13 | POST /payments/cash | Create cash payment reject path | 200/201, cash payment id |
| P-14 | POST /payments/{id}/confirm | Owner reject cash payment | 200 |
| P-15 | GET /payments/cash-confirmation-list | Owner cash confirmation list | 200 |
| P-16 | POST /payments/{id}/retry | Retry payment | 200/400/409 |
| P-17 | POST /payments/create | Invalid payment method | 400/422 |
| P-18 | POST /payments/create | Create payment without token | 401/403 |
| P-19 | POST /payments/{id}/confirm | Renter tries confirm cash payment | 401/403 |

## Coverage Summary

- Rental: functional, state transition, authorization
- Contract: OTP, digital signing, logs, decline, extension
- Payment: bank transfer, webhook, idempotency, cash confirmation, retry, authorization

## Execution Order

1. Run OWRMS-Rental.postman_collection.json
2. Run OWRMS-Contract.postman_collection.json
3. Run OWRMS-Payment.postman_collection.json

## Pass Criteria

- All positive cases pass with expected status and key fields.
- Negative cases fail with correct HTTP code.
- Key state transitions are correct:
  - Rental: DRAFT -> PENDING -> APPROVED/REJECTED/CANCELLED
  - Contract: PENDING_OWNER_SIGNATURE -> PENDING_RENTER_SIGNATURE -> SIGNED/PENDING_PAYMENT/ACTIVE
  - Payment: PENDING -> COMPLETED or expected terminal state
