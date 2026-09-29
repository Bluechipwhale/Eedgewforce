-- =============================================================================
-- EDGEWFORCE - MIGRATION 013: REMOVE REQUESTED DEFAULT WORK LOCATIONS
-- Removes the two retired sample/default workplace rows from the app dataset.
-- =============================================================================

BEGIN;

WITH retired_locations AS (
  SELECT id
  FROM public.work_locations
  WHERE
    lower(trim(name)) IN (
      'lagos victoria island office',
      'ikeja central distribution depot'
    )
    OR lower(trim(address)) IN (
      '14b idowu martins st, victoria island',
      'plot 12 commercial ave, ikeja industrial'
    )
)
DELETE FROM public.location_assignment_history
WHERE previous_location_id IN (SELECT id FROM retired_locations)
   OR new_location_id IN (SELECT id FROM retired_locations);

WITH retired_locations AS (
  SELECT id
  FROM public.work_locations
  WHERE
    lower(trim(name)) IN (
      'lagos victoria island office',
      'ikeja central distribution depot'
    )
    OR lower(trim(address)) IN (
      '14b idowu martins st, victoria island',
      'plot 12 commercial ave, ikeja industrial'
    )
)
DELETE FROM public.employee_location_assignments
WHERE location_id IN (SELECT id FROM retired_locations);

DELETE FROM public.work_locations
WHERE
  lower(trim(name)) IN (
    'lagos victoria island office',
    'ikeja central distribution depot'
  )
  OR lower(trim(address)) IN (
    '14b idowu martins st, victoria island',
    'plot 12 commercial ave, ikeja industrial'
  );

COMMIT;
