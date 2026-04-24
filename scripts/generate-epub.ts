import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

const chapters = [
  { id: "foreword", title: "Foreword", content: `<p class="italic">You weren't supposed to read this book.</p>
<p>Not because it contains state secrets or classified information. But because the system that has operated for millennia depends on you never connecting the dots. Never seeing the patterns. Never asking why the same inversions appear across every institution, every religion, every era of history.</p>
<p>This book will be called "conspiracy theory." That term was created by the CIA in 1967 specifically to discredit people who ask questions.</p>
<p>What follows is not doctrine. It is not the final word on anything. It is a collection of patterns, questions, and connections that the reader is encouraged to verify independently. Where claims can be documented, sources are provided. Where claims are speculative, they are labeled as such.</p>
<p>The goal is not to create followers but to awaken seekers. Not to replace one set of authorities with another but to encourage direct relationship with the Creator and direct engagement with truth.</p>
<p>Some of this will resonate immediately. Some will seem absurd at first and make sense later. Some may never land. That's fine. Take what serves your awakening. Question everything else - including this.</p>
<p>The signal has been broadcasting since the beginning. The receiver can be restored. The veil can be lifted.</p>
<p class="highlight">What happens next is between you and the Most High.</p>` },
  
  { id: "note-on-name", title: "A Note on the Name", content: `<p class="italic">Scripture references from the Eth Cepher, which restores the Hebrew names</p>
<p>To those who believe this book blasphemes the Messiah by questioning the name "Jesus Christ":</p>
<p>This book does not deny the Messiah. This book exposes <strong>a deception</strong> that has been operating for centuries.</p>
<p>"Jesus Christ" was not his name. It could not have been. The letter "J" did not exist in any language until approximately 1524. The Messiah walked the earth 1,500 years before the sound "Jee-zus" was ever spoken by anyone, anywhere.</p>
<p>His name was <strong>Yahusha</strong> - meaning "Yahuah is salvation." The Father's name is embedded in the Son's name. That connection was intentional. <strong>That connection was severed when the name was changed.</strong></p>
<p>The Father's name - <strong>Yahuah</strong> - appears over 6,800 times in the Hebrew scriptures. It was replaced with "LORD" in English translations. Not translated. <strong>Replaced.</strong> The name was targeted because the name carries power. The name carries identity. The name carries covenant.</p>` },

  { id: "ch1", title: "Chapter 1: The Council and The Fall", content: `<p class="part-header">PART ONE: THE REBELLION</p>
<p>To understand where we are, we have to go back to where it started. Not human history. Before that. The celestial rebellion that set everything in motion.</p>
<p>Scripture speaks of principalities and powers. Of rulers of darkness. Of spiritual wickedness in high places. Sha'ul (Paul) wrote in Eph'siym (Ephesians) 6:12: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places." These aren't metaphors. They're descriptions of an organized hierarchy that predates humanity itself.</p>
<p>At the top of this hierarchy sits the adversary - Satan, the dragon, the serpent of old. Chizayon (Revelation) 12:9 identifies him: "And the great dragon was cast out, that old serpent, called the Devil, and Satan, which deceives the whole world." But he doesn't rule alone. He has a council. The fallen ones who joined his rebellion. The entities who have operated through human proxies throughout recorded history.</p>
<p>The adversary's strategy has always been imitation. Create a counterfeit of everything the Creator established. A false trinity. A false salvation. A false kingdom.</p>` },

  { id: "ch2", title: "Chapter 2: The 200 Watchers Descend", content: `<p>The Book of Chanoch (Enoch) tells us that 200 Watchers - angels assigned to observe humanity - made a pact on Mount Hermon. They would descend, take human wives, and teach humanity forbidden knowledge.</p>
<p>Chanoch 6:1-6 records: "And it came to pass when the children of men had multiplied that in those days were born unto them beautiful and comely daughters. And the angels, the children of the heaven, saw and lusted after them... And they were in all two hundred; who descended in the days of Yared on the summit of Mount Hermon."</p>
<p>The knowledge they taught included:</p>
<ul>
<li>Weapons and warfare (Aza'zel)</li>
<li>Cosmetics and seduction (Shemyaza)</li>
<li>Sorcery and enchantments</li>
<li>Astrology and celestial signs</li>
<li>The cutting of roots (pharmacy/drugs)</li>
</ul>
<p>This wasn't enlightenment. It was corruption. Knowledge given before humanity was ready for it. Power without wisdom. Technology without ethics.</p>` },

  { id: "ch32d", title: "Chapter 32D: The Entertainment Complex", content: `<p class="part-header">PART NINE-B: THE MODERN SPELLCASTERS</p>
<p>The word "amusement" comes from the Latin "a-muse" - literally <strong>"without thought."</strong> This is not coincidence. The entire entertainment industry - Hollywood, music, sports, gaming, social media - exists to keep you in a state of thoughtlessness. Distracted. Passive. Consuming rather than creating.</p>
<h3>The Unified Control</h3>
<p>Look at who owns entertainment:</p>
<ul>
<li><strong>Six corporations</strong> control 90% of all media consumed in America - film, television, radio, news, publishing</li>
<li><strong>Three record labels</strong> control 80% of the music industry - Universal, Sony, Warner</li>
<li><strong>The same investment firms</strong> - BlackRock, Vanguard, State Street - are major shareholders in all of them</li>
<li><strong>Sports leagues</strong> are owned by the same billionaire class that controls everything else</li>
</ul>
<p>This isn't organic market consolidation. This is coordinated control of what humanity thinks, feels, and desires.</p>
<h3>Hollywood: The Holy Wood</h3>
<p>The term "Hollywood" itself carries occult significance. In ancient druidity, the holly wood was used to make magic wands. The wand directs energy. The screen directs attention. Same principle, different technology.</p>` },

  { id: "ch32e", title: "Chapter 32E: The Revelation of the Method", content: `<p>They tell you what they're doing. They always have. This isn't theory - it's observable pattern.</p>
<h3>The Rule of Disclosure</h3>
<p>Researchers have documented what they call "The Revelation of the Method" - a principle suggesting that the controllers must disclose their plans, however cryptically, before executing them. The term was coined by researcher Michael Hoffman, building on concepts from James Shelby Downard.</p>
<p>Whether this is genuine occult doctrine or merely observed behavior, the pattern holds: major events are often depicted in media before they occur. Symbols of control appear openly in corporate logos, architecture, and entertainment. The mechanism of manipulation is explained in plain sight.</p>
<h3>Karmic Absolution</h3>
<p>One theory holds that disclosure serves as karmic protection. If the victim is warned - even symbolically, even in ways they don't consciously understand - then the victim bears responsibility for not heeding the warning. The perpetrator's spiritual debt is transferred.</p>
<p>This mirrors the legal concept of "informed consent." If you were told (however obscurely) and continued participating, you consented. The liability shifts.</p>` },

  { id: "ch32f", title: "Chapter 32F: The Fracturing of Faith", content: `<p class="part-header">PART NINE-C: THE THOUSAND DENOMINATIONS</p>
<p>If the adversary couldn't destroy the faith outright, he could do something more effective: fracture it into a thousand pieces, each fighting the others while claiming to serve the same God.</p>
<h3>Catholic Means Universal</h3>
<p>The word "Catholic" comes from the Greek "katholikos" - meaning <strong>universal</strong>. This is documented etymology, not interpretation.</p>
<p>The Roman Catholic Church explicitly claims to be the universal church - the one true faith for all humanity. This claim of universality raises questions for some observers in light of prophetic warnings about a coming one-world religion.</p>
<h3>The Protestant Fracturing</h3>
<p>In 1517, Luther nailed his theses to the door and the Reformation began. Protestantism emerged as a correction to Catholic corruption - indulgences, papal authority, extrabiblical tradition.</p>
<p>But what happened next? The Protestants immediately began fighting each other. Lutherans. Calvinists. Anabaptists. Anglicans. Presbyterians. Methodists. Baptists. Pentecostals. Each splitting from the last over doctrine, practice, interpretation.</p>
<p>Today there are an estimated <strong>45,000 Christian denominations</strong> worldwide. Forty-five thousand groups, each claiming to have the truth, many declaring the others heretics.</p>` },

  { id: "ch32g", title: "Chapter 32G: Vatican Rituals and Symbolism", content: `<p>The Vatican is the seat of the "Universal" religion. Its rituals, symbols, and practices deserve examination.</p>
<h3>The Papal Vestments</h3>
<p>The Pope wears the mitre - a tall, split-peaked hat. The official explanation traces it to Byzantine court headgear from the 10th century. But observers have noted its visual resemblance to the open mouth of a fish.</p>
<p>Some researchers have drawn connections to Dagon, the fish deity of the Philistines mentioned in Scripture (1 Samuel 5). Others connect it to Nimrod through various symbolic chains. The mainstream rejects these connections as fabrications from anti-Catholic polemics.</p>
<h3>The Holy Door Ritual</h3>
<p>Every 25 years, the Vatican declares a "Jubilee Year." The Pope ceremonially opens the "Holy Door" of St. Peter's Basilica - a door that remains sealed between jubilees.</p>
<p>At Christmas 2024, Pope Francis knocked five times on the bronze door to open the 2025 Jubilee. Inside was a metal box containing keys, Vatican medals, gold-covered bricks, and documents from the last opening.</p>
<h3>The Cross vs. The Ransom</h3>
<p>Most denominations focus on the crucifixion as central. But consider the emphasis: The cross is the instrument of death. It's the moment of torture, of suffering, of execution. Why do we venerate the murder weapon?</p>
<p>The actual victory was the resurrection - the defeat of death, the payment of the ransom.</p>` },

  { id: "ch40", title: "Chapter 40: The Path Forward", content: `<p class="part-header">PART TWELVE: THE RESTORATION</p>
<p>What do you do when you see?</p>
<p><strong>First:</strong> ground yourself in the original. Study the scriptures with fresh eyes. Learn the names that were erased. Observe the calendar that was substituted. Keep the commandments that were minimized.</p>
<p><strong>Second:</strong> clean the receiver. Detox from the substances that calcify the pineal. Remove the frequencies that interfere. Spend time in nature. Fast. Pray. Listen.</p>
<p><strong>Third:</strong> connect with others. Find fellowship with those who see. Build community. Support each other. The isolation of awakening is temporary - connection is coming.</p>
<p><strong>Fourth:</strong> share what you find. Not by forcing it on others, but by being available when they're ready. The seeds you plant may sprout years later. The conversations you have may echo forward.</p>
<p><strong>Fifth:</strong> build alternatives. The system cannot be reformed - it must be replaced. Build parallel structures. Alternative economies. Independent communities. The infrastructure for what comes next.</p>
<p>The path forward isn't clear in every detail. But the direction is unmistakable: toward truth, toward the Creator, toward restoration of what was corrupted.</p>` },

  { id: "closing", title: "Closing Words", content: `<p>You have journeyed through the veil.</p>
<p>What you do with this information is between you and the Most High. No one can force awakening. No one can walk the path for you. The choice has always been yours.</p>
<p>The signal continues to broadcast. The receiver can be restored. The connection can be reestablished.</p>
<p>The veil is lifting. For those with eyes to see and ears to hear, the truth has never been more accessible.</p>
<p class="highlight">May you find what you're seeking. May the scales fall from your eyes. May you walk in the light of truth.</p>
<p class="highlight">Shalom.</p>` }
];

