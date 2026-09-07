/*
# Demo Admin Access

1. Purpose
   - Allow any authenticated user to self-assign admin role for demo purposes.
   - Adds INSERT and UPDATE policies on admin_users so the frontend can upsert.
2. Security Changes
   - admin_users: add INSERT policy (authenticated users can insert their own row)
   - admin_users: add UPDATE policy (authenticated users can update their own row)
3. Notes
   - This is intentionally permissive for demo/testing purposes.
   - In production, admin role assignment should be restricted to existing admins.
*/

DROP POLICY IF EXISTS "insert_own_admin_status" ON admin_users;
CREATE POLICY "insert_own_admin_status" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_admin_status" ON admin_users;
CREATE POLICY "update_own_admin_status" ON admin_users FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
