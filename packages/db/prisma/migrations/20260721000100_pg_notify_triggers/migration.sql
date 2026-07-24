-- pg_notify triggers feeding the SSE (LISTEN/NOTIFY) realtime layer.
--
-- Source of truth: docs/superpowers/specs/2026-07-21-nextjs-migration-design.md
-- ("Real-time design (SSE + LISTEN/NOTIFY)"). On every write to Session /
-- Estimation / Vote, we emit a SMALL event descriptor on the per-session
-- channel `session_<sessionId>` — NOT the full row. A per-process `pg` client
-- LISTENs on these channels and fans out to connected SSE responses (issue #12).
--
-- Payload shape (text-encoded JSON):
--   { "type": "session"|"estimation"|"vote",
--     "op":   "insert"|"update"|"delete",
--     "sessionId": "<uuid>",
--     "estimationId": "<uuid>"|null }
--
-- sessionId resolution per table:
--   Session    -> row id
--   Estimation -> row "sessionId"
--   Vote       -> looked up via its Estimation's "sessionId"

-- One shared trigger function, dispatched by TG_TABLE_NAME.
CREATE OR REPLACE FUNCTION "notify_session_change"() RETURNS trigger AS $$
DECLARE
  rec            RECORD;
  v_type         TEXT;
  v_op           TEXT := lower(TG_OP);
  v_session_id   TEXT;
  v_estimation_id TEXT;
BEGIN
  -- DELETE exposes the removed row via OLD; INSERT/UPDATE via NEW.
  IF (TG_OP = 'DELETE') THEN
    rec := OLD;
  ELSE
    rec := NEW;
  END IF;

  IF (TG_TABLE_NAME = 'Session') THEN
    v_type := 'session';
    v_session_id := rec."id";
    v_estimation_id := NULL;
  ELSIF (TG_TABLE_NAME = 'Estimation') THEN
    v_type := 'estimation';
    v_session_id := rec."sessionId";
    v_estimation_id := rec."id";
  ELSIF (TG_TABLE_NAME = 'Vote') THEN
    v_type := 'vote';
    v_estimation_id := rec."estimationId";
    -- Resolve the owning session through the estimation. During an Estimation
    -- cascade delete the parent may already be gone; skip notifying in that case
    -- (the estimation-level trigger already announced the change).
    SELECT e."sessionId" INTO v_session_id
    FROM "Estimation" e
    WHERE e."id" = rec."estimationId";
  ELSE
    -- Unknown table: nothing to do.
    RETURN NULL;
  END IF;

  IF (v_session_id IS NOT NULL) THEN
    PERFORM pg_notify(
      'session_' || v_session_id,
      json_build_object(
        'type', v_type,
        'op', v_op,
        'sessionId', v_session_id,
        'estimationId', v_estimation_id
      )::text
    );
  END IF;

  -- AFTER trigger: return value is ignored.
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- One AFTER-row trigger per table, all sharing the function above.
CREATE TRIGGER "session_notify"
AFTER INSERT OR UPDATE OR DELETE ON "Session"
FOR EACH ROW EXECUTE FUNCTION "notify_session_change"();

CREATE TRIGGER "estimation_notify"
AFTER INSERT OR UPDATE OR DELETE ON "Estimation"
FOR EACH ROW EXECUTE FUNCTION "notify_session_change"();

CREATE TRIGGER "vote_notify"
AFTER INSERT OR UPDATE OR DELETE ON "Vote"
FOR EACH ROW EXECUTE FUNCTION "notify_session_change"();
