-- Insert admin user with bcrypt hash for password "112233" (12 rounds)
-- Hash generated using bcryptjs: bcrypt.hashSync("112233", 12)
INSERT INTO admin_users (email, password_hash)
VALUES (
  '7ls@doujin.com',
  '$2a$12$LJ3m4ys3LzHNl5cXvK7yTeHpXkNxNKqFvZGxhOC.ZR3GqaKW5Weqy'
)
ON CONFLICT (email) DO NOTHING;
