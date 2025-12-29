-- CRM Dashboard Database Schema - STATELESS SECURE VERSION
-- Updated: 2025-12-26

CREATE DATABASE IF NOT EXISTS `crm`;
USE `crm`;

-- Drop tables in order of dependencies
-- Drop tables in order of dependencies (including new ones)
DROP TABLE IF EXISTS M_LeadActivities;
DROP TABLE IF EXISTS M_LeadWebhookQueue;
DROP TABLE IF EXISTS M_RateLimits;
DROP TABLE IF EXISTS M_NavigationRoles;
DROP TABLE IF EXISTS M_GroupRoles;
DROP TABLE IF EXISTS T_Leads;
DROP TABLE IF EXISTS M_Users;
DROP TABLE IF EXISTS T_Companies;
DROP TABLE IF EXISTS M_Roles;
DROP TABLE IF EXISTS M_Status;

-- 1. Companies table (for multi-tenancy)
CREATE TABLE T_Companies (
    id INT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    CompanyName VARCHAR(255) NOT NULL,
    CompanyInfo TEXT,
    CompanyProfile TEXT,
    Industry VARCHAR(100),
    Email VARCHAR(255),
    Phone VARCHAR(50),
    WebsiteURL VARCHAR(255),
    SocialURL VARCHAR(255),
    LogoURL VARCHAR(500),
    Address TEXT,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=INNODB;

-- 2. Status reference table
CREATE TABLE M_Status (
    id INT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    status_type ENUM('user', 'lead', 'system') NOT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- 3. User Roles table
CREATE TABLE M_Roles (
    id INT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSON,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- 4. Main Users table (OWASP COMPLIANT)
CREATE TABLE M_Users (
    id INT PRIMARY KEY,                       -- Internal ID (Sequential)
    token VARCHAR(64) NOT NULL UNIQUE,        -- Public Token (Random 32-char hex)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,      -- Increased length for modern hashes
    role_id INT NOT NULL,
    company_id INT NOT NULL,                  -- Multi-tenancy foreign key
    group_roles JSON,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES M_Roles(id),
    FOREIGN KEY (company_id) REFERENCES T_Companies(id) ON DELETE CASCADE
) ENGINE=INNODB;

-- 4. Group Roles
CREATE TABLE M_GroupRoles (
    id INT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    permissions JSON,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=INNODB;

-- 5. Navigation Roles
CREATE TABLE M_NavigationRoles (
    id INT PRIMARY KEY,
    route_path VARCHAR(255) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'LayoutDashboard',
    visible_roles JSON, -- e.g., [1, 2]
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    UNIQUE KEY uk_route_path (route_path)
) ENGINE=INNODB;

-- 6. Leads table
CREATE TABLE T_Leads (
    id INT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    LeadName VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Phone VARCHAR(50),
    MessageContent TEXT,
    DateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    StatusID INT,
    company_id INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (StatusID) REFERENCES M_Status(id),
    FOREIGN KEY (company_id) REFERENCES T_Companies(id) ON DELETE CASCADE
) ENGINE=INNODB;

-- 8. Activity Log
CREATE TABLE M_LeadActivities (
    id INT PRIMARY KEY,
    lead_id INT NOT NULL, 
    user_id INT NOT NULL,
    activity_type VARCHAR(50),
    activity_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES T_Leads(id),
    FOREIGN KEY (user_id) REFERENCES M_Users(id)
) ENGINE=INNODB;

-- 9. Webhook Queue
CREATE TABLE M_LeadWebhookQueue (
    id INT PRIMARY KEY,
    webhook_type ENUM('facebook_messenger', 'crewai') NOT NULL,
    payload LONGTEXT NOT NULL,
    processed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=INNODB;

-- DATA INITIALIZATION
INSERT INTO M_Status (id, status_name, status_type) VALUES
(1, 'Active', 'user'), (2, 'Inactive', 'user'), (3, 'Lead', 'lead'),
(4, 'Qualified', 'lead'), (5, 'Customer', 'lead'), (6, 'Lost', 'lead');

INSERT INTO M_Roles (id, role_name) VALUES
(1, 'Super Admin'), (2, 'Admin'), (3, 'Manager'), (4, 'Staff');

-- Create default company for Super Admin
INSERT INTO T_Companies (id, token, CompanyName, CompanyInfo, Industry, Email)
VALUES (1, 'comp_default_company_123', 'Default Company', 'Default company for initial setup', 'Technology', 'admin@default.com');

INSERT INTO M_NavigationRoles (id, route_path, route_name, icon_name, sort_order) VALUES
(1, '/dashboard', 'Dashboard', 'LayoutDashboard', 1),
(2, '/leads', 'Leads', 'Users', 2),
(3, '/users', 'User Management', 'ShieldCheck', 3),
(4, '/settings', 'Settings', 'Settings', 4);

-- CREATE INITIAL SUPER ADMIN
-- Password is 'password123' hashed (Example only, use your registration to create real ones)
INSERT INTO M_Users (id, token, first_name, last_name, email, password_hash, role_id, company_id)
VALUES (1, '8f7d6e5c4b3a2f1e0d9c8b7a6f5e4d3c', 'Admin', 'User', 'admin@crm.com', '$2b$10$YourHashedPasswordHere', 1, 1);