const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const generateContentOpf = (chapters: {id: string, title: string}[]) => `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">through-the-veil-2026</dc:identifier>
    <dc:title>Through The Veil</dc:title>
    <dc:creator>Jason Andrews</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>DarkWave Trust Layer</dc:publisher>
    <dc:description>A journey beyond the veil of deception into hidden truth. Exploring biblical archaeology, suppressed history, spiritual warfare, and the manipulation of humanity across millennia.</dc:description>
    <dc:subject>Spirituality</dc:subject>
    <dc:subject>Biblical Studies</dc:subject>
    <dc:subject>Alternative History</dc:subject>
    <meta property="dcterms:modified">2026-01-29T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="cover" href="cover.png" media-type="image/png" properties="cover-image"/>
${chapters.map((ch, i) => `    <item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine toc="ncx">
${chapters.map(ch => `    <itemref idref="${ch.id}"/>`).join('\n')}
  </spine>
</package>`;

const generateTocNcx = (chapters: {id: string, title: string}[]) => `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="through-the-veil-2026"/>
  </head>
  <docTitle><text>Through The Veil</text></docTitle>
  <navMap>
${chapters.map((ch, i) => `    <navPoint id="navpoint-${i+1}" playOrder="${i+1}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="${ch.id}.xhtml"/>
    </navPoint>`).join('\n')}
  </navMap>
