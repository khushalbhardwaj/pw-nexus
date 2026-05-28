-- PW Nexus Database Schema
-- To be imported into phpMyAdmin (XAMPP)

CREATE DATABASE IF NOT EXISTS pw_nexus_db;
USE pw_nexus_db;

-- Table for Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    education VARCHAR(200),
    batch VARCHAR(100),
    location VARCHAR(100),
    remote VARCHAR(50),
    birthday VARCHAR(50),
    age VARCHAR(50),
    project VARCHAR(100),
    project_role VARCHAR(100),
    image_url VARCHAR(255)
);

-- Table for Global Settings (e.g. Quote)
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NOT NULL
);

-- Insert Default Data
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('global_quote', '"We just love building cool stuff. Our goal is to make a platform that we would actually want to use ourselves."')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

INSERT INTO team_members (id, name, role, description, education, batch, location, remote, birthday, age, project, project_role, image_url) VALUES 
('t1', 'Manish', 'FOUNDER & ARCHITECT', 'I started PW Nexus to make learning both accessible and visually amazing. I handle the UI/UX design and the core architecture basically making sure everything feels premium and works without a hitch.', 'Class 12th (Commerce)', 'Batch: 2026-2027', 'Delhi, India', 'Remote Available', '19 Nov 2008', 'Age: 17 Years', 'PW NEXUS', 'Creator & Architect', 'https://i.ibb.co/nsWgY8tV/manish.jpg'),
('t2', 'Prince', 'LEAD DEVELOPER', 'I handle the core logic and backend systems. I love writing clean, efficient code and fixing complex bugs to ensure the platform runs fast and smooth for everyone.', 'Class 10th', 'Batch: 2026-2027', 'Bangalore, KA', 'Remote Available', '15 Nov 2009', 'Age: 16 Years', 'PW NEXUS', 'Lead Developer', 'https://i.ibb.co/v6FKvTf4/prince.jpg')
ON DUPLICATE KEY UPDATE 
    name=VALUES(name), role=VALUES(role), description=VALUES(description), education=VALUES(education), 
    batch=VALUES(batch), location=VALUES(location), remote=VALUES(remote), birthday=VALUES(birthday), 
    age=VALUES(age), project=VALUES(project), project_role=VALUES(project_role), image_url=VALUES(image_url);
