
-- =====================================================
-- AR-IMMS
-- DATABASE: PostgreSQL
-- DATABASE NAME: cnpm
-- =====================================================


-- =====================================================
-- 1. USERS - TAI KHOAN NGUOI DUNG
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'OPERATOR', 'TECHNICIAN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 2. SERVERS - THONG TIN MAY CHU
-- =====================================================

CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    server_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    qr_code VARCHAR(255) UNIQUE,

    status VARCHAR(20) DEFAULT 'UNKNOWN'
        CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING', 'UNKNOWN')),

    -- Nguong CPU va RAM (%)
    cpu_threshold NUMERIC(5,2) DEFAULT 80,
    ram_threshold NUMERIC(5,2) DEFAULT 80,

    -- Nguong Network (Byte/second)
    network_warning_threshold BIGINT,
    network_critical_threshold BIGINT,

    -- Thong tin phan cung
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    cpu_model VARCHAR(100),
    ram_gb INT,
    storage_gb INT,
    purchase_date DATE,
    warranty_expiry DATE,

    -- Thoi diem nhan telemetry gan nhat
    last_seen_at TIMESTAMPTZ,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Kiem tra nguong Network
    CONSTRAINT chk_servers_network_warning
        CHECK (
            network_warning_threshold IS NULL
            OR network_warning_threshold >= 0
        ),

    CONSTRAINT chk_servers_network_critical
        CHECK (
            network_critical_threshold IS NULL
            OR network_critical_threshold >= 0
        ),

    CONSTRAINT chk_servers_network_threshold_order
        CHECK (
            network_warning_threshold IS NULL
            OR network_critical_threshold IS NULL
            OR network_warning_threshold < network_critical_threshold
        )
);


-- =====================================================
-- 3. HISTORY - LICH SU THONG SO MAY CHU
-- =====================================================

CREATE TABLE IF NOT EXISTS history (
    id BIGSERIAL PRIMARY KEY,
    server_id INT NOT NULL REFERENCES servers(id),

    cpu_usage NUMERIC(5,2),
    ram_usage NUMERIC(5,2),

    network_in BIGINT,
    network_out BIGINT,

    -- Thong tin Docker
    docker_info JSONB,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 4. ALERTS - CANH BAO
-- =====================================================

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    server_id INT NOT NULL REFERENCES servers(id),

    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,

    severity VARCHAR(20) DEFAULT 'WARNING',
    status VARCHAR(20) DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    acknowledged_by INT REFERENCES users(id),
    acknowledged_at TIMESTAMP
);


-- =====================================================
-- 5. TICKETS - PHIEU BAO TRI
-- =====================================================

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,

    ticket_code VARCHAR(50) UNIQUE NOT NULL,

    server_id INT NOT NULL REFERENCES servers(id),
    alert_id INT REFERENCES alerts(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    status VARCHAR(20) DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),

    priority VARCHAR(20) DEFAULT 'MEDIUM',

    created_by INT REFERENCES users(id),
    assigned_to INT REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP
);


-- =====================================================
-- 6. MAINTENANCE_LOGS - LICH SU XU LY BAO TRI
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,

    ticket_id INT NOT NULL REFERENCES tickets(id),
    user_id INT REFERENCES users(id),

    action TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    result TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 7. AUDIT_LOGS - NHAT KY HOAT DONG
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id INT REFERENCES users(id),

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,

    details TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 8. BO SUNG COT CHO DATABASE PHIEN BAN CU
-- =====================================================

-- Bo sung thong tin phan cung neu chua ton tai

ALTER TABLE servers
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS model VARCHAR(100),
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS cpu_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS ram_gb INT,
ADD COLUMN IF NOT EXISTS storage_gb INT,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Bo sung nguong Network neu chua ton tai

ALTER TABLE servers
ADD COLUMN IF NOT EXISTS network_warning_threshold BIGINT,
ADD COLUMN IF NOT EXISTS network_critical_threshold BIGINT;

-- Bo sung thong tin Docker neu chua ton tai

ALTER TABLE history
ADD COLUMN IF NOT EXISTS docker_info JSONB;


-- =====================================================
-- 9. KIEM TRA CAC RANG BUOC NETWORK
-- =====================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_servers_network_warning'
          AND conrelid = 'servers'::regclass
    ) THEN
        ALTER TABLE servers
        ADD CONSTRAINT chk_servers_network_warning
        CHECK (
            network_warning_threshold IS NULL
            OR network_warning_threshold >= 0
        );
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_servers_network_critical'
          AND conrelid = 'servers'::regclass
    ) THEN
        ALTER TABLE servers
        ADD CONSTRAINT chk_servers_network_critical
        CHECK (
            network_critical_threshold IS NULL
            OR network_critical_threshold >= 0
        );
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_servers_network_threshold_order'
          AND conrelid = 'servers'::regclass
    ) THEN
        ALTER TABLE servers
        ADD CONSTRAINT chk_servers_network_threshold_order
        CHECK (
            network_warning_threshold IS NULL
            OR network_critical_threshold IS NULL
            OR network_warning_threshold < network_critical_threshold
        );
    END IF;

END $$;


