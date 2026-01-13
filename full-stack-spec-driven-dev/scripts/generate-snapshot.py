#!/usr/bin/env python3
"""
Generate specs/SNAPSHOT.md from all active spec files.

Usage: python generate-snapshot.py --specs-dir specs/
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


def extract_overview(content: str) -> str:
    """Extract the overview section from spec content."""
    # Remove frontmatter
    content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)

    # Find overview section
    match = re.search(r'## Overview\s*\n(.*?)(?=\n##|$)', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def generate_snapshot(specs_dir: Path) -> str:
    """Generate SNAPSHOT.md content."""
    # Find all active spec files
    specs = []
    for spec_path in specs_dir.rglob('*.md'):
        if spec_path.name in ('INDEX.md', 'SNAPSHOT.md', 'glossary.md'):
            continue

        content = spec_path.read_text()
        fm = parse_frontmatter(content)

        if fm.get('status') == 'active':
            specs.append({
                'title': fm.get('title', spec_path.stem),
                'path': str(spec_path.relative_to(specs_dir)),
                'domain': fm.get('domain', 'Unknown'),
                'issue': fm.get('issue', ''),
                'overview': extract_overview(content),
                'content': content,
            })

    # Group by domain
    by_domain = defaultdict(list)
    for spec in specs:
        by_domain[spec['domain']].append(spec)

    # Generate markdown
    lines = [
        "# Product Snapshot",
        "",
        f"Generated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
        "This document represents the current active state of the product by compiling all active specifications.",
        "",
    ]

    # Table of contents
    if by_domain:
        lines.extend([
            "## Table of Contents",
            "",
        ])
        for domain in sorted(by_domain.keys()):
            lines.append(f"- [{domain}](#{domain.lower().replace(' ', '-')})")
        lines.append("")

    # By domain
    lines.extend([
        "## By Domain",
        "",
    ])

    for domain in sorted(by_domain.keys()):
        lines.extend([
            f"### {domain}",
            "",
        ])

        for spec in sorted(by_domain[domain], key=lambda x: x['title']):
            lines.extend([
                f"#### {spec['title']}",
                f"**Spec:** [{spec['path']}]({spec['path']})",
            ])

            if spec['issue']:
                lines.append(f"**Issue:** [{spec['issue']}](#)")

            lines.append("")

            if spec['overview']:
                lines.append(spec['overview'])
                lines.append("")

            lines.append("---")
            lines.append("")

    if not by_domain:
        lines.append("*No active specs yet*")
        lines.append("")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Generate product snapshot')
    parser.add_argument('--specs-dir', default='specs/', help='Specs directory')
    args = parser.parse_args()

    specs_dir = Path(args.specs_dir)
    if not specs_dir.exists():
        print(f"Error: Specs directory not found: {specs_dir}")
        return 1

    snapshot_content = generate_snapshot(specs_dir)
    snapshot_path = specs_dir / 'SNAPSHOT.md'
    snapshot_path.write_text(snapshot_content)

    print(f"✓ Generated {snapshot_path}")
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())
