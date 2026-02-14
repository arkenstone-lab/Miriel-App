-- Track how many times AI summary+todos have been generated per entry (daily limit: 3)
ALTER TABLE entries ADD COLUMN summary_gen_count INTEGER DEFAULT 0;
