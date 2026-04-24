import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const inputMd = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-PROFESSIONAL.md');
const outputPdf = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-EBOOK.pdf');
const imagesDir = path.join(process.cwd(), 'attached_assets', 'generated_images');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;
const MARGIN_LEFT = 54;
const MARGIN_RIGHT = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FONT_BODY = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_ITALIC = 'Helvetica-Oblique';

const FONT_SIZE_TITLE = 32;
const FONT_SIZE_SUBTITLE = 18;
const FONT_SIZE_H1 = 20;
const FONT_SIZE_H2 = 17;
const FONT_SIZE_BODY = 14;
const FONT_SIZE_SMALL = 12;
const FONT_SIZE_FOOTNOTE_MARKER = 12;

const LINE_GAP = 3;
const PARAGRAPH_GAP = 8;

const CHAPTER_IMAGES: Record<string, string> = {
  'PART ONE: THE REBELLION': 'veil_lifting_revealing_light.png',
  'CHAPTER 18: THE NAME THAT WAS ERASED': 'hebrew_yhwh_divine_name.png',
  'CHAPTER 27: THE EYE VERSUS THE I': 'eye_to_pineal_transformation.png',
  'CHAPTER 30: THE FREQUENCY WAR': 'black_mirror_smartphone_scrying.png',
  'CHAPTER 36: THE LAYERS OF DECEPTION': 'seven_layers_of_deception.png',
};

interface FootnoteRef {
  number: number;
  term: string;
  termNormalized: string;
}

const footnotes: FootnoteRef[] = [];
const termToFootnotes: Map<string, number[]> = new Map();
let footnoteCounter = 0;
let currentPageNumber = 1;
let inConcordance = false;

function normalizeTerm(term: string): string {
  return term.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function sanitizeText(text: string): string {
  return text
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...');
}

function extractFootnoteRefs(text: string): { cleanText: string; refs: string[] } {
  const refs: string[] = [];
  const pattern = /\*\[→\s*Concordance:\s*([^\]]+)\]\*/g;
  const keyRefPattern = /\*\[Key references?:\s*([^\]]+)\s*→\s*Concordance\]\*/g;
  
  let cleanText = text.replace(keyRefPattern, (match, terms) => {
    const termList = terms.split(',').map((t: string) => t.trim());
    termList.forEach((term: string) => refs.push(term));
    return '';
  });
  
  cleanText = cleanText.replace(pattern, (match, term) => {
    refs.push(term.trim());
    return '';
  });
  
  return { cleanText: cleanText.trim(), refs };
}

