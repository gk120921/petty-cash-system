# Petty Cash Update Runbook

This runbook keeps the India production data in place while allowing code changes to be developed in Taiwan and deployed later.

## Core rule

- Treat `零用金申請系統/backend/petty_cash.db` as production data.
- Update code separately from data.
- Always back up the India database before any deployment.

## Files that must stay on the India machine

- `零用金申請系統/backend/petty_cash.db`
- `零用金申請系統/backend/uploads/`
- `零用金申請系統/backend/config.json`
- `零用金申請系統/backend/google-creds.json` if OCR or Google integrations are used

## Taiwan workflow

1. Copy the latest India `petty_cash.db` to Taiwan before making changes.
2. Place that file at `零用金申請系統/backend/petty_cash.db`.
3. Run and test the system locally with the copied data.
4. Commit and upload only code changes.
5. Do not replace the India database with a Taiwan test database.

## Git note

- The new `.gitignore` rules prevent future accidental adds of runtime data.
- If `petty_cash.db` or `uploads/` were already tracked in Git history, `.gitignore` alone is not enough.
- On a machine with Git installed, remove those files from tracking once, then commit that cleanup:
  - `git rm --cached 零用金申請系統/backend/petty_cash.db`
  - `git rm -r --cached 零用金申請系統/backend/uploads`

## India deployment workflow

1. Stop the petty cash system.
2. Back up these items from the India machine:
   - `零用金申請系統/backend/petty_cash.db`
   - `零用金申請系統/backend/uploads/`
   - `零用金申請系統/backend/config.json`
3. Download the updated project code.
4. Replace application code only.
5. Restore the backed-up files if the update package contains placeholders or older copies.
6. Start the system and verify login, dashboard, and one recent expense record.

## Recommended deployment method

Copy these folders from the updated project into the India machine:

- `零用金申請系統/frontend/`
- `零用金申請系統/backend/`

Then immediately restore:

- `零用金申請系統/backend/petty_cash.db`
- `零用金申請系統/backend/uploads/`
- `零用金申請系統/backend/config.json`

This is the safest manual deployment flow when Git is not installed on the production machine.

## If database schema changes are introduced

- Do not ship a replacement `petty_cash.db`.
- Add a migration script that changes the existing database in place.
- Run the migration against a backup copy first.

## Pre-deployment checklist

- Taiwan changes tested with a copy of India data
- India database backed up
- India uploads backed up
- Config files backed up
- Updated code package reviewed to confirm no production data is included

## Recovery plan

If the update fails:

1. Stop the system.
2. Restore the previous code copy.
3. Restore the latest backup of `petty_cash.db`, `uploads`, and `config.json`.
4. Start the system again.
