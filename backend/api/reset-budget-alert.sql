-- Reset LastAlertSentAt to test email notifications again
UPDATE Budgets SET LastAlertSentAt = NULL WHERE Id = 5;

-- Or reset for all budgets:
-- UPDATE Budgets SET LastAlertSentAt = NULL;
