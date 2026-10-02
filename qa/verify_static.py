"""Dependency-free source checks. Run: python3 qa/verify_static.py"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from collections import Counter
import json
import subprocess

ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.images, self.headings = [], [], [], []
        self.meta, self.json_ld = {}, ""
        self.in_schema = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag in ("a", "link", "img", "script", "source"):
            self.refs += [attrs[key] for key in ("href", "src") if key in attrs]
            self.refs += [item.strip().split()[0] for item in attrs.get("srcset", "").split(",") if item.strip()]
        if tag == "img":
            self.images.append(attrs)
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.headings.append(int(tag[1]))
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("property", ""))] = attrs.get("content", "")
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_schema = True
    def handle_data(self, data):
        if self.in_schema:
            self.json_ld += data
    def handle_endtag(self, tag):
        if tag == "script":
            self.in_schema = False

page = Page()
source = (ROOT / "index.html").read_text()
page.feed(source)
errors = []
for name, count in Counter(page.ids).items():
    if count != 1:
        errors.append(f"Duplicate ID: {name}")
for url in page.refs:
    if url.startswith("#") and url[1:] not in page.ids:
        errors.append(f"Broken anchor: {url}")
    if url.startswith("./") and not (ROOT / unquote(urlsplit(url).path)).is_file():
        errors.append(f"Missing asset: {url}")
for image in page.images:
    for required in ("alt", "width", "height"):
        if required not in image:
            errors.append(f"Image missing {required}: {image.get('src')}")
if page.headings.count(1) != 1:
    errors.append("Expected one h1")
for previous, current in zip(page.headings, page.headings[1:]):
    if current > previous + 1:
        errors.append(f"Skipped heading level: h{previous} to h{current}")
for required in ("description", "og:title", "og:description", "og:image", "og:url", "robots"):
    if not page.meta.get(required):
        errors.append(f"Missing metadata: {required}")
for required in ("philosophy", "counter", "charcoal", "food", "chef", "seasonal", "sake", "access", "reservation"):
    if required not in page.ids:
        errors.append(f"Missing story section: {required}")
for required in ("tel:0333927002", "https://www.instagram.com/tomisho0520/", "https://maps.app.goo.gl/iLLxTrVXeHte9asE9"):
    if required not in page.refs:
        errors.append(f"Missing verified link: {required}")
schema = json.loads(page.json_ld)
if schema["name"] != "旬ものと日本酒 とみ笑" or schema["telephone"] != "03-3392-7002":
    errors.append("Structured data facts mismatch")
syntax = subprocess.run(["node", "--check", str(ROOT / "script.js")], capture_output=True, text=True)
if syntax.returncode:
    errors.append(syntax.stderr)
result = {"status": "PASS" if not errors else "FAIL", "errors": errors,
          "anchors_and_assets_checked": len(page.refs), "images": len(page.images),
          "headings": page.headings, "script_syntax": syntax.returncode == 0,
          "source_bytes": {name: (ROOT / name).stat().st_size for name in ("index.html", "styles.css", "script.js")},
          "scope": "Source checks only. Browser layout, runtime, external destinations, and assistive technology are separate checks."}
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
