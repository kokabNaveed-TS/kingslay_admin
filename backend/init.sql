CREATE DATABASE IF NOT EXISTS kingsleys_db;
USE kingsleys_db;

CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(100) NOT NULL UNIQUE,
  phone          VARCHAR(20)  NOT NULL DEFAULT '',
  password       VARCHAR(255) NOT NULL,
  -- role is NULL until admin assigns it on activation
  role           ENUM('admin','operation_manager','store_manager','staff') NULL DEFAULT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT FALSE,
  -- JSON array of tool IDs; only relevant for staff
  assigned_tools JSON DEFAULT (JSON_ARRAY()),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- Seed: Super Admin  (password = Admin1234)
INSERT IGNORE INTO users (username,email,phone,password,role,is_active) VALUES
('superadmin','kokabnaveed2002@gmail.com','0400000000','$2a$10$Za5UtKe0UFfAjZMjFWmUFOl.oJTvzMbKClqIkfQmDWGW2lPPQD1SG','admin',TRUE);

-- Seed: Operation Manager  (password = Admin1234)
INSERT IGNORE INTO users (username,email,phone,password,role,is_active) VALUES
('opmanager','kokabnaveed9702@gmail.com','0400000001','$2a$10$Za5UtKe0UFfAjZMjFWmUFOl.oJTvzMbKClqIkfQmDWGW2lPPQD1SG','operation_manager',TRUE);

-- Seed: Store Manager  (password = Admin1234)
INSERT IGNORE INTO users (username,email,phone,password,role,is_active) VALUES
('storemanager','kokabnaveed9703@gmail.com','0400000002','$2a$10$Za5UtKe0UFfAjZMjFWmUFOl.oJTvzMbKClqIkfQmDWGW2lPPQD1SG','store_manager',TRUE);
 