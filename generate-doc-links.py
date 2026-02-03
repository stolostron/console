#!/usr/bin/env python3
"""
Prerequisites:
- Python 3.10 or higher
- openpyxl library (pip install openpyxl)

Usage:
  ./generate-doc-links.py

This script will extract the DOC_LINKS constants from the doc-util.tsx file
and save them to an Excel file named doc-links.xlsx.
The Excel file will have three sheets: ACM, OCP, and Other.
The ACM sheet will have the DOC_LINKS constants for the ACM documentation.
The OCP sheet will have the DOC_LINKS constants for the OCP documentation.
The Other sheet will have the DOC_LINKS constants for the external links.

Import the doc-links.xlsx to Google Sheets
Set import location to 'Insert new sheet(s)'

Limitations:
- The Excel checkbox doesn't work in Google Sheets. So just highlight the Checked column and use insert
checkbox feature. Google sheets will automatically convert the boolean values to checkboxes.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.worksheet.datavalidation import DataValidation

DOC_FILE = Path("./frontend/src/lib/doc-util.tsx")
OUTPUT_XLSX = Path("doc-links.xlsx")

DOC_VERSION_RE = re.compile(r"export const DOC_VERSION\s*=\s*['\"]([^'\"]+)['\"]")
OCP_DOC_VERSION_RE = re.compile(r"export const OCP_DOC_VERSION\s*=\s*['\"]([^'\"]+)['\"]")
DOC_HOME_RE = re.compile(r"export const DOC_HOME\s*=\s*`([^`]+)`")
OCP_DOC_HOME_RE = re.compile(r"const OCP_DOC_HOME\s*=\s*`([^`]+)`")
DOC_BASE_RE = re.compile(r"export const DOC_BASE_PATH\s*=\s*`([^`]+)`")
OCP_DOC_BASE_RE = re.compile(r"const OCP_DOC_BASE_PATH\s*=\s*`([^`]+)`")

DOC_LINKS_SECTION_RE = re.compile(r"export const DOC_LINKS = \{(.*?)\n\}", re.DOTALL)
DOC_LINKS_LINE_RE = re.compile(r"^ +([A-Z_]+):")
TEMPLATE_VAR_RE = re.compile(r"\$\{([A-Z0-9_]+)\}")
DOC_STAGING_BASE_TEMPLATE = (
    "https://content-stage.docs.redhat.com/en/documentation/"
    "red_hat_advanced_cluster_management_for_kubernetes/{DOC_VERSION}/html-single"
)
OCP_DOC_STAGING_BASE_TEMPLATE = (
    "https://content-stage.docs.redhat.com/en/documentation/"
    "openshift_container_platform/{OCP_DOC_VERSION}/html-single"
)

def find_doc_file() -> Path:
    if DOC_FILE.is_file():
        return DOC_FILE

    print(f"File {DOC_FILE} not found. Searching...")
    for path in Path(".").rglob("doc-util.*"):
        if path.is_file():
            return path

    print("Could not find doc-util file. Please check the path.")
    sys.exit(1)


def resolve_template(template: str, variables: dict[str, str]) -> str:
    if not template:
        return ""

    resolved = template
    for _ in range(5):
        replaced = TEMPLATE_VAR_RE.sub(
            lambda match: variables.get(match.group(1), match.group(0)),
            resolved,
        )
        if replaced == resolved:
            break
        resolved = replaced
    return resolved


def read_doc_paths(doc_text: str) -> tuple[str, str, str, str, str, str, str, str]:
    doc_base_match = DOC_BASE_RE.search(doc_text)
    ocp_doc_base_match = OCP_DOC_BASE_RE.search(doc_text)
    doc_version_match = DOC_VERSION_RE.search(doc_text)
    doc_home_match = DOC_HOME_RE.search(doc_text)
    ocp_doc_version_match = OCP_DOC_VERSION_RE.search(doc_text)
    ocp_doc_home_match = OCP_DOC_HOME_RE.search(doc_text)

    doc_base_template = doc_base_match.group(1) if doc_base_match else ""
    ocp_doc_base_template = ocp_doc_base_match.group(1) if ocp_doc_base_match else ""
    doc_version = doc_version_match.group(1) if doc_version_match else ""
    doc_home_template = doc_home_match.group(1) if doc_home_match else ""
    ocp_doc_version = ocp_doc_version_match.group(1) if ocp_doc_version_match else ""
    ocp_doc_home_template = ocp_doc_home_match.group(1) if ocp_doc_home_match else ""

    doc_home = resolve_template(doc_home_template, {"DOC_VERSION": doc_version})
    doc_base_path = resolve_template(
        doc_base_template,
        {"DOC_HOME": doc_home, "DOC_VERSION": doc_version},
    )
    ocp_doc_home = resolve_template(
        ocp_doc_home_template, {"OCP_DOC_VERSION": ocp_doc_version}
    )
    ocp_doc_base_path = resolve_template(
        ocp_doc_base_template,
        {"OCP_DOC_HOME": ocp_doc_home, "OCP_DOC_VERSION": ocp_doc_version},
    )

    print(f"Found DOC_BASE_PATH: {doc_base_path or doc_base_template}")
    print(f"Found OCP_DOC_BASE_PATH: {ocp_doc_base_path or ocp_doc_base_template}")
    print(f"Found DOC_VERSION: {doc_version}")

    return (
        doc_base_path,
        ocp_doc_base_path,
        doc_version,
        doc_home_template,
        doc_base_template,
        ocp_doc_version,
        ocp_doc_home_template,
        ocp_doc_base_template,
    )


def extract_doc_links_section(doc_text: str) -> list[str]:
    match = DOC_LINKS_SECTION_RE.search(doc_text)
    if not match:
        return []

    section = match.group(1)
    lines = section.splitlines()
    return [line for line in lines if DOC_LINKS_LINE_RE.match(line)]


def extract_relative_path(line: str, base_name: str) -> str:
    if base_name == "DOC_BASE_PATH":
        pattern = r".*\$\{DOC_BASE_PATH\}([^,`\"']+).*"
    else:
        pattern = r".*\$\{OCP_DOC_BASE_PATH\}([^,`\"']+).*"

    match = re.match(pattern, line)
    return match.group(1) if match else ""


def extract_url(line: str) -> str:
    match = re.search(r"[^\"'`]*[\"'`]([^\"'`]+)[\"'`]", line)
    return match.group(1) if match else ""


def decrement_version(version: str) -> str:
    if not version:
        return ""

    parts = version.split(".")
    if len(parts) == 1:
        try:
            value = int(parts[0])
        except ValueError:
            return ""
        return str(value - 1) if value > 0 else ""

    major, minor = parts[0], parts[1]
    try:
        minor_value = int(minor)
    except ValueError:
        return ""

    if minor_value <= 0:
        return ""

    return f"{major}.{minor_value - 1}"


def derive_doc_base_path_for_version(doc_base_path: str, version: str, target_version: str) -> str:
    if not doc_base_path or not version or not target_version:
        return ""

    version_token = f"/{version}/"
    target_token = f"/{target_version}/"
    if version_token in doc_base_path:
        return doc_base_path.replace(version_token, target_token, 1)

    if version in doc_base_path:
        return doc_base_path.replace(version, target_version, 1)

    return ""


def main() -> None:
    doc_file = find_doc_file()
    print(f"Using file: {doc_file}")

    doc_text = doc_file.read_text(encoding="utf-8")
    (
        doc_base_path,
        ocp_doc_base_path,
        doc_version,
        doc_home_template,
        doc_base_template,
        ocp_doc_version,
        ocp_doc_home_template,
        ocp_doc_base_template,
    ) = read_doc_paths(doc_text)
    doc_version_minus1 = decrement_version(doc_version)
    doc_home_minus1 = resolve_template(
        doc_home_template,
        {"DOC_VERSION": doc_version_minus1},
    )
    doc_base_path_minus1 = (
        resolve_template(
            doc_base_template,
            {"DOC_HOME": doc_home_minus1, "DOC_VERSION": doc_version_minus1},
        )
        if doc_home_minus1
        else ""
    )
    if not doc_base_path_minus1:
        doc_base_path_minus1 = derive_doc_base_path_for_version(
            doc_base_path,
            doc_version,
            doc_version_minus1,
        )
    doc_staging_base_path = (
        DOC_STAGING_BASE_TEMPLATE.format(DOC_VERSION=doc_version) if doc_version else ""
    )
    ocp_doc_staging_base_path = (
        OCP_DOC_STAGING_BASE_TEMPLATE.format(OCP_DOC_VERSION=ocp_doc_version) if ocp_doc_version else ""
    )
    ocp_doc_version_minus1 = decrement_version(ocp_doc_version)
    ocp_doc_home_minus1 = resolve_template(
        ocp_doc_home_template,
        {"OCP_DOC_VERSION": ocp_doc_version_minus1},
    )
    ocp_doc_base_path_minus1 = (
        resolve_template(
            ocp_doc_base_template,
            {"OCP_DOC_HOME": ocp_doc_home_minus1, "OCP_DOC_VERSION": ocp_doc_version_minus1},
        )
        if ocp_doc_home_minus1
        else ""
    )
    if not ocp_doc_base_path_minus1:
        ocp_doc_base_path_minus1 = derive_doc_base_path_for_version(
            ocp_doc_base_path,
            ocp_doc_version,
            ocp_doc_version_minus1,
        )
    lines = extract_doc_links_section(doc_text)
    if not lines:
        print(f"No DOC_LINKS constants found in {doc_file}")
        sys.exit(1)

    workbook = Workbook()
    acm_sheet = workbook.active
    acm_sheet.title = "ACM"
    ocp_sheet = workbook.create_sheet("OCP")
    other_sheet = workbook.create_sheet("Other")

    version_minus1_label = doc_version_minus1 or "DOC_VERSION-1"
    version_label = doc_version or "DOC_VERSION"
    acm_sheet.append(
        [
            "Constant",
            "Relative to DOC_BASE_PATH",
            f"ACM {version_minus1_label} Link",
            f"ACM {version_label} Link",
            "Checked",
        ]
    )
    ocp_version_minus1_label = ocp_doc_version_minus1 or "OCP_DOC_VERSION-1"
    ocp_version_label = ocp_doc_version or "OCP_DOC_VERSION"
    ocp_sheet.append(
        [
            "Constant",
            "Relative to OCP_DOC_BASE_PATH",
            f"OCP {ocp_version_minus1_label} Link",
            f"OCP {ocp_version_label} Link",
            "Checked",
        ]
    )
    other_sheet.append(["Constant", "URL", "Checked"])

    acm_sheet["A1"].font = Font(bold=True)
    acm_sheet["B1"].font = Font(bold=True)
    acm_sheet["C1"].font = Font(bold=True)
    acm_sheet["D1"].font = Font(bold=True)
    acm_sheet["E1"].font = Font(bold=True)
    ocp_sheet["A1"].font = Font(bold=True)
    ocp_sheet["B1"].font = Font(bold=True)
    ocp_sheet["C1"].font = Font(bold=True)
    ocp_sheet["D1"].font = Font(bold=True)
    ocp_sheet["E1"].font = Font(bold=True)
    other_sheet["A1"].font = Font(bold=True)
    other_sheet["B1"].font = Font(bold=True)
    other_sheet["C1"].font = Font(bold=True)

    num_links_acm = 0
    num_links_ocp = 0
    num_links_other = 0

    for line in lines:
        key_match = DOC_LINKS_LINE_RE.match(line)
        key = key_match.group(1) if key_match else ""

        if "${DOC_BASE_PATH}" in line:
            relative_path = extract_relative_path(line, "DOC_BASE_PATH")
            row_index = acm_sheet.max_row + 1
            acm_sheet.append([key, relative_path, None, None, False])
            if doc_base_path_minus1:
                acm_sheet[
                    f"C{row_index}"
                ] = f'=HYPERLINK("{doc_base_path_minus1}"&$B{row_index}, "Link")'
            if doc_staging_base_path:
                acm_sheet[
                    f"D{row_index}"
                ] = f'=HYPERLINK("{doc_staging_base_path}"&$B{row_index}, "Link")'
            num_links_acm += 1
        elif "${OCP_DOC_BASE_PATH}" in line:
            relative_path = extract_relative_path(line, "OCP_DOC_BASE_PATH")
            row_index = ocp_sheet.max_row + 1
            ocp_sheet.append([key, relative_path, None, None, False])
            if ocp_doc_base_path_minus1:
                ocp_sheet[
                    f"C{row_index}"
                ] = f'=HYPERLINK("{ocp_doc_base_path_minus1}"&$B{row_index}, "Link")'
            if ocp_doc_staging_base_path:
                ocp_sheet[
                    f"D{row_index}"
                ] = f'=HYPERLINK("{ocp_doc_staging_base_path}"&$B{row_index}, "Link")'
            num_links_ocp += 1
        else:
            url = extract_url(line)
            row_index = other_sheet.max_row + 1
            other_sheet.append([key, None, False])
            if url:
                other_sheet[
                    f"B{row_index}"
                ] = f'=HYPERLINK("{url}", "{url}")'
            num_links_other += 1

    if acm_sheet.max_row > 1:
        checkbox_validation = DataValidation(
            type="list",
            formula1='"TRUE,FALSE"',
            allow_blank=False,
        )
        acm_sheet.add_data_validation(checkbox_validation)
        checkbox_validation.add(f"E2:E{acm_sheet.max_row}")
    if ocp_sheet.max_row > 1:
        checkbox_validation = DataValidation(
            type="list",
            formula1='"TRUE,FALSE"',
            allow_blank=False,
        )
        ocp_sheet.add_data_validation(checkbox_validation)
        checkbox_validation.add(f"E2:E{ocp_sheet.max_row}")

    workbook.save(OUTPUT_XLSX)

    total_links = num_links_acm + num_links_ocp + num_links_other
    if total_links == 0:
        print(f"No DOC_LINKS constants found in {doc_file}")
        sys.exit(1)

    print(f"Successfully extracted {total_links} DOC_LINKS constants:")
    print(f"  - {num_links_acm} ACM documentation links")
    print(f"  - {num_links_ocp} OCP documentation links")
    print(f"  - {num_links_other} external links")
    print(f"Output saved to: {OUTPUT_XLSX}")
    print("You can now open this Excel file in your spreadsheet application.")


if __name__ == "__main__":
    main()
