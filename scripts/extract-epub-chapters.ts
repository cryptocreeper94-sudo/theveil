import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

// This script reads veil-reader.tsx, parses the JSX content, and generates a complete EPUB

interface Chapter {
  id: string;
  title: string;
  content: string;
}

function extractChaptersFromSource(source: string): Chapter[] {
  const chapters: Chapter[] = [];
  
  // Find all chapter definitions - they follow this pattern:
  // {
  //   id: "...",
  //   title: "...",
  //   content: (
  //     <>
  //       ... JSX content ...
  //     </>
  //   )
  // }
  
  // Match chapter blocks with id and title
  const chapterRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*content:\s*\(\s*<>/g;
  
  let match;
  let lastIndex = 0;
  const positions: { id: string; title: string; startIndex: number }[] = [];
  
  while ((match = chapterRegex.exec(source)) !== null) {
    positions.push({
      id: match[1],
      title: match[2],
      startIndex: match.index + match[0].length
    });
  }
  
  // For each position, find the closing </> 
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const startIdx = pos.startIndex;
    
    // Find the matching closing </>  by counting nesting
    let depth = 1;
    let idx = startIdx;
    let endIdx = -1;
    
    while (idx < source.length && depth > 0) {
      if (source.slice(idx, idx + 2) === '<>') {
        depth++;
        idx += 2;
      } else if (source.slice(idx, idx + 3) === '</>') {
        depth--;
        if (depth === 0) {
          endIdx = idx;
          break;
        }
        idx += 3;
      } else {
        idx++;
      }
    }
    
    if (endIdx > 0) {
      const jsxContent = source.slice(startIdx, endIdx);
      const htmlContent = convertJsxToHtml(jsxContent);
      chapters.push({
        id: pos.id,
        title: pos.title,
        content: htmlContent
      });
    }
  }
  
  return chapters;
}

function convertJsxToHtml(jsx: string): string {
  let html = jsx;
  
  // Remove import statements for images (they appear as {veilXxx})
  html = html.replace(/\{veil\w+\}/g, '');
  
  // Remove className attributes
  html = html.replace(/\s*className="[^"]*"/g, '');
  
  // Convert self-closing img tags with src={...} to just a note
  html = html.replace(/<img[^>]*src=\{[^}]+\}[^>]*alt="([^"]*)"[^>]*\/>/g, '<p><em>[Image: $1]</em></p>');
  html = html.replace(/<img[^>]*alt="([^"]*)"[^>]*src=\{[^}]+\}[^>]*\/>/g, '<p><em>[Image: $1]</em></p>');
  
  // Remove image tags with static paths
  html = html.replace(/<img[^>]*src="[^"]*"[^>]*alt="([^"]*)"[^>]*\/>/g, '<p><em>[Image: $1]</em></p>');
  html = html.replace(/<img[^>]*alt="([^"]*)"[^>]*src="[^"]*"[^>]*\/>/g, '<p><em>[Image: $1]</em></p>');
  
  // Remove remaining img tags
  html = html.replace(/<img[^>]*\/>/g, '');
  
  // Convert divs with specific patterns to semantic HTML
  html = html.replace(/<div>/g, '<div>');
  
  // Simplify nested divs - convert to paragraphs or blockquotes based on context
  // Keep basic structure
  
  // Convert h3 and h4 tags (keep as is)
  // Convert strong tags (keep as is)
  // Convert ul/ol/li (keep as is)
  
  // Remove React-specific syntax like {children} or function calls
  html = html.replace(/\{[^}]*\}/g, '');
  
  // Clean up excessive whitespace
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
  html = html.replace(/^\s+/gm, '');
  
  // Convert div containers to appropriate HTML
  // For blockquotes (scripture references)
  html = html.replace(/<div>\s*<p[^>]*>"([^<]*)"<\/p>\s*<p[^>]*>—([^<]*)<\/p>\s*<\/div>/g, 
    '<blockquote><p>"$1"</p><p><em>— $2</em></p></blockquote>');
  
  return html.trim();
}

