#!/usr/bin/env python3
"""
Validate spec files for required fields and format.

Usage: python validate-spec.py <path-to-spec.md>
       python validate-spec.py --all --specs-dir specs/
"""

import argparse
import re
import sys
from pathlib import Path


REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated']
VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived']


def parse_frontmatter(content: str) -> dict | None:
    """Extract YAML frontmatter from markdown."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None

    frontmatter = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip()
    return frontmatter


def validate_spec(path: Path) -> list[str]:
    """Validate a spec file. Returns list of errors."""
    errors = []

    if not path.exists():
        return [f"File not found: {path}"]

    content = path.read_text()

    fm = parse_frontmatter(content)
    if fm is None:
        return [f"Missing frontmatter in {path}"]

    for field in REQUIRED_FIELDS:
        if field not in fm or not fm[field]:
            errors.append(f"Missing required field '{field}' in {path}")

    if 'status' in fm and fm['status'] not in VALID_STATUSES:
        errors.append(f"Invalid status '{fm['status']}' in {path}. Must be one of: {VALID_STATUSES}")

    if 'issue' in fm:
        issue = fm['issue']
        if issue in ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}']:
            errors.append(f"Issue field is placeholder in {path}. Must reference actual issue.")

    return errors


def main():
    parser = argparse.ArgumentParser(description='Validate spec files')
    parser.add_argument('path', nargs='?', help='Path to spec file')
    parser.add_argument('--all', action='store_true', help='Validate all specs')
    parser.add_argument('--specs-dir', default='specs/', help='Specs directory')
    args = parser.parse_args()

    if args.all:
        specs_dir = Path(args.specs_dir)
        specs = [p for p in specs_dir.rglob('*.md')
                 if p.name not in ('INDEX.md', 'SNAPSHOT.md', 'glossary.md')]

        all_errors = []
        for spec in specs:
            errors = validate_spec(spec)
            all_errors.extend(errors)

        if all_errors:
            print("Validation errors:")
            for error in all_errors:
                print(f"  - {error}")
            return 1

        print(f"✓ All {len(specs)} specs are valid")
        return 0

    elif args.path:
        errors = validate_spec(Path(args.path))
        if errors:
            print("Validation errors:")
            for error in errors:
                print(f"  - {error}")
            return 1
        print(f"✓ {args.path} is valid")
        return 0

    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main())
