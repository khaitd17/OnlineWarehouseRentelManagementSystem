# OWRMS Postman Test Pack

## Scope
This pack is separated into 3 independent collection files:
- Rental feature tests
- Contract feature tests
- Payment feature tests

## Files
- OWRMS-Rental.postman_collection.json
- OWRMS-Contract.postman_collection.json
- OWRMS-Payment.postman_collection.json
- OWRMS-Local.postman_environment.json
- owrms_runner_data.csv
- TEST_CASES_FULL.md

## Import And Setup
1. Import OWRMS-Local.postman_environment.json
2. Import all 3 collection files
3. Select environment OWRMS Local - Rental Contract Payment
4. Update required credentials:
   - renterEmail, renterPassword
   - ownerEmail, ownerPassword
5. If OTP is real, update otpCode before OTP verification steps

## Recommended Run Order
1. OWRMS-Rental.postman_collection.json
2. OWRMS-Contract.postman_collection.json
3. OWRMS-Payment.postman_collection.json

## Notes
- startDate=AUTO means startDate is auto-generated at runtime (today + 7 days)
- warehouseId and rentalAreaId can stay empty, collection auto-detects from approved warehouse list
- payment webhook test sends unique transaction id and duplicate call for idempotency
- payment status check includes short polling to catch delayed reconciliation

## Collection Runner
- Use owrms_runner_data.csv as iteration data
- CSV keys override environment keys during each run

## Newman Examples
Run Rental:
newman run OWRMS-Rental.postman_collection.json -e OWRMS-Local.postman_environment.json -d owrms_runner_data.csv --reporters cli

Run Contract:
newman run OWRMS-Contract.postman_collection.json -e OWRMS-Local.postman_environment.json -d owrms_runner_data.csv --reporters cli

Run Payment:
newman run OWRMS-Payment.postman_collection.json -e OWRMS-Local.postman_environment.json -d owrms_runner_data.csv --reporters cli
