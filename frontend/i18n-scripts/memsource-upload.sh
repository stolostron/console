#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

while getopts v:s: flag
do
  case "${flag}" in
      v) VERSION=${OPTARG};;
      s) SPRINT=${OPTARG};;
      *) echo "usage: $0 [-v] [-s]" >&2
      exit 1;;
  esac
done

echo "Checking if git workspace is clean"
GIT_STATUS="$(git status --short --untracked-files -- public/locales)"
if [ -n "$GIT_STATUS" ]; then
  echo "There are uncommitted files in public or package locales folders. Remove or commit the files, then run this script again."
  git diff
  exit 1
fi

BRANCH=$(git branch  --show-current)
COMMIT=$(git rev-parse HEAD)
PROJECT_TITLE="[ACM $VERSION] Console UI - Branch $BRANCH/Commit $COMMIT"

echo "Creating project with title \"$PROJECT_TITLE\""

PROJECT_INFO=$(memsource project create --name "$PROJECT_TITLE" --template-id 317450 -f json)
PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.uid')

echo "Prepare JSON files for upload"
npm run i18n-generate
echo "Generated all JSON files"

echo "Creating jobs for generated JSON files"
for i in "${LANGUAGES[@]}"
do
  memsource job create --filenames public/locales/upload/"$i"-translation.json --target-langs $([[ "$i" == "es" ]] && echo es_001 || echo "$i") --project-id "${PROJECT_ID}"
done

echo "Uploaded JSON files to Memsource"
