#!/usr/bin/env bash
set -e

cd "$(git rev-parse --show-toplevel)"

echo "Fixing broken env variable names..."

python3 - <<'PY'
from pathlib import Path

roots = [
    Path("apps/website/app"),
    Path("apps/website/components")
]

replacements = {
    "process.env.secure cloud_BACKEND_URL": "process.env.EC2_BACKEND_URL",
    "process.env.NEXT_PUBLIC_secure cloud_BACKEND_URL": "process.env.NEXT_PUBLIC_BACKEND_URL",
    "secure cloud_BACKEND_URL": "EC2_BACKEND_URL",
    "NEXT_PUBLIC_secure cloud_BACKEND_URL": "NEXT_PUBLIC_BACKEND_URL",
}

for root in roots:
    if not root.exists():
        continue

    for file in root.rglob("*"):
        if file.suffix not in [".ts", ".tsx", ".js", ".jsx"]:
            continue

        text = file.read_text(errors="ignore")
        old = text

        for bad, good in replacements.items():
            text = text.replace(bad, good)

        if text != old:
            file.write_text(text)
            print("fixed", file)

print("env variable fix completed")
PY

echo "Checking for remaining bad text..."

if grep -R "process.env.secure cloud_BACKEND_URL\|secure cloud_BACKEND_URL" apps/website/app apps/website/components --include="*.ts" --include="*.tsx"; then
  echo "Bad env text still exists. Fix manually."
  exit 1
fi

echo "Running website build..."

cd apps/website
npm run build

cd ../..

git add .
git commit -m "Fix build env variable names" || true
git push origin main

echo "Done. Vercel will redeploy."
