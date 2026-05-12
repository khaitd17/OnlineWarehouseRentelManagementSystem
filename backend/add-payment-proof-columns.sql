ALTER TABLE rental_payments
ADD transaction_code NVARCHAR(100) NULL,
    proof_url NVARCHAR(500) NULL,
    proof_note NVARCHAR(1000) NULL,
    proof_submitted_at DATETIME2 NULL,
    proof_request_reason NVARCHAR(500) NULL,
    proof_requested_at DATETIME2 NULL;
