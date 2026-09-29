-- ==============================================================================
-- EDGEWFORCE - SUPABASE POSTGRESQL RLS & ROW LEVEL SECURITY (002_security_rls.sql)
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on users" ON users;
CREATE POLICY "Service role full access on users" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on employees" ON employees;
CREATE POLICY "Service role full access on employees" ON employees FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
CREATE POLICY "Service role full access on orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on collections" ON collections;
CREATE POLICY "Service role full access on collections" ON collections FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on visits" ON visits;
CREATE POLICY "Service role full access on visits" ON visits FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on attendance" ON attendance;
CREATE POLICY "Service role full access on attendance" ON attendance FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on leave_requests" ON leave_requests;
CREATE POLICY "Service role full access on leave_requests" ON leave_requests FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on payslips" ON payslips;
CREATE POLICY "Service role full access on payslips" ON payslips FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on tasks" ON tasks;
CREATE POLICY "Service role full access on tasks" ON tasks FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on sos" ON sos;
CREATE POLICY "Service role full access on sos" ON sos FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on idle_alerts" ON idle_alerts;
CREATE POLICY "Service role full access on idle_alerts" ON idle_alerts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role full access on notifications" ON notifications;
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
