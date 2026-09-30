# Staged Supabase Auth rollout

The database UUID links are already aligned. This is an account activation and exposed-password cleanup, not another schema migration.

1. Run `node supabase/prepare-auth-rollout.mjs --write-manifest` from the repository root. It reads live data and creates an ignored `scratch/auth-rollout.csv`. It does not send email or change passwords. Do not commit or share the manifest.
2. Verify Supabase Auth email delivery, the production Site URL, and the redirect allowlist for the deployed login page. The in-app password recovery flow must be tested with a non-staff pilot account before sending staff mail.
3. Review each `review-email` or `review-link` row manually. Do not invite or reset these until its public user, employee, and Auth identities agree.
4. For a small consenting pilot from `invite`, send Supabase Auth invitations using the dashboard and test acceptance, login, password change, and workplace assignment. Confirm that the `auth.users` trigger linked both public tables. Then proceed in small batches.
5. For `reset`, send Supabase Auth recovery emails to the already linked accounts. Do not overwrite passwords in bulk or email temporary passwords. Verify each recovery before expanding.
6. Re-run the read-only manifest after each batch. Preserve a rollback/contact route for staff whose mail is delayed. Once all accounts are linked and verified, retire legacy default password hashes and disable the login auto-provision fallback in a separately tested deployment.

The legacy default password was embedded in historical seed data and still matches many live accounts. Invitations make new Auth accounts require email ownership, but they do not remove the exposed legacy hashes. Until the rollout is complete, restrict access to the application and monitor authentication activity. Never paste service-role keys or hashes into tickets or chat; rotate previously exposed service-role credentials in Supabase and update the server secret store.
