"""Offline, stdlib-only checks for the static TYPE D concept.
Run: python3 tests/validate.py
External destinations are checked for exact source consistency, not availability.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.nodes = []
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

doc = Document()
source = (ROOT / 'index.html').read_text()
doc.feed(source)
ids = [a['id'] for _, a in doc.nodes if 'id' in a]
assert len(ids) == len(set(ids)), 'Duplicate IDs'
assert len([1 for t, _ in doc.nodes if t == 'h1']) == 1
assert next(a for t,a in doc.nodes if t == 'html')['lang'] == 'ja'
assert len([1 for t,_ in doc.nodes if t == 'main']) == 1
for tag, attrs in doc.nodes:
    for key in ('src', 'href'):
        value = attrs.get(key, '')
        if value.startswith('./'):
            assert (ROOT / value).is_file(), f'Missing asset: {value}'
        if value.startswith('#'):
            assert value[1:] in ids, f'Missing anchor: {value}'
    if tag == 'img':
        assert 'alt' in attrs
        assert 'width' in attrs and 'height' in attrs
    if tag == 'a' and attrs.get('target') == '_blank':
        assert 'noopener' in attrs.get('rel', '') and 'noreferrer' in attrs.get('rel', '')
    for part in attrs.get('srcset', '').split(','):
        if part.strip():
            path = part.strip().split()[0]
            assert (ROOT / path).is_file(), f'Missing responsive asset: {path}'
    if tag == 'button':
        assert attrs.get('type') == 'button'
assert 'tel:0333927002' in source
assert 'https://www.instagram.com/tomisho0520/' in source
assert 'https://maps.app.goo.gl/iLLxTrVXeHte9asE9' in source
assert '東京都杉並区上荻1-4-1' in source
assert '18:00–24:00' in source and '18:00–26:00' in source
assert 'noindex, nofollow' in source
for name in ('description',):
    assert next(a for t,a in doc.nodes if t == 'meta' and a.get('name') == name)['content']
canonical = next(a for t,a in doc.nodes if t == 'link' and a.get('rel') == 'canonical')['href']
assert canonical == 'https://local-store-web.github.io/tomisho-hp/'
schema = re.search(r'<script type="application/ld\+json">(.*?)</script>', source, re.S).group(1)
data = json.loads(schema)
assert data['@type'] == 'Restaurant'
assert not any(key in data for key in ('aggregateRating', 'review', 'award', 'priceRange'))
assert 'prefers-reduced-motion' in (ROOT / 'styles.css').read_text()
assert 'prefers-reduced-motion' in (ROOT / 'script.js').read_text()
print(json.dumps({'status':'passed','checks':['HTML identity/headings/landmarks','unique IDs/internal anchors','local asset paths/srcsets','all image alt/sizing','external rel safety','fact/link consistency','metadata/canonical/noindex','Restaurant JSON-LD','reduced motion hooks'],'nodes':len(doc.nodes),'images':len([1 for t,_ in doc.nodes if t=='img'])},ensure_ascii=False,indent=2))
