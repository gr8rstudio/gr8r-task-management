#!/bin/sh
# Builds from src/. Run from the quire/ directory.
#   index.html  single self-contained file (claude.ai artifact, open-from-disk)
#   deploy/     static site for Vercel: small index.html that loads the source files, cache-busted
set -e
node tools/gen-icons.js > src/00-icons.js
JS="src/00-icons.js $(ls src/0[2-9]*.js) src/99-init.js"
{ cat src/01-head.html; echo '<style>'; cat src/01-styles.css; echo '</style>'; cat src/00-body.html; echo '<script>'; cat $JS; echo '</script>'; } > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes)"

rm -rf deploy && mkdir -p deploy/src deploy/tools deploy/figma
cp src/* deploy/src/ && cp build.sh deploy/ && cp tools/gen-icons.js deploy/tools/ && cp figma/lib.js deploy/figma/
v() { shasum -a 1 "$1" | cut -c1-10; }
FAV="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231D1C1A'/%3E%3Ctext x='7' y='23' font-family='Arial,sans-serif' font-weight='700' font-size='20' fill='%23fff'%3Eg%3C/text%3E%3Crect x='21' y='7' width='5' height='5' fill='%23FE370B'/%3E%3C/svg%3E"
{
  echo '<!doctype html>'; echo '<html lang="en">'; echo '<head>'
  cat src/01-head.html
  echo "<link rel=\"icon\" href=\"$FAV\">"
  echo "<link rel=\"stylesheet\" href=\"src/01-styles.css?v=$(v src/01-styles.css)\">"
  echo '</head>'; echo '<body>'
  cat src/00-body.html
  for f in $JS; do echo "<script defer src=\"$f?v=$(v $f)\"></script>"; done
  echo '</body>'; echo '</html>'
} > deploy/index.html
cat > deploy/vercel.json <<'JSON'
{
  "cleanUrls": true,
  "headers": [
    { "source": "/src/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] }
  ]
}
JSON
echo "built deploy/ ($(find deploy -type f | wc -l | tr -d ' ') files)"
