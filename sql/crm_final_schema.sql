-- CRM Dashboard Database Schema - FINAL VERSION
-- SQLYog Compatible - MariaDB/MySQL
-- MAX+1 Strategy Implementation

CREATE DATABASE IF NOT EXISTS `crm`;
USE `crm`;

-- Drop existing tables (for fresh installation)
DROP TABLE IF EXISTS M_LeadActivities;
DROP TABLE IF EXISTS M_LeadWebhookQueue;
DROP TABLE IF EXISTS M_UserSessions;
DROP TABLE IF EXISTS M_RateLimits;
DROP TABLE IF EXISTS M_NavigationRoles;
DROP TABLE IF EXISTS M_GroupRoles;
DROP TABLE IF EXISTS M_Users;
DROP TABLE IF EXISTS M_Roles;
DROP TABLE IF EXISTS M_Status;
DROP TABLE IF EXISTS M_ID_SEQUENCE;

-- Global ID sequence management table
CREATE TABLE IF NOT EXISTS M_ID_SEQUENCE (
    table_name VARCHAR(64) PRIMARY KEY,
    current_id INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=INNODB;

-- Initialize sequences (without M_Leads as you requested)
INSERT INTO M_ID_SEQUENCE (table_name, current_id) VALUES
('M_Status', 0),
('M_Roles', 0),
('M_GroupRoles', 0),
('M_NavigationRoles', 0),
('M_Users', 0),
('M_LeadActivities', 0),
('M_UserSessions', 0),
('M_RateLimits', 0),
('M_LeadWebhookQueue', 0)
ON DUPLICATE KEY UPDATE current_id = current_id;

-- Next ID stored procedure with proper parameter naming
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_next_id(IN p_table_name VARCHAR(64), OUT next_id INT)
BEGIN
    START TRANSACTION;
    UPDATE M_ID_SEQUENCE SET current_id = current_id + 1 WHERE table_name = p_table_name;
    SELECT current_id INTO next_id FROM M_ID_SEQUENCE WHERE table_name = p_table_name;
    COMMIT;
END//
DELIMITER ;

-- Status reference table
CREATE TABLE IF NOT EXISTS M_Status (
    id INT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    status_type ENUM('user', 'lead', 'system') NOT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- User Roles table
CREATE TABLE IF NOT EXISTS M_Roles (
    id INT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- Main Users table with exact schema
CREATE TABLE IF NOT EXISTS M_Users (
    id INT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(97) NOT NULL,
    role_id INT NOT NULL,
    group_roles JSON,
    is_active TINYINT(1) DEFAULT 1,
    reference_table_status_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES M_Roles(id),
    FOREIGN KEY (reference_table_status_id) REFERENCES M_Status(id)
) ENGINE=INNODB;

-- Group Roles table (updated naming)
CREATE TABLE IF NOT EXISTS M_GroupRoles (
    id INT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    permissions JSON,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- Navigation Roles table (updated naming)
CREATE TABLE IF NOT EXISTS M_NavigationRoles (
    id INT PRIMARY KEY,
    route_path VARCHAR(255) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    visible_roles JSON,
    is_active TINYINT(1) DEFAULT 1,
    UNIQUE KEY uk_route_path (route_path)
) ENGINE=INNODB;

-- Activity Log (references external T_Leads)
CREATE TABLE IF NOT EXISTS M_LeadActivities (
    id INT PRIMARY KEY,
    lead_id INT NOT NULL, -- External T_Leads reference
    user_id INT NOT NULL,
    activity_type VARCHAR(50),
    activity_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES M_Users(id)
) ENGINE=INNODB;

-- Session management
CREATE TABLE IF NOT EXISTS M_UserSessions (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES M_Users(id)
) ENGINE=INNODB;

-- Rate Limiting
CREATE TABLE IF NOT EXISTS M_RateLimits (
    id INT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    ENDPOINT VARCHAR(255) NOT NULL,
    request_count INT DEFAULT 1,
    reset_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_id_endpoint (identifier, ENDPOINT)
) ENGINE=INNODB;

-- Webhook Queue
CREATE TABLE IF NOT EXISTS M_LeadWebhookQueue (
    id INT PRIMARY KEY,
    webhook_type ENUM('facebook_messenger', 'crewai') NOT NULL,
    payload LONGTEXT NOT NULL,
    processed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=INNODB;

-- Data Initialization
-- Initial Status Values
INSERT INTO M_Status (id, status_name, status_type) VALUES
(1, 'Active', 'user'),
(2, 'Inactive', 'user'),
(3, 'Lead', 'lead'),
(4, 'Qualified', 'lead'),
(5, 'Customer', 'lead'),
(6, 'Lost', 'lead');

-- Initial Roles
INSERT INTO M_Roles (id, role_name, permissions) VALUES
(1, 'Super Admin', '{}'),
(2, 'Admin', '{"users": ["read", "write"], "leads": ["read", "write"]}'),
(3, 'Sales Manager', '{"leads": ["read", "write"], "reports": ["read"]}'),
(4, 'Sales Rep', '{"leads": ["read", "write:own"]}');

-- Navigation routes
INSERT INTO M_NavigationRoles (id, route_path, route_name, visible_roles) VALUES
(1, '/dashboard', 'Dashboard', '[]'),
(2, '/leads', 'Leads', '[]'),
(3, '/leads/new', 'New Lead', '[]'),
(4, '/reports', 'Reports', '[]'),
(5, '/users', 'Users', '[]'),
(6, '/settings', 'Settings', '[]');

-- Utility functions for MAX+1
DELIMITER //
CREATE FUNCTION IF NOT EXISTS get_next_user_id() RETURNS INT READS SQL DATA
BEGIN
    DECLARE next_id INT;
    CALL get_next_id('M_Users', next_id);
    RETURN next_id;
END//

CREATE FUNCTION IF NOT EXISTS get_next_role_id() RETURNS INT READS SQL DATA
BEGIN
    DECLARE next_id INT;
    CALL get_next_id('M_Roles', next_id);
    RETURN next_id;
END//

CREATE FUNCTION IF NOT EXISTS get_next_activity_id() RETURNS INT READS SQL DATA
BEGIN
    DECLARE next_id INT;
    CALL get_next_id('M_LeadActivities', next_id);
    RETURN next_id;
END//
DELIMITER ;

-- Verify installation
SELECT table_name, current_id FROM M_ID_SEQUENCE ORDER BY table_name;

-- Final setup instructions
-- 1. Run this entire file in SQLYog using Host:127.0.0.1 Port:6603 User:root Database:crm
-- 2. Optionally create a super admin user: INSERT INTO M_Users (id, first_name, last_name, email, password_hash, role_id) VALUES (1, 'Admin', 'User', 'admin@crm.com', 'encrypted_password', 1)