-- =====================================================
-- 10. INDEX - TOI UU TRUY VAN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_history_server_time
ON history(server_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_server_status
ON alerts(server_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status
ON tickets(assigned_to, status);


-- =====================================================
-- 11. DU LIEU MAU - USERS
-- =====================================================

INSERT INTO users (full_name, email, password_hash, role)
VALUES
('Admin Demo', 'admin@arimms.local', 'demo_hash', 'ADMIN'),
('Operator Demo', 'operator@arimms.local', 'demo_hash', 'OPERATOR'),
('Technician Demo', 'technician@arimms.local', 'demo_hash', 'TECHNICIAN')
ON CONFLICT (email) DO NOTHING;


-- Tai khoan Admin cua he thong

INSERT INTO users (full_name, email, password_hash, role)
VALUES (
    'Admin',
    'admin@imms.local',
    '$2b$10$FtKos/nLoyXRcf/7Ongpt.Glz.plAb3aAoMLxkxWOGHQU/VNHArhW',
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;


-- =====================================================
-- 12. DU LIEU MAU - SERVERS
-- =====================================================

INSERT INTO servers
(
    server_code,
    name,
    description,
    location,
    qr_code,
    status,
    cpu_threshold,
    ram_threshold
)
VALUES
(
    'SRV001',
    'Server 01',
    'May chu thu nghiem 01',
    'Room A - Rack 01',
    'QR-SRV001',
    'ONLINE',
    80,
    80
),
(
    'SRV002',
    'Server 02',
    'May chu thu nghiem 02',
    'Room A - Rack 02',
    'QR-SRV002',
    'UNKNOWN',
    80,
    80
)
ON CONFLICT (server_code) DO NOTHING;


-- =====================================================
-- 13. DU LIEU MAU - HISTORY
-- =====================================================

INSERT INTO history
(
    server_id,
    cpu_usage,
    ram_usage,
    network_in,
    network_out
)
SELECT
    s.id,
    45.5,
    60.2,
    1024,
    2048
FROM servers s
WHERE s.server_code = 'SRV001'
AND NOT EXISTS (
    SELECT 1
    FROM history h
    WHERE h.server_id = s.id
      AND h.cpu_usage = 45.5
      AND h.ram_usage = 60.2
      AND h.network_in = 1024
      AND h.network_out = 2048
);


INSERT INTO history
(
    server_id,
    cpu_usage,
    ram_usage,
    network_in,
    network_out
)
SELECT
    s.id,
    92.0,
    85.5,
    4096,
    3072
FROM servers s
WHERE s.server_code = 'SRV001'
AND NOT EXISTS (
    SELECT 1
    FROM history h
    WHERE h.server_id = s.id
      AND h.cpu_usage = 92.0
      AND h.ram_usage = 85.5
      AND h.network_in = 4096
      AND h.network_out = 3072
);


INSERT INTO history
(
    server_id,
    cpu_usage,
    ram_usage,
    network_in,
    network_out
)
SELECT
    s.id,
    30.0,
    40.5,
    512,
    1024
FROM servers s
WHERE s.server_code = 'SRV002'
AND NOT EXISTS (
    SELECT 1
    FROM history h
    WHERE h.server_id = s.id
      AND h.cpu_usage = 30.0
      AND h.ram_usage = 40.5
      AND h.network_in = 512
      AND h.network_out = 1024
);


-- =====================================================
-- 14. DU LIEU MAU - ALERTS
-- =====================================================

INSERT INTO alerts
(
    server_id,
    alert_type,
    message,
    severity,
    status
)
SELECT
    s.id,
    'HIGH_CPU',
    'CPU usage reached 92%, exceeding the 80% threshold',
    'WARNING',
    'OPEN'
FROM servers s
WHERE s.server_code = 'SRV001'
AND NOT EXISTS (
    SELECT 1
    FROM alerts a
    WHERE a.server_id = s.id
      AND a.alert_type = 'HIGH_CPU'
      AND a.message =
          'CPU usage reached 92%, exceeding the 80% threshold'
);


-- =====================================================
-- 15. DU LIEU MAU - TICKETS
-- =====================================================

INSERT INTO tickets
(
    ticket_code,
    server_id,
    alert_id,
    title,
    description,
    status,
    priority,
    created_by,
    assigned_to
)
SELECT
    'TKT001',
    s.id,
    a.id,
    'Xu ly may chu CPU qua tai',
    'Kiem tra CPU 92% va RAM 85.5%',
    'OPEN',
    'HIGH',
    admin_user.id,
    technician_user.id
FROM servers s
JOIN alerts a
    ON a.server_id = s.id
   AND a.alert_type = 'HIGH_CPU'
   AND a.message =
       'CPU usage reached 92%, exceeding the 80% threshold'
JOIN users admin_user
    ON admin_user.email = 'admin@arimms.local'
JOIN users technician_user
    ON technician_user.email = 'technician@arimms.local'
WHERE s.server_code = 'SRV001'
ON CONFLICT (ticket_code) DO NOTHING;


-- =====================================================
-- 16. KIEM TRA DATABASE
-- =====================================================

-- Kiem tra danh sach bang

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- Kiem tra cac cot cua servers

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'servers'
ORDER BY ordinal_position;


-- Kiem tra cac cot cua history

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'history'
ORDER BY ordinal_position;


-- Kiem tra users

SELECT id, full_name, email, role, is_active
FROM users
ORDER BY id;


-- Kiem tra servers

SELECT
    id,
    server_code,
    name,
    status,
    cpu_threshold,
    ram_threshold,
    network_warning_threshold,
    network_critical_threshold
FROM servers
ORDER BY id;


-- Kiem tra alerts

SELECT *
FROM alerts
ORDER BY id DESC;


-- Kiem tra tickets

SELECT *
FROM tickets
ORDER BY id DESC;
ALTER TABLE servers
  ADD COLUMN IF NOT EXISTS network_warning_threshold BIGINT,
  ADD COLUMN IF NOT EXISTS network_critical_threshold BIGINT;
