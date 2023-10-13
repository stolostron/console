#!/usr/bin/env bash

set -exuo pipefail

source ./i18n-scripts/languages.sh

while getopts p: flag
do
  case "${flag}" in
      p) PROJECT_ID=${OPTARG};;
      *) echo "usage: $0 [-p]" >&2
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

echo "Downloading JSON files from Project ID \"$PROJECT_ID\""

DOWNLOAD_PATH="public/locales/download"

# Memsource job listing is limited to 50 jobs per page
# We need to pull all the files down by page and stop when we reach a page with no data
for i in "${LANGUAGES[@]}"
do
  COUNTER=0
  CURRENT_PAGE=( $(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number 0 -c uid) )
  until [ -z "$CURRENT_PAGE" ]
  do
    ((COUNTER=COUNTER+1))
    echo Downloading page "$CURRENT_PAGE"
    memsource job download --project-id "$PROJECT_ID" --output-dir "$DOWNLOAD_PATH" --job-id "${CURRENT_PAGE[@]}"
    CURRENT_PAGE=$(memsource job list --project-id "$PROJECT_ID" --target-lang "$i" -f value --page-number "$COUNTER" -c uid | tr '\n' ' ')
  done
done

echo Copying and renaming downloaded JSON files into correct locations
for i in "${LANGUAGES[@]}"
do
  cp "$DOWNLOAD_PATH/$i-translation.json" "public/locales/$i/translation.json"
done

echo Creating commit
git add public/locales
git commit --signoff -m "chore(i18n): update translations

Adding latest translations from Memsource project https://cloud.memsource.com/web/project2/show/$PROJECT_ID"
