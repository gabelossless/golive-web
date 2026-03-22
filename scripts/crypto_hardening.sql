-- Hardening the tip_transactions table
-- 1. Ensure transaction_hash is UNIQUE to prevent double-counting
ALTER TABLE tip_transactions ADD CONSTRAINT unique_tip_tx_hash UNIQUE (transaction_hash);

-- 2. Add an index for performance on large tip feeds
CREATE INDEX idx_tip_tx_creator ON tip_transactions(creator_user_id);
CREATE INDEX idx_tip_tx_sender ON tip_transactions(sender_user_id);

-- 3. Ensure every tip has a status
ALTER TABLE tip_transactions ALTER COLUMN status SET DEFAULT 'pending';
