#!/bin/bash
# Safe database push script - backs up critical prediction data before schema changes
echo "============================================"
echo "  SAFE DB PUSH - Prediction Data Protected"
echo "============================================"
echo ""

# Check if prediction tables have data
PRED_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM prediction_events" 2>/dev/null || echo "0")
STRIKE_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM strikeagent_predictions" 2>/dev/null || echo "0")
BACKUP_PRED=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM backup_vault.prediction_events" 2>/dev/null || echo "0")
BACKUP_STRIKE=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM backup_vault.strikeagent_predictions" 2>/dev/null || echo "0")

echo "[Pre-Push Status]"
echo "  Main prediction_events: $PRED_COUNT rows"
echo "  Main strikeagent_predictions: $STRIKE_COUNT rows"
echo "  Backup prediction_events: $BACKUP_PRED rows"
echo "  Backup strikeagent_predictions: $BACKUP_STRIKE rows"
echo ""

# Force sync to backup before push
echo "[Syncing to backup vault before push...]"
psql "$DATABASE_URL" -c "
INSERT INTO backup_vault.prediction_events 
SELECT src.*, NOW() as synced_at FROM prediction_events src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.prediction_events bv WHERE bv.id = src.id);

INSERT INTO backup_vault.prediction_accuracy_stats 
SELECT src.*, NOW() as synced_at FROM prediction_accuracy_stats src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.prediction_accuracy_stats bv WHERE bv.id = src.id);

INSERT INTO backup_vault.strikeagent_predictions 
SELECT src.*, NOW() as synced_at FROM strikeagent_predictions src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.strikeagent_predictions bv WHERE bv.id = src.id);

INSERT INTO backup_vault.prediction_outcomes 
SELECT src.*, NOW() as synced_at FROM prediction_outcomes src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.prediction_outcomes bv WHERE bv.id = src.id);

INSERT INTO backup_vault.strikeagent_outcomes 
SELECT src.*, NOW() as synced_at FROM strikeagent_outcomes src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.strikeagent_outcomes bv WHERE bv.id = src.id);

INSERT INTO backup_vault.strike_agent_signals 
SELECT src.*, NOW() as synced_at FROM strike_agent_signals src
WHERE NOT EXISTS (SELECT 1 FROM backup_vault.strike_agent_signals bv WHERE bv.id = src.id);
" 2>/dev/null

echo "[Backup sync complete]"
echo ""

# Run the actual push
echo "[Running drizzle-kit push...]"
npx drizzle-kit push
PUSH_EXIT=$?

if [ $PUSH_EXIT -ne 0 ]; then
  echo ""
  echo "[WARNING] drizzle-kit push exited with code $PUSH_EXIT"
fi

# Check if data was lost
POST_PRED=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM prediction_events" 2>/dev/null || echo "0")
POST_STRIKE=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM strikeagent_predictions" 2>/dev/null || echo "0")

echo ""
echo "[Post-Push Status]"
echo "  Main prediction_events: $POST_PRED rows (was $PRED_COUNT)"
echo "  Main strikeagent_predictions: $POST_STRIKE rows (was $STRIKE_COUNT)"

# Auto-restore if data was lost
if [ "$POST_PRED" -lt "$PRED_COUNT" ] 2>/dev/null; then
  echo ""
  echo "[DATA LOSS DETECTED] Restoring prediction_events from backup..."
  COLS=$(psql "$DATABASE_URL" -t -A -c "SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_schema='public' AND table_name='prediction_events'")
  psql "$DATABASE_URL" -c "
    INSERT INTO prediction_events ($COLS)
    SELECT $COLS FROM backup_vault.prediction_events bv
    WHERE NOT EXISTS (SELECT 1 FROM prediction_events m WHERE m.id = bv.id);
  " 2>/dev/null
  RESTORED=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM prediction_events" 2>/dev/null)
  echo "  Restored to: $RESTORED rows"
fi

if [ "$POST_STRIKE" -lt "$STRIKE_COUNT" ] 2>/dev/null; then
  echo ""
  echo "[DATA LOSS DETECTED] Restoring strikeagent_predictions from backup..."
  COLS=$(psql "$DATABASE_URL" -t -A -c "SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_schema='public' AND table_name='strikeagent_predictions'")
  psql "$DATABASE_URL" -c "
    INSERT INTO strikeagent_predictions ($COLS)
    SELECT $COLS FROM backup_vault.strikeagent_predictions bv
    WHERE NOT EXISTS (SELECT 1 FROM strikeagent_predictions m WHERE m.id = bv.id);
  " 2>/dev/null
  RESTORED=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM strikeagent_predictions" 2>/dev/null)
  echo "  Restored to: $RESTORED rows"
fi

echo ""
echo "[Safe DB Push Complete]"
