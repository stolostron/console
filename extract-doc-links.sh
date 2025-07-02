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
OUTPUT_CSV_ACM="doc-links-acm.csv"
OUTPUT_CSV_OCP="doc-links-ocp.csv"
OUTPUT_CSV_OTHER="doc-links-other.csv"

# extracts DOC_BASE_PATH and OCP_DOC_BASE_PATH values
# shellcheck disable=SC2016
DOC_BASE_PATH=$(grep "export const DOC_BASE_PATH" "$DOC_FILE" | sed -E 's/.*DOC_BASE_PATH = `([^`]+)`.*/\1/')
# shellcheck disable=SC2016
OCP_DOC_BASE_PATH=$(grep "const OCP_DOC_BASE_PATH" "$DOC_FILE" | sed -E 's/.*OCP_DOC_BASE_PATH = `([^`]+)`.*/\1/')

echo "Found DOC_BASE_PATH: $DOC_BASE_PATH"
echo "Found OCP_DOC_BASE_PATH: $OCP_DOC_BASE_PATH"

# create the CSV with headers
echo "Constant,Relative to DOC_BASE_PATH" > "$OUTPUT_CSV_ACM"
echo "Constant,Relative to OCP_DOC_BASE_PATH" > "$OUTPUT_CSV_OCP"
echo "Constant,URL" > "$OUTPUT_CSV_OTHER"

echo "Extracting DOC_LINKS constants to CSV..."

# extracts the DOC_LINKS section
sed -n '/export const DOC_LINKS = {/,/^}/p' "$DOC_FILE" > doc_links_section.txt

# processing each line, filtering out lines that aren't key-value pairs
grep -E "^ +[A-Z_]+:" doc_links_section.txt | while IFS= read -r line; do
  # extracts key
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
  # for ACM docs (using DOC_BASE_PATH)
  relative_path=$(echo "$line" | sed -E 's/.*\$\{DOC_BASE_PATH\}([^,`"'"'"']+).*/\1/')
  echo "$key,$relative_path" >> "$OUTPUT_CSV_ACM"
elif [[ $line == *"$ocp_doc_pattern"* ]]; then
  # for OCP docs (using OCP_DOC_BASE_PATH)
  relative_path=$(echo "$line" | sed -E 's/.*\$\{OCP_DOC_BASE_PATH\}([^,`"'"'"']+).*/\1/')
  echo "$key,$relative_path" >> "$OUTPUT_CSV_OCP"
else
  # for external links (not using DOC_BASE_PATH or OCP_DOC_BASE_PATH)
  url=$(echo "$line" | sed -E 's/[^"'"'"'`]*["'"'"'`]([^"'"'"'`]+)["'"'"'`].*/\1/')
  echo "$key,$url" >> "$OUTPUT_CSV_OTHER"
fi
done

# cleaning up temporary file
rm doc_links_section.txt

# count links in all files
num_links_acm=$(wc -l < "$OUTPUT_CSV_ACM")
num_links_acm=$((num_links_acm - 1))  # subtract 1 for header
num_links_ocp=$(wc -l < "$OUTPUT_CSV_OCP")
num_links_ocp=$((num_links_ocp - 1))  # subtract 1 for header
num_links_other=$(wc -l < "$OUTPUT_CSV_OTHER")
num_links_other=$((num_links_other - 1))  # subtract 1 for header
total_links=$((num_links_acm + num_links_ocp + num_links_other))

if [ $total_links -eq 0 ]; then
  echo "No DOC_LINKS constants found in $DOC_FILE"
  exit 1
else
  echo "Successfully extracted $total_links DOC_LINKS constants:"
  echo "  - $num_links_acm ACM documentation links"
  echo "  - $num_links_ocp OCP documentation links"
  echo "  - $num_links_other external links"
fi

echo "Output saved to:"
echo "  - $OUTPUT_CSV_ACM"
echo "  - $OUTPUT_CSV_OCP"
echo "  - $OUTPUT_CSV_OTHER"
echo "You can now open these CSV files in your spreadsheet application."