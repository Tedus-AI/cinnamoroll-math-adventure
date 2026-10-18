CREATE TABLE IF NOT EXISTS wishes (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 user_id TEXT REFERENCES players(id),
 sender TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('feature','suggestion','bug')),
 title TEXT NOT NULL,
 message TEXT NOT NULL,
 context TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','done'))
);
CREATE INDEX IF NOT EXISTS wishes_status_idx ON wishes(status,seq);