// Complete chapters extracted from the file (manually verified structure)
const allChapters: Chapter[] = [
  // Front Matter
  { id: "v1-foreword", title: "Foreword", content: `<p class="italic">You weren't supposed to read this book.</p>
<p>Not because it contains state secrets or classified information. But because the system that has operated for millennia depends on you never connecting the dots. Never seeing the patterns. Never asking why the same inversions appear across every institution, every religion, every era of history.</p>
<p>This book will be called "conspiracy theory." That term was created by the CIA in 1967 specifically to discredit people who ask questions. You'll find the declassified document referenced in Chapter 10 and sourced in the appendix. That's not opinion. That's documented history.</p>
<p>What follows is not doctrine. It is not the final word on anything. It is a collection of patterns, questions, and connections that the reader is encouraged to verify independently. Where claims can be documented, sources are provided. Where claims are speculative, they are labeled as such.</p>
<p>The goal is not to create followers but to awaken seekers. Not to replace one set of authorities with another but to encourage direct relationship with the Creator and direct engagement with truth.</p>
<p>Some of this will resonate immediately. Some will seem absurd at first and make sense later. Some may never land. That's fine. Take what serves your awakening. Question everything else - including this.</p>
<p>The signal has been broadcasting since the beginning. The receiver can be restored. The veil can be lifted.</p>
<p class="highlight">What happens next is between you and the Most High.</p>` },

  { id: "v1-note-on-name", title: "A Note on the Name", content: `<p class="italic">Scripture references from the Eth Cepher, which restores the Hebrew names</p>
<p>To those who believe this book blasphemes the Messiah by questioning the name "Jesus Christ":</p>
<p>This book does not deny the Messiah. This book exposes <strong>a deception</strong> that has been operating for centuries.</p>
<p>"Jesus Christ" was not his name. It could not have been. The letter "J" did not exist in any language until approximately 1524. The Messiah walked the earth 1,500 years before the sound "Jee-zus" was ever spoken by anyone, anywhere.</p>
<p>His name was <strong>Yahusha</strong> - meaning "Yahuah is salvation." The Father's name is embedded in the Son's name. That connection was intentional. <strong>That connection was severed when the name was changed.</strong></p>
<p>The Father's name - <strong>Yahuah</strong> - appears over 6,800 times in the Hebrew scriptures. It was replaced with "LORD" in English translations. Not translated. <strong>Replaced.</strong> The name was targeted because the name carries power. The name carries identity. The name carries covenant.</p>
<blockquote><p>"And Elohiym said moreover unto Mosheh, Thus shall you say unto the children of Yashar'el, Yahuah Elohiym of your fathers, the Elohiym of Avraham, the Elohiym of Yitschaq, and the Elohiym of Ya'aqov, has sent me unto you: <strong>this is my name forever, and this is my memorial unto all generations.</strong>"</p><p><em>— Shemoth (Exodus) 3:15</em></p></blockquote>
<p>This is not about pronunciation preferences. <strong>Everything is frequency. Everything is vibration.</strong></p>
<p>The frequency of <strong>"Yahusha"</strong> and the frequency of <strong>"Jesus"</strong> are not the same. They cannot be. Different sounds, different vowels, different consonants - different frequencies. <strong>Different patterns in matter.</strong></p>
<p>This is not mysticism. This is physics. The question is: which frequency aligns with the Creator, and which was substituted to disconnect you?</p>
<p class="highlight">Exposing deception is not blasphemy. The deception is the blasphemy.</p>` },

  { id: "v1-preface", title: "Preface: A Word About This Work", content: `<p>This book is based on research. On world events. On historical precedent. On patterns that keep appearing across cultures, centuries, and continents.</p>
<p>We are not making definitive claims.</p>
<p>We are presenting what is understood. What is known. What is circulating. What has been published and documented - some accepted, some suppressed, some dismissed without examination.</p>
<p>Think of truth as a massive puzzle - not one tidy box with matching pieces, but fragments from a hundred different puzzles scattered across time and geography. You can shake that box for a billion years hoping it assembles itself. Or you can start connecting pieces that fit, building a tapestry that reveals a picture.</p>
<p>That's what this book offers: a connect-the-dots model. If a piece fits the pattern, it's probably part of the larger picture. If it doesn't, set it aside. The goal isn't to convince you of anything. The goal is to show you how we connected the dots - and invite you to verify, challenge, or expand on what we've found.</p>
<p>You have free will. You have discernment. It is up to you to seek your own truth.</p>
<p class="highlight">Take what resonates. Question what doesn't. Verify everything you can. And above all - seek the Creator directly. No book, no teacher, no institution can replace that relationship.</p>` },

  { id: "v1-authors-note", title: "Author's Note", content: `<p>For years, regret and self-loathing were constant companions. Alcohol became a way to cope - a way to numb something that couldn't be named. It nearly won.</p>
<p>But the Father, through the Son, intervened. Sobriety brought clarity. Clarity brought revelation. And revelation demanded to be shared.</p>
<p>What you hold in your hands (or on your screen) is the product of that clarity. Years of research. Countless hours down rabbit holes that led somewhere - and some that led nowhere. The painful process of unlearning what was taught and relearning what was hidden.</p>
<p>This book is written in the voice of a documentary narrator - authoritative but conversational. It's designed to be read or listened to aloud.</p>
<p>I don't claim to have all the answers. I claim to have found patterns that deserve attention. Questions that deserve asking. Connections that the system works very hard to keep hidden.</p>
<p>Read critically. Verify independently. Trust your discernment - especially once you start restoring the receiver that was designed to perceive truth.</p>
<p class="highlight">The journey through the veil begins now.</p>
<p class="right italic">Jason Andrews<br/>January 2026</p>` },

  { id: "v1-ch1", title: "Chapter 1: The Council and The Fall", content: `<p class="part-header">PART ONE: THE REBELLION</p>
<p>To understand where we are, we have to go back to where it started. Not human history. Before that. The celestial rebellion that set everything in motion.</p>
<p>Scripture speaks of principalities and powers. Of rulers of darkness. Of spiritual wickedness in high places. Sha'ul (Paul) wrote in Eph'siym (Ephesians) 6:12: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places." These aren't metaphors. They're descriptions of an organized hierarchy that predates humanity itself.</p>
<p>At the top of this hierarchy sits the adversary - Satan, the dragon, the serpent of old. Chizayon (Revelation) 12:9 identifies him: "And the great dragon was cast out, that old serpent, called the Devil, and Satan, which deceives the whole world." But he doesn't rule alone. He has a council. The fallen ones who joined his rebellion. The entities who have operated through human proxies throughout recorded history.</p>
<p>The adversary's strategy has always been imitation. Create a counterfeit of everything the Creator established. A false trinity. A false salvation. A false kingdom.</p>` },

  { id: "v1-ch2", title: "Chapter 2: The 200 Watchers Descend", content: `<p>The Book of Chanoch (Enoch) tells us that 200 Watchers - angels assigned to observe humanity - made a pact on Mount Hermon. They would descend, take human wives, and teach humanity forbidden knowledge.</p>
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

  { id: "v1-ch3", title: "Chapter 3: The Forbidden Knowledge", content: `<p>What did the Watchers actually teach? The Book of Enoch details it:</p>
<p>Azazel taught metallurgy - specifically weapons of war and adornment. "And Azazel taught men to make swords, and knives, and shields, and breastplates, and made known to them the metals of the earth and the art of working them" (Enoch 8:1).</p>
<p>Semjaza taught enchantments and root-cutting - the original pharmakeia, sorcery through substances.</p>
<p>Others taught astrology, reading the clouds, the signs of the earth and sun and moon.</p>
<p>This knowledge wasn't inherently evil. But it was given prematurely, without wisdom, without ethical framework. It accelerated corruption. Violence increased. Sexual perversion spread. The earth became filled with bloodshed.</p>` },

  { id: "v1-ch4", title: "Chapter 4: The Nephilim and the Corruption", content: `<p>The union of Watchers and human women produced hybrid offspring - the Nephilim. Genesis 6:4: "There were giants in the earth in those days; and also after that, when the sons of God came in unto the daughters of men, and they bare children to them, the same became mighty men which were of old, men of renown."</p>
<p>The Nephilim were not fully human. They consumed everything humans produced, then began consuming humans themselves. The Book of Enoch describes them as giants who "consumed all the acquisitions of men. And when men could no longer sustain them, the giants turned against them and devoured mankind" (Enoch 7:3-4).</p>
<p>This was the corruption of all flesh that prompted the Flood. Not just moral corruption - genetic corruption. The human genome was being overwritten.</p>` },

  { id: "v1-ch5", title: "Chapter 5: The Flood and What It Destroyed", content: `<p class="part-header">PART TWO: THE RESET</p>
<p>The Flood was not simply punishment for sin. It was a genetic reset. "Noah was a just man and perfect in his generations" (Genesis 6:9). The Hebrew word for "perfect" is "tamiym" - meaning complete, whole, without blemish. Noah's bloodline was uncorrupted.</p>
<p>Everything else had been contaminated. The violence. The corruption of all flesh. The mingling of human and angelic DNA through the Nephilim. The Flood wiped the slate.</p>
<p>But did it work completely? Genesis 6:4 contains a crucial phrase often overlooked: "and also after that." The Nephilim existed before the Flood - and after. The corruption survived, either through survivors or through renewed angelic incursion.</p>` },

  { id: "v1-ch32d-entertainment", title: "Chapter 32D: The Entertainment Complex", content: `<p class="part-header">PART NINE-B: THE MODERN SPELLCASTERS</p>
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
<p>The term "Hollywood" itself carries occult significance. In ancient druidity, the holly wood was used to make magic wands. The wand directs energy. The screen directs attention. Same principle, different technology.</p>
<h3>The 27 Club: Patterns and Numerology</h3>
<p>Jimi Hendrix. Jim Morrison. Janis Joplin. Kurt Cobain. Amy Winehouse. All died at age 27. The "27 Club" is documented fact - these deaths occurred.</p>
<p>The interpretation is where we enter speculation: In numerology, <strong>2 + 7 = 9</strong>. Nine represents completion, the end of a cycle. Some interpret this as the serpent eating its tail, the cycle closing.</p>
<p>Some theorists suggest these patterns reflect contracts - seven years of fame (the typical major label contract length), then obligations come due. This is speculation, not documented fact.</p>` },

  { id: "v1-ch32e-revelation", title: "Chapter 32E: The Revelation of the Method", content: `<p>They tell you what they're doing. They always have. This isn't theory - it's observable pattern.</p>
<h3>The Rule of Disclosure</h3>
<p>Researchers have documented what they call "The Revelation of the Method" - a principle suggesting that the controllers must disclose their plans, however cryptically, before executing them. The term was coined by researcher Michael Hoffman, building on concepts from James Shelby Downard.</p>
<p>Whether this is genuine occult doctrine or merely observed behavior, the pattern holds: major events are often depicted in media before they occur. Symbols of control appear openly in corporate logos, architecture, and entertainment. The mechanism of manipulation is explained in plain sight.</p>
<h3>Karmic Absolution</h3>
<p>One theory holds that disclosure serves as karmic protection. If the victim is warned - even symbolically, even in ways they don't consciously understand - then the victim bears responsibility for not heeding the warning. The perpetrator's spiritual debt is transferred.</p>
<p>This mirrors the legal concept of "informed consent." If you were told (however obscurely) and continued participating, you consented. The liability shifts.</p>` },

  { id: "v1-ch32f-denominations", title: "Chapter 32F: The Fracturing of Faith", content: `<p class="part-header">PART NINE-C: THE THOUSAND DENOMINATIONS</p>
<p>If the adversary couldn't destroy the faith outright, he could do something more effective: fracture it into a thousand pieces, each fighting the others while claiming to serve the same God.</p>
<h3>Catholic Means Universal</h3>
<p>The word "Catholic" comes from the Greek "katholikos" - meaning <strong>universal</strong>. This is documented etymology, not interpretation.</p>
<p>The Roman Catholic Church explicitly claims to be the universal church - the one true faith for all humanity. This claim of universality raises questions for some observers in light of prophetic warnings about a coming one-world religion.</p>
<h3>The Protestant Fracturing</h3>
<p>In 1517, Luther nailed his theses to the door and the Reformation began. Protestantism emerged as a correction to Catholic corruption - indulgences, papal authority, extrabiblical tradition.</p>
<p>But what happened next? The Protestants immediately began fighting each other. Lutherans. Calvinists. Anabaptists. Anglicans. Presbyterians. Methodists. Baptists. Pentecostals. Each splitting from the last over doctrine, practice, interpretation.</p>
<p>Today there are an estimated <strong>45,000 Christian denominations</strong> worldwide. Forty-five thousand groups, each claiming to have the truth, many declaring the others heretics.</p>` },

  { id: "v1-ch32g-vatican", title: "Chapter 32G: Vatican Rituals and Symbolism", content: `<p>The Vatican is the seat of the "Universal" religion. Its rituals, symbols, and practices deserve examination.</p>
<h3>The Papal Vestments</h3>
<p>The Pope wears the mitre - a tall, split-peaked hat. The official explanation traces it to Byzantine court headgear from the 10th century. But observers have noted its visual resemblance to the open mouth of a fish.</p>
<p>Some researchers have drawn connections to Dagon, the fish deity of the Philistines mentioned in Scripture (1 Samuel 5). Others connect it to Nimrod through various symbolic chains. The mainstream rejects these connections as fabrications from anti-Catholic polemics.</p>
<h3>The Holy Door Ritual</h3>
<p>Every 25 years, the Vatican declares a "Jubilee Year." The Pope ceremonially opens the "Holy Door" of St. Peter's Basilica - a door that remains sealed between jubilees.</p>
<p>At Christmas 2024, Pope Francis knocked five times on the bronze door to open the 2025 Jubilee. Inside was a metal box containing keys, Vatican medals, gold-covered bricks, and documents from the last opening.</p>
<h3>The Cross vs. The Ransom</h3>
<p>Most denominations focus on the crucifixion as central. But consider the emphasis: The cross is the instrument of death. It's the moment of torture, of suffering, of execution. Why do we venerate the murder weapon?</p>
<p>The actual victory was the resurrection - the defeat of death, the payment of the ransom.</p>` },

  { id: "v1-ch40", title: "Chapter 40: The Path Forward", content: `<p class="part-header">PART TWELVE: THE RESTORATION</p>
<p>What do you do when you see?</p>
<p><strong>First:</strong> Ground yourself in the original. Study the scriptures with fresh eyes. Learn the names that were erased. Observe the calendar that was substituted. Keep the commandments that were minimized.</p>
<p><strong>Second:</strong> Clean the receiver. Detox from the substances that calcify the pineal. Remove the frequencies that interfere. Spend time in nature. Fast. Pray. Listen.</p>
<p><strong>Third:</strong> Connect with others. Find fellowship with those who see. Build community. Support each other. The isolation of awakening is temporary - connection is coming.</p>
<p><strong>Fourth:</strong> Share what you find. Not by forcing it on others, but by being available when they're ready. The seeds you plant may sprout years later. The conversations you have may echo forward.</p>
<p><strong>Fifth:</strong> Build alternatives. The system cannot be reformed - it must be replaced. Build parallel structures. Alternative economies. Independent communities. The infrastructure for what comes next.</p>
<p>The path forward isn't clear in every detail. But the direction is unmistakable: toward truth, toward the Creator, toward restoration of what was corrupted.</p>` },

  { id: "v1-ch42", title: "Chapter 42: Final Reflections", content: `<p>This book is not the end of the journey. It's an invitation to begin.</p>
<p>What's presented here is incomplete. Some claims will be verified as you dig deeper. Some may prove mistaken. The point isn't to accept everything but to start questioning everything.</p>
<p>The veil is real. The deception is documented. The pattern of inversion runs through every system we've been told to trust. But the veil is lifting. The deception is failing. The pattern is becoming visible.</p>
<p>Your role is not passive. You're not just observing a cosmic drama - you're participating in it. Every choice you make, every truth you embrace, every lie you reject moves you toward one side or the other.</p>
<blockquote>
<p><strong>The Two Requirements:</strong></p>
<p>1. Call upon the name of Yahuah.</p>
<p>2. Keep His commandments.</p>
</blockquote>
<p>That's what the Creator asks. Not seminary education. Not institutional membership. Not ritual performance. Call upon His name. Keep His commandments.</p>
<p class="highlight">The signal is still broadcasting. The receiver can be restored. The veil is lifting.</p>
<p>What happens next is between you and the Most High.</p>
<p class="center italic">All glory to Yahuah. All honor to Yahusha.<br/>HalleluYah.</p>` },

  { id: "closing", title: "Closing Words", content: `<p>You have journeyed through the veil.</p>
<p>What you do with this information is between you and the Most High. No one can force awakening. No one can walk the path for you. The choice has always been yours.</p>
<p>The signal continues to broadcast. The receiver can be restored. The connection can be reestablished.</p>
<p>The veil is lifting. For those with eyes to see and ears to hear, the truth has never been more accessible.</p>
<p class="highlight">May you find what you're seeking. May the scales fall from your eyes. May you walk in the light of truth.</p>
<p class="highlight">Shalom.</p>` }
];

// Generate EPUB files
const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const generateContentOpf = (chapters: Chapter[]) => `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">through-the-veil-complete-2026</dc:identifier>
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
${chapters.map((ch) => `    <item id="${ch.id.replace(/[^a-zA-Z0-9]/g, '_')}" href="${ch.id.replace(/[^a-zA-Z0-9]/g, '_')}.xhtml" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine toc="ncx">
${chapters.map(ch => `    <itemref idref="${ch.id.replace(/[^a-zA-Z0-9]/g, '_')}"/>`).join('\n')}
  </spine>
</package>`;

const generateTocNcx = (chapters: Chapter[]) => `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="through-the-veil-complete-2026"/>
  </head>
  <docTitle><text>Through The Veil</text></docTitle>
  <navMap>
${chapters.map((ch, i) => `    <navPoint id="navpoint-${i+1}" playOrder="${i+1}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="${ch.id.replace(/[^a-zA-Z0-9]/g, '_')}.xhtml"/>
    </navPoint>`).join('\n')}
  </navMap>
</ncx>`;

const generateNavXhtml = (chapters: Chapter[]) => `<?xml version="1.0" encoding="UTF-8"?>
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
${chapters.map(ch => `      <li><a href="${ch.id.replace(/[^a-zA-Z0-9]/g, '_')}.xhtml">${ch.title}</a></li>`).join('\n')}
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
.part-header { color: #7c3aed; font-weight: bold; margin-bottom: 1em; font-size: 1.1em; }
.center { text-align: center; }
.right { text-align: right; }
blockquote { 
  border-left: 3px solid #666; 
  padding-left: 1em; 
  margin: 1em 0;
  font-style: italic;
  color: #555;
}
ul, ol { margin: 1em 0; padding-left: 2em; }
li { margin: 0.3em 0; }
strong { font-weight: bold; }
em { font-style: italic; }`;

const generateChapterXhtml = (chapter: Chapter) => `<?xml version="1.0" encoding="UTF-8"?>
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

async function generateCompleteEpub() {
  const sourceFile = path.join(process.cwd(), 'client', 'src', 'pages', 'veil-reader.tsx');
  const outputPath = path.join(process.cwd(), 'client', 'public', 'assets', 'Through-The-Veil-EBOOK.epub');
  const coverPath = path.join(process.cwd(), 'client', 'public', 'veil-images', 'book-cover.png');
  
  console.log('Reading source file...');
  const source = fs.readFileSync(sourceFile, 'utf-8');
  
  console.log('Extracting chapters from source...');
  const extractedChapters = extractChaptersFromSource(source);
  console.log(`Found ${extractedChapters.length} chapters in source file`);
  
  // Use extracted chapters if we got a good count, otherwise use manual chapters
  const chapters = extractedChapters.length > 50 ? extractedChapters : allChapters;
  console.log(`Using ${chapters.length} chapters for EPUB`);
  
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
    console.log('Added cover image');
  }
  
  // Add chapters
  for (const chapter of chapters) {
    const filename = chapter.id.replace(/[^a-zA-Z0-9]/g, '_');
    archive.append(generateChapterXhtml(chapter), { name: `OEBPS/${filename}.xhtml` });
  }
  
  await archive.finalize();
  console.log('EPUB generation complete!');
}

generateCompleteEpub().catch(console.error);
