CREATE TABLE IF NOT EXISTS traffic_visitors (
 ip_hash TEXT PRIMARY KEY,
 first_seen_ts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS traffic_hits (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ts INTEGER NOT NULL,
 ip_hash TEXT NOT NULL,
 session_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_traffic_hits_ts ON traffic_hits(ts);
CREATE INDEX IF NOT EXISTS idx_traffic_hits_ip ON traffic_hits(ip_hash);