</ncx>`;

const generateNavXhtml = (chapters: {id: string, title: string}[]) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${chapters.map(ch => `      <li><a href="${ch.id}.xhtml">${ch.title}</a></li>`).join('\n')}
    </ol>
  </nav>
</body>
</html>`;

const styles = `body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.6;
  margin: 1em;
  color: #222;
}
h1 { font-size: 1.8em; margin-bottom: 0.5em; color: #333; }
h2 { font-size: 1.5em; margin-top: 1.5em; color: #444; }
h3 { font-size: 1.2em; margin-top: 1.2em; color: #555; }
p { margin: 0.8em 0; text-align: justify; }
.italic { font-style: italic; }
.highlight { color: #0891b2; font-weight: bold; }
.part-header { color: #7c3aed; font-weight: bold; margin-bottom: 1em; }
blockquote { 
  border-left: 3px solid #666; 
  padding-left: 1em; 
  margin: 1em 0;
  font-style: italic;
  color: #555;
}
ul, ol { margin: 1em 0; padding-left: 2em; }
li { margin: 0.3em 0; }
strong { font-weight: bold; }`;

const generateChapterXhtml = (chapter: {id: string, title: string, content: string}) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content}
</body>
</html>`;

async function generateEpub() {
  const outputPath = path.join(process.cwd(), 'client', 'public', 'assets', 'Through-The-Veil-EBOOK.epub');
  const coverPath = path.join(process.cwd(), 'client', 'public', 'veil-images', 'book-cover.png');
  
  // Ensure assets directory exists
  const assetsDir = path.dirname(outputPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`EPUB created: ${outputPath} (${archive.pointer()} bytes)`);
  });
  
  archive.on('error', (err: Error) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add mimetype first (uncompressed)
  archive.append('application/epub+zip', { name: 'mimetype', store: true });
  
  // Add META-INF
  archive.append(containerXml, { name: 'META-INF/container.xml' });
  
  // Add OEBPS content
  archive.append(generateContentOpf(chapters), { name: 'OEBPS/content.opf' });
  archive.append(generateTocNcx(chapters), { name: 'OEBPS/toc.ncx' });
  archive.append(generateNavXhtml(chapters), { name: 'OEBPS/nav.xhtml' });
  archive.append(styles, { name: 'OEBPS/styles.css' });
  
  // Add cover image if it exists
  if (fs.existsSync(coverPath)) {
    archive.file(coverPath, { name: 'OEBPS/cover.png' });
  }
  
  // Add chapters
  for (const chapter of chapters) {
    archive.append(generateChapterXhtml(chapter), { name: `OEBPS/${chapter.id}.xhtml` });
  }
  
  await archive.finalize();
  console.log('EPUB generation complete!');
}

generateEpub().catch(console.error);
