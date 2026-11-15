-- Expose the recorded down-payment amount in the authenticated customer portal projection.
-- DP is informational only; this does not create a payment, cash movement, or stock change.

DO $migration$
DECLARE
  v_definition text;
  v_marker text := $$'quote_total', v_booking.quote_total,$$;
  v_insert text := $$'quote_total', v_booking.quote_total,
    'dp_amount', v_booking.dp_amount,$$;
  v_patched text;
BEGIN
  SELECT pg_get_functiondef(
    'app_private.get_akasha_smart_booking_portal(text)'::regprocedure
  )
  INTO v_definition;

  IF position($$'dp_amount', v_booking.dp_amount$$ IN v_definition) > 0 THEN
    RETURN;
  END IF;

  v_patched := replace(v_definition, v_marker, v_insert);

  IF v_patched = v_definition THEN
    RAISE EXCEPTION 'EXPECTED_PATCH_MISSING: portal quote_total projection marker';
  END IF;

  EXECUTE v_patched;
END;
$migration$;

COMMENT ON FUNCTION app_private.get_akasha_smart_booking_portal(text) IS
  'Returns sanitized customer portal data, including the informational DP amount, without exposing internal financial activity.';
