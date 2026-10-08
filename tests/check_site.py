"""Validate crawlable pages, language pairs, sitemap, and local links/assets."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://seafood.baharinusantara.id/'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.tags, self.ids, self.schemas = path, [], set(), []
        self.json_text = None
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.tags.append((tag, d))
        if 'id' in d:
            assert d['id'] not in self.ids, (self.path, 'duplicate id', d['id'])
            self.ids.add(d['id'])
        if tag == 'script' and d.get('type') == 'application/ld+json':
            self.json_text = ''
    def handle_data(self, data):
        if self.json_text is not None:
            self.json_text += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.json_text is not None:
            self.schemas.append(json.loads(self.json_text))
            self.json_text = None
    def attrs(self, tag, **criteria):
        return [d for t, d in self.tags if t == tag and all(d.get(k) == v for k, v in criteria.items())]

def local(url):
    p = ROOT / unquote(urlsplit(url).path).lstrip('/')
    return p / 'index.html' if p.is_dir() else p

pages = {p: Page(p) for p in ROOT.rglob('*.html') if '.git' not in p.parts}
canonicals = set()
for path, page in pages.items():
    page_url = BASE + path.relative_to(ROOT).as_posix()
    canonical = page.attrs('link', rel='canonical')
    assert len(canonical) == 1, (path, 'canonical')
    canonical = canonical[0]['href']
    assert canonical.startswith(BASE) and local(canonical) == path
    assert canonical not in canonicals
    canonicals.add(canonical)
    assert len(page.attrs('h1')) == 1, (path, 'H1')
    assert len(page.attrs('meta', name='description')) == 1
    assert page.attrs('meta', property='og:url')[0]['content'] == canonical
    assert page.schemas and all(s['@context'] == 'https://schema.org' for s in page.schemas)
    language = page.attrs('html')[0]['lang']
    alternates = {d['hreflang']: d['href'] for d in page.attrs('link', rel='alternate')}
    assert set(alternates) == {'en', 'id', 'x-default'}
    assert alternates[language] == canonical and alternates['x-default'] == alternates['en']
    for lang, url in alternates.items():
        assert url.startswith(BASE), (path, 'relative hreflang')
        other = pages[local(url)]
        assert other.attrs('link', rel='alternate') == page.attrs('link', rel='alternate'), (path, 'non-reciprocal language pair')
    for tag, d in page.tags:
        for attr in ('href', 'src', 'poster'):
            if attr not in d:
                continue
            url = urljoin(page_url, d[attr])
            parts = urlsplit(url)
            if parts.scheme not in ('http', 'https') or parts.netloc != urlsplit(BASE).netloc:
                continue
            target = local(url)
            assert target.exists(), (path, 'missing target', d[attr])
            if parts.fragment and target in pages:
                assert unquote(parts.fragment) in pages[target].ids, (path, 'missing anchor', d[attr])
    switch = next(d for t, d in page.tags if t == 'a' and d.get('class') == 'lang-switch')
    assert local(urljoin(page_url, switch['href'])) == local(alternates[switch['hreflang']])
    if page.attrs('form', id='contactForm'):
        for field in ['name', 'company', 'email', 'phone', 'product', 'quantity', 'destination', 'message']:
            assert field in page.ids
        assert 'disabled' in page.attrs('button', type='submit')[0]

sitemap = ET.parse(ROOT / 'sitemap.xml')
urls = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(set(urls)) and set(urls) == canonicals
assert 'Sitemap: '+BASE+'sitemap.xml' in (ROOT / 'robots.txt').read_text()
print(f'PASS: {len(pages)} pages; local links/assets/anchors, canonical URLs, reciprocal language pairs, JSON-LD, forms, and sitemap.')
