// Convert Through The Veil markdown to print-ready HTML
const fs = require('fs');
const path = require('path');

const md = fs.readFileSync(path.join(__dirname, '..', 'public', 'through-the-veil.md'), 'utf8');
const lines = md.split('\n');

let html = '';
let inBlockquote = false;
let inList = false;
let listType = '';

// Track parts and chapters
let currentPart = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].replace(/\r$/, '');

  // Skip TABLE OF CONTENTS section
  if (/^## TABLE OF CONTENTS/i.test(line)) {
    while (i < lines.length - 1 && !/^# (PART|CHAPTER)/i.test(lines[i + 1])) i++;
    continue;
  }

  // Part headers
  if (/^# PART /i.test(line)) {
    if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
    if (inList) { html += '</' + listType + '>'; inList = false; }
    currentPart = line.replace(/^# /, '').trim();
    html += '<div class="page-break"></div>';
    html += '<div class="part-header"><h2>' + escapeHtml(currentPart) + '</h2></div>';
    continue;
  }

  // Chapter headers
  const chMatch = line.match(/^# (CHAPTER \d+[A-Z]?:.+)$/i);
  const appMatch = line.match(/^# (APPENDIX[^:]*:.*)$/i) || line.match(/^# (APPENDIX.*)$/i);
  if (chMatch || appMatch) {
    if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
    if (inList) { html += '</' + listType + '>'; inList = false; }
    const title = (chMatch ? chMatch[1] : appMatch[1]).trim();
    html += '<div class="page-break"></div>';
    html += '<h1 class="chapter-title">' + escapeHtml(title) + '</h1>';
    continue;
  }

  // H2 headers (## )
  if (/^## (.+)/.test(line)) {
    if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
    if (inList) { html += '</' + listType + '>'; inList = false; }
    html += '<h2>' + inlineFormat(line.replace(/^## /, '')) + '</h2>';
    continue;
  }

  // H3 headers (### )
  if (/^### (.+)/.test(line)) {
    if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
    if (inList) { html += '</' + listType + '>'; inList = false; }
    html += '<h3>' + inlineFormat(line.replace(/^### /, '')) + '</h3>';
    continue;
  }

  // Horizontal rule
  if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
    if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
    if (inList) { html += '</' + listType + '>'; inList = false; }
    html += '<hr>';
    continue;
  }

  // Blockquote
  if (/^> (.*)/.test(line)) {
    if (inList) { html += '</' + listType + '>'; inList = false; }
    if (!inBlockquote) { html += '<blockquote>'; inBlockquote = true; }
    html += inlineFormat(line.replace(/^> ?/, '')) + '<br>';
    continue;
  } else if (inBlockquote) {
    html += '</blockquote>';
    inBlockquote = false;
  }

  // Unordered list
  if (/^[-*] (.+)/.test(line)) {
    if (inList && listType !== 'ul') { html += '</' + listType + '>'; inList = false; }
    if (!inList) { html += '<ul>'; inList = true; listType = 'ul'; }
    html += '<li>' + inlineFormat(line.replace(/^[-*] /, '')) + '</li>';
    continue;
  }

  // Ordered list
  if (/^\d+\. (.+)/.test(line)) {
    if (inList && listType !== 'ol') { html += '</' + listType + '>'; inList = false; }
    if (!inList) { html += '<ol>'; inList = true; listType = 'ol'; }
    html += '<li>' + inlineFormat(line.replace(/^\d+\. /, '')) + '</li>';
    continue;
  }

  // End list on empty line
  if (inList && line.trim() === '') {
    html += '</' + listType + '>';
    inList = false;
  }

  // Skip empty lines
  if (line.trim() === '') continue;

  // Normal paragraph
  if (inList) { html += '</' + listType + '>'; inList = false; }
  html += '<p>' + inlineFormat(line) + '</p>';
}

if (inBlockquote) html += '</blockquote>';
if (inList) html += '</' + listType + '>';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  return text;
}

// Wrap in full HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Through The Veil — Unraveling the Tapestry of Lies | By Jason Andrews</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Inter:wght@400;600;700;900&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1a1a1a;
      background: #fff;
      max-width: 7in;
      margin: 0 auto;
      padding: 0.5in;
    }

    @media print {
      body { padding: 0; max-width: none; }
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }

    /* Cover page */
    .cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 90vh;
      text-align: center;
      page-break-after: always;
    }
    .cover h1 {
      font-family: 'Inter', sans-serif;
      font-size: 36pt;
      font-weight: 900;
      letter-spacing: -1px;
      margin-bottom: 8px;
      color: #0a0a0a;
    }
    .cover .subtitle {
      font-size: 16pt;
      font-style: italic;
      color: #555;
      margin-bottom: 32px;
    }
    .cover .tagline {
      font-size: 11pt;
      font-style: italic;
      color: #666;
      margin-bottom: 48px;
      max-width: 5in;
    }
    .cover .author {
      font-family: 'Inter', sans-serif;
      font-size: 14pt;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }
    .cover .edition {
      font-size: 10pt;
      color: #999;
    }

    /* Part headers */
    .part-header {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40vh;
      text-align: center;
    }
    .part-header h2 {
      font-family: 'Inter', sans-serif;
      font-size: 20pt;
      font-weight: 900;
      color: #0a0a0a;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    /* Chapter titles */
    .chapter-title {
      font-family: 'Inter', sans-serif;
      font-size: 18pt;
      font-weight: 900;
      color: #0a0a0a;
      margin: 48px 0 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ddd;
    }

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 14pt;
      font-weight: 800;
      color: #1a1a1a;
      margin: 32px 0 16px;
    }

    h3 {
      font-family: 'Inter', sans-serif;
      font-size: 12pt;
      font-weight: 700;
      color: #333;
      margin: 24px 0 12px;
    }

    p { margin-bottom: 12px; text-align: justify; }

    blockquote {
      border-left: 3px solid #888;
      padding: 8px 16px;
      margin: 16px 0;
      font-style: italic;
      color: #444;
      background: #f9f9f9;
    }

    ul, ol { padding-left: 24px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }

    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 24px 0;
    }

    strong { font-weight: 700; color: #0a0a0a; }
    em { font-style: italic; color: #333; }
    code {
      background: #f0f0f0;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10pt;
    }
    a { color: #1a5276; text-decoration: underline; }

    .page-break { page-break-before: always; }

    /* Footer */
    .book-footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 2px solid #ddd;
      text-align: center;
      font-size: 10pt;
      color: #999;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>THROUGH THE VEIL</h1>
    <div class="subtitle">Unraveling the Tapestry of Lies</div>
    <div class="tagline">A Journey Through Hidden History, Suppressed Truth, and Spiritual Warfare</div>
    <div class="author">By Jason Andrews</div>
    <div class="edition">First Edition</div>
  </div>

  <!-- Book Content -->
  ${html}

  <!-- Footer -->
  <div class="book-footer">
    <p>Copyright © 2025 Jason Andrews. All rights reserved.</p>
    <p>throughtheveil.tlid.io</p>
  </div>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'Through-The-Veil-COMPLETE.html');
fs.writeFileSync(outPath, fullHtml, 'utf8');
console.log('✅ Generated: ' + outPath);
console.log('   Size: ' + (fullHtml.length / 1024).toFixed(1) + 'KB');
console.log('   Chapters: ' + (fullHtml.match(/class="chapter-title"/g) || []).length);
