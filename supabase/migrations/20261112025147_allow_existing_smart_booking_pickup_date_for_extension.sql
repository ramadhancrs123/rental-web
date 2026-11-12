-- Permit a customer to retain the booking's original pickup date when extending
-- the return date, even if that original pickup date is now in the past.
-- A different pickup date in the past remains invalid; the request still requires
-- admin review and does not mutate the booking until it is approved.
DO $migration$
DECLARE
  v_signature regprocedure :=
    'app_private.submit_akasha_smart_booking_change(text,text,jsonb,text,integer,text)'::regprocedure;
  v_definition text;
  v_patched text;
  v_old text;
  v_new text;
BEGIN
  v_definition := pg_get_functiondef(v_signature);

  v_old := $old$
    IF v_pickup_date < (now() AT TIME ZONE v_booking.business_timezone)::date
       OR v_return_date < v_pickup_date THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: periode rental harus valid dan tidak berada di masa lalu'
        USING ERRCODE = '22023';
    END IF;
$old$;

  v_new := $new$
    IF (
         v_pickup_date < (now() AT TIME ZONE v_booking.business_timezone)::date
         AND v_pickup_date IS DISTINCT FROM v_booking.requested_pickup_date
       )
       OR v_return_date < v_pickup_date THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: periode rental harus valid dan tidak berada di masa lalu'
        USING ERRCODE = '22023';
    END IF;
$new$;

  v_patched := replace(v_definition, v_old, v_new);

  IF v_patched = v_definition
     AND position('v_pickup_date IS DISTINCT FROM v_booking.requested_pickup_date' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'EXPECTED_PATCH_MISSING: preserve only the original pickup date for schedule extensions';
  END IF;

  IF v_patched <> v_definition THEN
    EXECUTE v_patched;
  END IF;
END;
$migration$;
