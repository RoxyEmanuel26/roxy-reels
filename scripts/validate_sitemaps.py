#!/usr/bin/env python3
"""Strict, dependency-free validation for the generated sitemap set."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
VIDEO_NS = "http://www.google.com/schemas/sitemap-video/1.1"
MAX_BYTES = 50 * 1024 * 1024
MAX_URLS = 50_000
MAX_VIDEO_URLS = 1_000
BASE_HOST = "www.missav-j.com"
PRIVATE_PATHS = ("/search", "/history", "/watch-later")
VIDEO_FILE_RE = re.compile(r"^sitemap_videos_(\d+)-(\d+)\.xml$")
ID_RE = re.compile(r"-(\d+)$")


class ValidationError(Exception):
    pass


def qname(namespace: str, tag: str) -> str:
    return f"{{{namespace}}}{tag}"


def parse_lastmod(value: str, source: str) -> None:
    try:
        parsed = date.fromisoformat(value[:10])
    except ValueError as exc:
        raise ValidationError(f"{source}: invalid lastmod {value!r}") from exc
    if parsed > date.today():
        raise ValidationError(f"{source}: future lastmod {value!r}")


def validate_url(value: str, source: str, *, require_site_host: bool = True) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https":
        raise ValidationError(f"{source}: non-HTTPS URL {value}")
    if require_site_host and parsed.netloc != BASE_HOST:
        raise ValidationError(f"{source}: off-domain canonical URL {value}")
    if require_site_host and any(parsed.path == path or parsed.path.startswith(f"{path}/") for path in PRIVATE_PATHS):
        raise ValidationError(f"{source}: private or search URL included: {value}")


def validate(directory: Path, expected_total: int | None, expected_latest_id: int | None) -> dict[str, int]:
    index_path = directory / "sitemap_index.xml"
    if not index_path.is_file():
        raise ValidationError("sitemap_index.xml is missing")

    for xml_path in directory.glob("*.xml"):
        if xml_path.stat().st_size > MAX_BYTES:
            raise ValidationError(f"{xml_path.name}: exceeds 50 MiB")

    try:
        index_root = ET.parse(index_path).getroot()
    except ET.ParseError as exc:
        raise ValidationError(f"sitemap_index.xml: malformed XML: {exc}") from exc
    if index_root.tag != qname(SITEMAP_NS, "sitemapindex"):
        raise ValidationError("sitemap_index.xml: unexpected root element")

    references: list[str] = []
    for node in index_root.findall(qname(SITEMAP_NS, "sitemap")):
        loc = node.findtext(qname(SITEMAP_NS, "loc"), "").strip()
        validate_url(loc, "sitemap_index.xml")
        parsed = urlparse(loc)
        prefix = "/sitemaps/"
        if not parsed.path.startswith(prefix):
            raise ValidationError(f"sitemap_index.xml: invalid child location {loc}")
        name = unquote(parsed.path[len(prefix):])
        if not name or "/" in name:
            raise ValidationError(f"sitemap_index.xml: unsafe child name {name}")
        references.append(name)
        lastmod = node.findtext(qname(SITEMAP_NS, "lastmod"))
        if lastmod:
            parse_lastmod(lastmod.strip(), "sitemap_index.xml")

    if len(references) != len(set(references)):
        raise ValidationError("sitemap_index.xml: duplicate child sitemap")

    generated_files = {path.name for path in directory.glob("sitemap*.xml")}
    expected_files = set(references) | {"sitemap_index.xml"}
    missing = expected_files - generated_files
    orphaned = generated_files - expected_files
    if missing:
        raise ValidationError(f"index references missing files: {sorted(missing)}")
    if orphaned:
        raise ValidationError(f"orphaned sitemap files: {sorted(orphaned)}")

    all_locations: set[str] = set()
    watch_ids: set[int] = set()
    video_blocks = 0
    standard_only = 0

    for name in references:
        path = directory / name
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError as exc:
            raise ValidationError(f"{name}: malformed XML: {exc}") from exc
        if root.tag != qname(SITEMAP_NS, "urlset"):
            raise ValidationError(f"{name}: unexpected root element")
        urls = root.findall(qname(SITEMAP_NS, "url"))
        if len(urls) > MAX_URLS:
            raise ValidationError(f"{name}: exceeds 50,000 URLs")
        if VIDEO_FILE_RE.match(name) and len(urls) > MAX_VIDEO_URLS:
            raise ValidationError(f"{name}: exceeds 1,000 video URLs")

        raw = path.read_text(encoding="utf-8")
        if "<priority>" in raw or "<changefreq>" in raw:
            raise ValidationError(f"{name}: contains ignored priority/changefreq tags")

        for url_node in urls:
            loc = url_node.findtext(qname(SITEMAP_NS, "loc"), "").strip()
            validate_url(loc, name)
            if loc in all_locations:
                raise ValidationError(f"duplicate canonical URL: {loc}")
            all_locations.add(loc)

            lastmod = url_node.findtext(qname(SITEMAP_NS, "lastmod"))
            if lastmod:
                parse_lastmod(lastmod.strip(), name)

            parsed = urlparse(loc)
            is_watch = parsed.path.startswith("/en/watch/")
            if is_watch:
                match = ID_RE.search(parsed.path)
                if not match:
                    raise ValidationError(f"{name}: watch URL lacks numeric suffix: {loc}")
                video_id = int(match.group(1))
                if video_id in watch_ids:
                    raise ValidationError(f"duplicate video ID: {video_id}")
                watch_ids.add(video_id)

            blocks = url_node.findall(qname(VIDEO_NS, "video"))
            if len(blocks) > 1:
                raise ValidationError(f"{name}: more than one video block for {loc}")
            if is_watch and not blocks:
                standard_only += 1
            for block in blocks:
                for tag in ("thumbnail_loc", "title", "description"):
                    value = block.findtext(qname(VIDEO_NS, tag), "").strip()
                    if not value:
                        raise ValidationError(f"{name}: video block missing {tag}: {loc}")
                thumbnail = block.findtext(qname(VIDEO_NS, "thumbnail_loc"), "").strip()
                validate_url(thumbnail, name)
                player = block.findtext(qname(VIDEO_NS, "player_loc"), "").strip()
                content = block.findtext(qname(VIDEO_NS, "content_loc"), "").strip()
                if not player and not content:
                    raise ValidationError(f"{name}: video block lacks player_loc/content_loc: {loc}")
                media_url = player or content
                validate_url(media_url, name, require_site_host=False)
                if media_url == loc:
                    raise ValidationError(f"{name}: player/content URL equals canonical URL: {loc}")
                duration = block.findtext(qname(VIDEO_NS, "duration"))
                if duration and not 1 <= int(duration) <= 28_800:
                    raise ValidationError(f"{name}: invalid duration {duration}")
                publication = block.findtext(qname(VIDEO_NS, "publication_date"))
                if publication:
                    parse_lastmod(publication.strip(), name)
                if len(block.findall(qname(VIDEO_NS, "tag"))) > 32:
                    raise ValidationError(f"{name}: more than 32 video tags")
                video_blocks += 1

    if expected_total is not None and len(watch_ids) != expected_total:
        raise ValidationError(f"expected {expected_total} videos, found {len(watch_ids)}")
    if expected_latest_id is not None and expected_latest_id not in watch_ids:
        raise ValidationError(f"latest video ID {expected_latest_id} is missing")

    return {
        "sitemap_files": len(references),
        "canonical_urls": len(all_locations),
        "video_urls": len(watch_ids),
        "video_blocks": video_blocks,
        "standard_only_videos": standard_only,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", type=Path, default=Path("sitemaps"))
    parser.add_argument("--expected-total", type=int)
    parser.add_argument("--expected-latest-id", type=int)
    args = parser.parse_args()
    try:
        summary = validate(args.dir.resolve(), args.expected_total, args.expected_latest_id)
    except (OSError, ValueError, ValidationError) as exc:
        print(f"SITEMAP VALIDATION FAILED: {exc}", file=sys.stderr)
        return 1
    print("SITEMAP VALIDATION PASSED")
    for key, value in summary.items():
        print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
