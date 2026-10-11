#!/usr/bin/env bash
# Deploy frontend/ to Amplify Hosting without Git (manual deployment).
# Usage: scripts/deploy_frontend.sh <amplify-app-id> [branch]
set -euo pipefail
APP_ID="$1"; BRANCH="${2:-main}"
AWS="${AWS:-aws}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="$ROOT/site.zip"   # ignored by .gitignore

# Zip the *contents* of frontend/ (zipping the folder itself gives Access Denied).
(cd "$ROOT" && python -c "
import zipfile, pathlib
src = pathlib.Path('frontend')
with zipfile.ZipFile('site.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(src.rglob('*')):
        if p.is_file():
            z.write(p, p.relative_to(src).as_posix())
")

aws_text() { "$AWS" "$@" --output text | tr -d '\r'; }

read -r JOB_ID UPLOAD_URL < <(aws_text amplify create-deployment --app-id "$APP_ID" \
  --branch-name "$BRANCH" --query '[jobId, zipUploadUrl]')
echo "Job $JOB_ID: uploading $(wc -c < "$ZIP") bytes"
curl -sS --fail-with-body -X PUT -H "Content-Type: application/zip" -T "$ZIP" "$UPLOAD_URL"
aws_text amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" \
  --query job.summary.status

for _ in $(seq 1 30); do
  STATUS=$(aws_text amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" \
    --query job.summary.status)
  case "$STATUS" in
    SUCCEED) echo "Deployed: https://$BRANCH.$APP_ID.amplifyapp.com"; exit 0 ;;
    FAILED|CANCELLED) echo "Deployment $STATUS (job $JOB_ID)"; exit 1 ;;
  esac
  sleep 4
done
echo "Still running (job $JOB_ID); check the Amplify console."
