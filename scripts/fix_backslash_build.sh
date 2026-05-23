#!/usr/bin/env bash
set -e

cd "$(git rev-parse --show-toplevel)"

echo "Fixing broken backslashes and env variables..."

python3 - <<'PY'
from pathlib import Path

roots = [
    Path("apps/website/app"),
    Path("apps/website/components")
]

for root in roots:
    if not root.exists():
        continue

    for file in root.rglob("*"):
        if file.suffix not in [".ts", ".tsx", ".js", ".jsx"]:
            continue

        text = file.read_text(errors="ignore")
        old = text

        # Restore env variable names
        text = text.replace("process.env.secure cloud_BACKEND_URL", "process.env.EC2_BACKEND_URL")
        text = text.replace("process.env.NEXT_PUBLIC_secure cloud_BACKEND_URL", "process.env.NEXT_PUBLIC_BACKEND_URL")
        text = text.replace("secure cloud_BACKEND_URL", "EC2_BACKEND_URL")
        text = text.replace("NEXT_PUBLIC_secure cloud_BACKEND_URL", "NEXT_PUBLIC_BACKEND_URL")

        # Remove accidental backslash after semicolon
        text = text.replace(";\n", ";\n")
        text = text.replace(";\\\n", ";\n")
        text = text.replace(";\\r\n", ";\r\n")
        text = text.replace("';\\", "';")
        text = text.replace('";\\', '";')

        if text != old:
            file.write_text(text)
            print("fixed", file)

print("cleanup completed")
PY

echo "Checking bad patterns..."

if grep -R "process.env.secure cloud_BACKEND_URL\|secure cloud_BACKEND_URL" apps/website/app apps/website/components --include="*.ts" --include="*.tsx"; then
  echo "Bad env text still exists."
  exit 1
fi

if grep -R ";\\\\" apps/website/app apps/website/components --include="*.ts" --include="*.tsx"; then
  echo "Bad backslash still exists."
  exit 1
fi

echo "Running website build..."

cd apps/website
npm run build

cd ../..

git add .
git commit -m "Fix build syntax backslash and env names" || true
git push origin main

echo "Done. Vercel will redeploy."
