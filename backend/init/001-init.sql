--  StudyWell Database Initialization Script


-- Create an application role (user) named 'studywell' with login ability
-- and a password. This keeps it separate from the default superuser.
CREATE ROLE studywell WITH LOGIN PASSWORD 'devpassword';

-- Allow the 'studywell' role to create databases.
-- Prisma needs this privilege temporarily to create a "shadow" database
-- when running `prisma migrate dev`.
ALTER ROLE studywell CREATEDB;


-- Create the main application database owned by the 'studywell' role.
-- This database will store all StudyWell tables and data.
CREATE DATABASE studywell OWNER studywell;


-- Switch the connection context into the newly created database.
\connect studywell


-- Transfer ownership of the default 'public' schema to 'studywell'.
-- By default, the 'public' schema belongs to 'postgres'.
ALTER SCHEMA public OWNER TO studywell;

-- Give the 'studywell' role permission to use and create objects
-- (tables, views, etc.) within the 'public' schema.
GRANT USAGE, CREATE ON SCHEMA public TO studywell;


-- Define default privileges for future tables.
-- Whenever new tables are created in this schema, automatically
-- grant the 'studywell' role standard DML rights.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO studywell;

-- Define default privileges for future sequences (auto-increment IDs).
-- This ensures the app user can read/update sequences when inserting rows.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO studywell;


-- Set a default search path for the 'studywell' role.
-- This makes sure unqualified table names (e.g. "User") refer
-- to the 'public' schema without needing to prefix 'public.'.
ALTER ROLE studywell SET search_path = public;

