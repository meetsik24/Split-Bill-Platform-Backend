-- Split-Bill Platform Database Initialization Script
-- This script creates the initial database structure

-- Create database if it doesn't exist
-- Note: This needs to be run as a superuser or the database should be created manually
-- CREATE DATABASE splitbill;

-- Connect to the splitbill database
\c splitbill;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create bill_members table
CREATE TABLE IF NOT EXISTS bill_members (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    member_phone VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_bills_creator_id ON bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_members_bill_id ON bill_members(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_members_member_phone ON bill_members(member_phone);
CREATE INDEX IF NOT EXISTS idx_bill_members_status ON bill_members(status);

-- Create composite indexes
CREATE INDEX IF NOT EXISTS idx_bill_members_bill_status ON bill_members(bill_id, status);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user information for the split-bill platform';
COMMENT ON TABLE bills IS 'Stores bill information created by users';
COMMENT ON TABLE bill_members IS 'Stores bill member information and payment status';

COMMENT ON COLUMN users.phone IS 'User phone number in international format';
COMMENT ON COLUMN bills.amount IS 'Total bill amount in TZS';
COMMENT ON COLUMN bill_members.amount IS 'Amount owed by this member in TZS';
COMMENT ON COLUMN bill_members.status IS 'Payment status: pending or paid';

-- Insert sample data for testing (optional)
-- INSERT INTO users (name, phone) VALUES 
--     ('John Doe', '+255712345678'),
--     ('Jane Smith', '+255698765432');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO splitbill_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO splitbill_user;

-- Verify tables were created
\dt

-- Show table structure
\d users
\d bills
\d bill_members
