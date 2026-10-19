-- Removes the free-tier account automation tables. Kalki now only uses
-- API keys that the operator supplies.
DROP TABLE IF EXISTS "farming_runs";
DROP TABLE IF EXISTS "TrialAccount";
DROP TYPE IF EXISTS "FarmingStatus";
