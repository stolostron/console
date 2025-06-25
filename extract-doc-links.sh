#!/bin/bash
# this script extracts DOC_LINKS constants from doc-util.tsx and saves them to a CSV file named doc-links.csv

DOC_FILE="./frontend/src/lib/doc-util.tsx"

# check if the file doc-util.tsx exists
if [ ! -f "$DOC_FILE" ]; then
  echo "File $DOC_FILE not found. Searching..."
  DOC_FILE=$(find . -type f -name "doc-util.*" 2>/dev/null | head -n 1)
  
  if [ -z "$DOC_FILE" ]; then
    echo "Could not find doc-util file. Please check the path."
    exit 1
  fi
fi

echo "Using file: $DOC_FILE"
OUTPUT_CSV="doc-links.csv"

# extracts DOC_BASE_PATH and OCP_DOC_BASE_PATH values
# shellcheck disable=SC2016
DOC_BASE_PATH=$(grep "export const DOC_BASE_PATH" "$DOC_FILE" | sed -E 's/.*DOC_BASE_PATH = `([^`]+)`.*/\1/')
# shellcheck disable=SC2016
OCP_DOC_BASE_PATH=$(grep "const OCP_DOC_BASE_PATH" "$DOC_FILE" | sed -E 's/.*OCP_DOC_BASE_PATH = `([^`]+)`.*/\1/')

echo "Found DOC_BASE_PATH: $DOC_BASE_PATH"
echo "Found OCP_DOC_BASE_PATH: $OCP_DOC_BASE_PATH"

# create the CSV with headers
echo "Constant,Relative to DOC_BASE_PATH" > "$OUTPUT_CSV"

echo "Extracting DOC_LINKS constants to CSV..."

# extracts the DOC_LINKS section
sed -n '/export const DOC_LINKS = {/,/^}/p' "$DOC_FILE" > doc_links_section.txt

# processing each line, filtering out lines that aren't key-value pairs
grep -E "^ +[A-Z_]+:" doc_links_section.txt | while IFS= read -r line; do
  # Extract key
  key=$(echo "$line" | sed -E 's/^ +([A-Z_]+): .*/\1/')
  
  # extract and process URL
  # create pattern parts to avoid shellcheck warnings about variables in single quotes
  dollar="\$"
  open="{"
  close="}"
  doc_path="DOC_BASE_PATH"
  ocp_doc_path="OCP_DOC_BASE_PATH"
  
  doc_pattern="${dollar}${open}${doc_path}${close}"
  ocp_doc_pattern="${dollar}${open}${ocp_doc_path}${close}"
  
  if [[ $line == *"$doc_pattern"* ]]; then
    # extract relative path for DOC_BASE_PATH
    # shellcheck disable=SC2016
    relative_path=$(echo "$line" | sed -E 's/.*\$\{DOC_BASE_PATH\}([^,`"'"'"']+).*/\1/')
    echo "$key,$relative_path" >> "$OUTPUT_CSV"
  elif [[ $line == *"$ocp_doc_pattern"* ]]; then
    # for OCP docs, marks them as OCP and include the full path
    # shellcheck disable=SC2016
    relative_path=$(echo "$line" | sed -E 's/.*\$\{OCP_DOC_BASE_PATH\}([^,`"'"'"']+).*/\1 (OCP doc)/')
    echo "$key,$relative_path" >> "$OUTPUT_CSV"
  else
    # for direct URLs, includes the full URL
    url=$(echo "$line" | sed -E 's/[^"'"'"'`]*["'"'"'`]([^"'"'"'`]+)["'"'"'`].*/\1/')
    echo "$key,$url (external)" >> "$OUTPUT_CSV"
  fi
done

# cleaning up temporary file
rm doc_links_section.txt

# checks if we found any links
num_links=$(wc -l < "$OUTPUT_CSV")
num_links=$((num_links - 1))  # subtract 1 for header

if [ $num_links -eq 0 ]; then
  echo "No DOC_LINKS constants found in $DOC_FILE"
  exit 1
else
  echo "Successfully extracted $num_links DOC_LINKS constants"
fi

echo "Output saved to $OUTPUT_CSV"
echo "You can now open doc-links.csv in your spreadsheet application."