
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('ADMIN', 'MANAGER', 'BENEFICIARY')) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table budgets
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table requests
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Insertion d'un admin par défaut (mot de passe: admin123)
INSERT INTO users (email, password, role, first_name, last_name) 
VALUES ('admin@cse.com', '$2b$10$YourHashedPasswordHere', 'ADMIN', 'Admin', 'System') 
ON CONFLICT (email) DO NOTHING;

INSERT INTO budgets (year, total_amount, remaining_amount) 
VALUES (2024, 50000, 50000) 
ON CONFLICT (year) DO NOTHING;

INSERT INTO budgets (year, total_amount, remaining_amount) 
VALUES (
    EXTRACT(YEAR FROM CURRENT_DATE) + 1, 
    55000.00, 
    55000.00
) ON CONFLICT (year) DO NOTHING;

INSERT INTO users (email, password, role, first_name, last_name) 
VALUES (
    'manager@cse.com', 
    '$2b$10$X7U5V7kq9gU8Q7W5V3kq9uY7X5V3kq9uY7X5V3kq9u', 
    'MANAGER', 
    'Manager', 
    'Team'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, first_name, last_name) 
VALUES (
    'user@cse.com', 
    '$2b$10$X7U5V7kq9gU8Q7W5V3kq9uY7X5V3kq9uY7X5V3kq9u', 
    'BENEFICIARY', 
    'Simple', 
    'User'
) ON CONFLICT (email) DO NOTHING;