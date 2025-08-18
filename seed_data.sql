-- Create some basic test data

-- Insert a test admin user (password is hashed version of "admin123")
INSERT INTO User (email, password, role, tokenVersion) VALUES 
('admin@test.com', '$2b$10$rOJ1/8U4vvgJE4H6Kj6qg.8dK7V5N2yGM9Qf3L1zX8Kf7mP2wR5vN', 'ADMIN', 1);

-- Insert a test team
INSERT INTO Team (id, name) VALUES 
('test-team-1', 'Development Team');

-- Insert the admin user into the team
INSERT INTO UserTeam (userId, teamId) VALUES 
(1, 'test-team-1');

-- Insert some test rates
INSERT INTO Rate (name, teamId, rate) VALUES 
('Senior Developer', 'test-team-1', 800.00),
('Junior Developer', 'test-team-1', 500.00),
('Designer', 'test-team-1', 600.00);

-- Insert a test project
INSERT INTO Project (id, name, teamId, createdAt, updatedAt, state) VALUES 
('test-project-1', 'Website Redesign', 'test-team-1', '2025-01-01', '2025-01-01', 'active');