function createTitlePage(doc: typeof PDFDocument.prototype) {
  const veilImage = path.join(imagesDir, 'veil_lifting_revealing_light.png');
  if (fs.existsSync(veilImage)) {
    try {
      doc.image(veilImage, MARGIN_LEFT, MARGIN_TOP + 20, {
        width: CONTENT_WIDTH,
        height: 150,
        fit: [CONTENT_WIDTH, 150],
        align: 'center'
      });
      doc.y = MARGIN_TOP + 180;
    } catch (e) {
      doc.y = PAGE_HEIGHT / 3;
    }
  } else {
    doc.y = PAGE_HEIGHT / 3;
  }
  
  doc.moveDown(1);
  
  doc.font(FONT_BOLD)
     .fontSize(FONT_SIZE_TITLE)
     .text('THROUGH THE VEIL', MARGIN_LEFT, doc.y, {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  
  doc.moveDown(1.2);
  
  doc.font(FONT_ITALIC)
     .fontSize(FONT_SIZE_SUBTITLE)
     .text('Unraveling the Tapestry of Lies?', {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  
  doc.moveDown(0.8);
  
  doc.font(FONT_BODY)
     .fontSize(FONT_SIZE_SMALL)
     .text('The Complete Expanded Edition', {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  
  doc.moveDown(1);
  
  doc.font(FONT_BOLD)
     .fontSize(FONT_SIZE_BODY)
     .text('by Jason Andrews', {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  
  doc.moveDown(4);
  
  doc.font(FONT_ITALIC)
     .fontSize(FONT_SIZE_SMALL)
     .text('"This is not doctrine. This is not theory. This is testimony."', {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  
  doc.moveDown(3);
  
  doc.font(FONT_BOLD)
     .fontSize(FONT_SIZE_FOOTNOTE_MARKER)
     .fillColor('#0055aa')
     .text('TAP BLUE NUMBERS TO JUMP TO CONCORDANCE', {
       width: CONTENT_WIDTH,
       align: 'center'
     });
  doc.fillColor('#000000');
}

function parseMarkdown(content: string): { type: string; text: string }[] {
  const lines = content.split('\n');
  const elements: { type: string; text: string }[] = [];
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '---') {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      continue;
    }
    
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      elements.push({ type: 'h1', text: line.replace(/^# /, '') });
      continue;
    }
    
    if (line.startsWith('## ')) {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      elements.push({ type: 'h2', text: line.replace(/^## /, '') });
      continue;
    }
    
    if (line.startsWith('### ')) {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      elements.push({ type: 'h3', text: line.replace(/^### /, '') });
      continue;
    }
    
    if (line === '') {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      continue;
    }
    
    if (line.startsWith('- ')) {
      if (currentParagraph) {
        elements.push({ type: 'paragraph', text: currentParagraph.trim() });
        currentParagraph = '';
      }
      elements.push({ type: 'bullet', text: line.replace(/^- /, '') });
      continue;
    }
    
    currentParagraph += (currentParagraph ? ' ' : '') + line;
  }
  
  if (currentParagraph) {
    elements.push({ type: 'paragraph', text: currentParagraph.trim() });
  }
  
  return elements;
}

function addChapterImage(doc: typeof PDFDocument.prototype, chapterTitle: string) {
  for (const [key, imageName] of Object.entries(CHAPTER_IMAGES)) {
    if (chapterTitle.toUpperCase().includes(key.toUpperCase().split(':')[0])) {
      const imagePath = path.join(imagesDir, imageName);
      if (fs.existsSync(imagePath)) {
        try {
          const imageHeight = 120;
          doc.image(imagePath, MARGIN_LEFT + 40, doc.y, {
            width: CONTENT_WIDTH - 80,
            height: imageHeight,
            fit: [CONTENT_WIDTH - 80, imageHeight],
            align: 'center'
          });
          doc.y += imageHeight + 15;
          return true;
        } catch (e) {
          return false;
        }
      }
    }
  }
  return false;
}

function renderTextWithFootnotes(
  doc: typeof PDFDocument.prototype,
  text: string,
  x: number,
  width: number,
  align: 'left' | 'justify' | 'center' = 'justify'
) {
  const { cleanText, refs } = extractFootnoteRefs(text);
  const sanitized = sanitizeText(cleanText).replace(/\*\*/g, '').replace(/\*/g, '');
  
  if (refs.length === 0) {
    doc.font(FONT_BODY)
       .fontSize(FONT_SIZE_BODY)
       .text(sanitized, x, doc.y, {
         width,
         align,
         lineGap: LINE_GAP,
         paragraphGap: PARAGRAPH_GAP
       });
    return;
  }
  
  doc.font(FONT_BODY)
     .fontSize(FONT_SIZE_BODY)
     .text(sanitized + ' ', x, doc.y, {
       width: width - 50,
       align,
       lineGap: LINE_GAP
     });
  
  for (let i = 0; i < refs.length; i++) {
    footnoteCounter++;
    const footnoteNum = footnoteCounter;
    const term = refs[i];
    const termNorm = normalizeTerm(term);
    
    footnotes.push({
      number: footnoteNum,
      term,
      termNormalized: termNorm
    });
    
    if (!termToFootnotes.has(termNorm)) {
      termToFootnotes.set(termNorm, []);
    }
    termToFootnotes.get(termNorm)!.push(footnoteNum);
    
    const srcAnchor = `fn_src_${footnoteNum}`;
    const destAnchor = `fn_dest_${footnoteNum}`;
    
    const markerX = doc.x;
    const markerY = doc.y;
    
    (doc as any).addNamedDestination(srcAnchor);
    
    const numText = ` [${footnoteNum}]`;
    
    doc.font(FONT_BOLD)
       .fontSize(FONT_SIZE_FOOTNOTE_MARKER)
       .fillColor('#0055aa');
    
    const numWidth = doc.widthOfString(numText);
    
    doc.text(numText, markerX, markerY, {
      link: destAnchor,
      underline: false
    });
    
    doc.fillColor('#000000');
  }
}

function renderElement(
  doc: typeof PDFDocument.prototype, 
  element: { type: string; text: string },
  isFirstContent: boolean
): boolean {
  let text = element.text;
  
  if (text.toUpperCase().includes('COMPREHENSIVE CONCORDANCE')) {
    inConcordance = true;
  }
  
  text = sanitizeText(text);
  
  switch (element.type) {
    case 'h1':
      if (text === 'THROUGH THE VEIL') return isFirstContent;
      if (text.includes('Table of Contents')) return isFirstContent;
      
      const isPart = text.toUpperCase().startsWith('PART ') || 
                     text.toUpperCase().includes('APPENDIX') ||
                     text.toUpperCase().includes('AUTHOR') ||
                     text.toUpperCase().includes('SUPPLEMENTARY');
      
      const isChapter = text.toUpperCase().startsWith('CHAPTER ');
      
      if ((isPart || isChapter) && !isFirstContent) {
        doc.addPage();
        currentPageNumber++;
        doc.moveDown(isPart ? 2 : 1);
      } else if (!isFirstContent && doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 100) {
        doc.addPage();
        currentPageNumber++;
      } else if (!isFirstContent) {
        doc.moveDown(0.8);
      }
      
      doc.font(FONT_BOLD)
         .fontSize(isPart ? FONT_SIZE_H1 + 2 : FONT_SIZE_H1)
         .text(text.replace(/\*\*/g, '').replace(/\*/g, ''), MARGIN_LEFT, doc.y, {
           width: CONTENT_WIDTH,
           align: isPart ? 'center' : 'left',
           lineGap: LINE_GAP
         });
      
      doc.moveDown(isPart ? 1 : 0.5);
      
      if (isPart || isChapter) {
        addChapterImage(doc, text);
      }
      
      return false;
      
    case 'h2':
      doc.moveDown(0.8);
      
      doc.font(FONT_BOLD)
         .fontSize(FONT_SIZE_H2)
         .text(text.replace(/\*\*/g, '').replace(/\*/g, ''), MARGIN_LEFT, doc.y, {
           width: CONTENT_WIDTH,
           align: 'left',
           lineGap: LINE_GAP
         });
      
      doc.moveDown(0.5);
      return isFirstContent;
    
    case 'h3':
      if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 60) {
        doc.addPage();
        currentPageNumber++;
      }
      
      doc.moveDown(0.6);
      
      const h3Text = text.replace(/\*\*/g, '').replace(/\*/g, '');
      const h3Normalized = normalizeTerm(h3Text);
      
      if (inConcordance) {
        const matchingFootnoteNums = termToFootnotes.get(h3Normalized) || [];
        
        for (const fnNum of matchingFootnoteNums) {
          const destAnchor = `fn_dest_${fnNum}`;
          (doc as any).addNamedDestination(destAnchor);
        }
        
        doc.font(FONT_BOLD)
           .fontSize(FONT_SIZE_BODY)
           .fillColor('#000000')
           .text(h3Text, MARGIN_LEFT, doc.y, {
             width: CONTENT_WIDTH,
             align: 'left',
             lineGap: LINE_GAP,
             continued: matchingFootnoteNums.length > 0
           });
        
        if (matchingFootnoteNums.length > 0) {
          doc.font(FONT_BODY)
             .fontSize(FONT_SIZE_SMALL)
             .fillColor('#0055aa');
          
          for (let i = 0; i < matchingFootnoteNums.length; i++) {
            const fnNum = matchingFootnoteNums[i];
            const srcAnchor = `fn_src_${fnNum}`;
            const backText = i === 0 ? ` [back ${fnNum}]` : ` [${fnNum}]`;
            
            doc.text(backText, {
              link: srcAnchor,
              continued: i < matchingFootnoteNums.length - 1
            });
          }
          
          doc.fillColor('#000000');
        }
      } else {
        doc.font(FONT_BOLD)
           .fontSize(FONT_SIZE_BODY)
           .text(h3Text, MARGIN_LEFT, doc.y, {
             width: CONTENT_WIDTH,
             align: 'left',
             lineGap: LINE_GAP
           });
      }
      
      doc.moveDown(0.4);
      return isFirstContent;
      
    case 'paragraph':
      if (!text) return isFirstContent;
      
      if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 60) {
        doc.addPage();
        currentPageNumber++;
      }
      
      if (inConcordance) {
        doc.font(FONT_BODY)
           .fontSize(FONT_SIZE_BODY)
           .text(text.replace(/\*\*/g, '').replace(/\*/g, ''), MARGIN_LEFT, doc.y, {
             width: CONTENT_WIDTH,
             align: 'left',
             lineGap: LINE_GAP,
             paragraphGap: PARAGRAPH_GAP
           });
      } else {
        renderTextWithFootnotes(doc, element.text, MARGIN_LEFT, CONTENT_WIDTH);
      }
      
      doc.moveDown(0.4);
      return false;
      
    case 'bullet':
      if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 40) {
        doc.addPage();
        currentPageNumber++;
      }
      
      doc.font(FONT_BODY)
         .fontSize(FONT_SIZE_BODY)
         .text('  *  ' + text.replace(/\*\*/g, '').replace(/\*/g, ''), MARGIN_LEFT + 10, doc.y, {
           width: CONTENT_WIDTH - 10,
           align: 'left',
           lineGap: LINE_GAP
         });
      
      doc.moveDown(0.2);
      return false;
  }
  
  return isFirstContent;
}

async function generatePDF() {
  console.log('Reading markdown...');
  const markdown = fs.readFileSync(inputMd, 'utf-8');
  
  console.log('Parsing content...');
  const elements = parseMarkdown(markdown);
  
  console.log('Creating PDF with hyperlinked footnotes...');
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margins: {
      top: MARGIN_TOP,
      bottom: MARGIN_BOTTOM,
      left: MARGIN_LEFT,
      right: MARGIN_RIGHT
    },
    info: {
      Title: 'Through The Veil',
      Author: 'Jason Andrews',
      Subject: 'Unraveling the Tapestry of Lies?',
      Keywords: 'spiritual awakening, hidden history, truth seeking, biblical research'
    },
    bufferPages: true,
    autoFirstPage: true
  });
  
  const writeStream = fs.createWriteStream(outputPdf);
  doc.pipe(writeStream);
  
  createTitlePage(doc);
  
  doc.addPage();
  currentPageNumber = 2;
  doc.y = MARGIN_TOP;
  
  let isFirstContent = true;
  
  for (const element of elements) {
    isFirstContent = renderElement(doc, element, isFirstContent);
  }
  
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font(FONT_BODY)
       .fontSize(FONT_SIZE_SMALL)
       .text(String(i + 1), 0, PAGE_HEIGHT - 36, {
         width: PAGE_WIDTH,
         align: 'center'
       });
  }
  
  doc.end();
  
  return new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      const stats = fs.statSync(outputPdf);
      console.log(`\nPDF saved: ${outputPdf}`);
      console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
      console.log(`Pages: ${range.count}`);
      console.log(`Footnote references created: ${footnoteCounter}`);
      console.log(`Unique terms mapped: ${termToFootnotes.size}`);
      
      console.log('\nTerm mappings:');
      termToFootnotes.forEach((nums, term) => {
        console.log(`  "${term}" -> footnotes [${nums.join(', ')}]`);
      });
      
      resolve();
    });
    writeStream.on('error', reject);
  });
}

generatePDF().catch(console.error);
