#!/usr/bin/env python3
"""
Generate specs/INDEX.md from all spec files.

Usage: python generate-index.py --specs-dir specs/
"""

import argparse
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict


def parse_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from markdown."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    frontmatter = {}
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            frontmatter[key.strip()] = value.strip()
    return frontmatter


def generate_index(specs_dir: Path) -> str:
    """Generate INDEX.md content."""
    # Find all spec files
    specs = [p for p in specs_dir.rglob('*.md')
             if p.name not in ('INDEX.md', 'SNAPSHOT.md', 'glossary.md')]

    # Parse and categorize
    by_status = defaultdict(list)
    for spec_path in specs:
        content = spec_path.read_text()
        fm = parse_frontmatter(content)

        status = fm.get('status', 'active')
        title = fm.get('title', spec_path.stem)
        domain = fm.get('domain', 'Unknown')
        issue = fm.get('issue', '')
        created = fm.get('created', '')

        # Make path relative to specs dir
        rel_path = spec_path.relative_to(specs_dir)

        by_status[status].append({
            'title': title,
            'path': str(rel_path),
            'domain': domain,
            'issue': issue,
            'created': created,
        })

    # Count totals
    total = len(specs)
    active = len(by_status['active'])
    deprecated = len(by_status['deprecated'])
    archived = len(by_status['archived'])

    # Generate markdown
    lines = [
        "# Spec Index",
        "",
        f"Last updated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
        f"Total: {total} specs (Active: {active}, Deprecated: {deprecated}, Archived: {archived})",
        "",
    ]

    # Active specs
    lines.extend([
        "## Active",
        "",
        "| Feature | Spec | Domain | Issue | Since |",
        "|---------|------|--------|-------|-------|",
    ])

    if by_status['active']:
        for spec in sorted(by_status['active'], key=lambda x: x['created']):
            issue_link = f"[{spec['issue']}](#)" if spec['issue'] else ""
            lines.append(
                f"| {spec['title']} | [{spec['path']}]({spec['path']}) | {spec['domain']} | {issue_link} | {spec['created']} |"
            )
    else:
        lines.append("| *No active specs yet* | | | | |")

    lines.append("")

    # Deprecated specs
    lines.extend([
        "## Deprecated",
        "",
    ])

    if by_status['deprecated']:
        lines.append("| Feature | Spec | Domain | Issue | Deprecated |")
        lines.append("|---------|------|--------|-------|------------|")
        for spec in sorted(by_status['deprecated'], key=lambda x: x['created']):
            issue_link = f"[{spec['issue']}](#)" if spec['issue'] else ""
            lines.append(
                f"| {spec['title']} | [{spec['path']}]({spec['path']}) | {spec['domain']} | {issue_link} | {spec['created']} |"
            )
    else:
        lines.append("*None*")

    lines.append("")

    # Archived specs
    lines.extend([
        "## Archived",
        "",
    ])

    if by_status['archived']:
        lines.append("| Feature | Spec | Domain | Issue | Archived |")
        lines.append("|---------|------|--------|-------|----------|")
        for spec in sorted(by_status['archived'], key=lambda x: x['created']):
            issue_link = f"[{spec['issue']}](#)" if spec['issue'] else ""
            lines.append(
                f"| {spec['title']} | [{spec['path']}]({spec['path']}) | {spec['domain']} | {issue_link} | {spec['created']} |"
            )
    else:
        lines.append("*None*")

    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description='Generate spec index')
    parser.add_argument('--specs-dir', default='specs/', help='Specs directory')
    args = parser.parse_args()

    specs_dir = Path(args.specs_dir)
    if not specs_dir.exists():
        print(f"Error: Specs directory not found: {specs_dir}")
        return 1

    index_content = generate_index(specs_dir)
    index_path = specs_dir / 'INDEX.md'
    index_path.write_text(index_content)

    print(f"✓ Generated {index_path}")
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
