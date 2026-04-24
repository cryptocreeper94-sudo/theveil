import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'attached_assets', 'Pasted-Through-The-Veil-TABLE-OF-CONTENTS-Author-s-Note-Dedica_1768076903602.txt');
const outputFile = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-Ebook.pdf');

let content = fs.readFileSync(inputFile, 'utf-8');

content = content
  .replace(/‑/g, '-')
  .replace(/—/g, ' - ')
  .replace(/–/g, '-')
  .replace(/'/g, "'")
  .replace(/'/g, "'")
  .replace(/"/g, '"')
  .replace(/"/g, '"')
  .replace(/…/g, '...')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n');

const doc = new PDFDocument({
  size: [360, 576],
  margins: { top: 40, bottom: 50, left: 36, right: 36 },
  info: {
    Title: 'Through The Veil',
    Author: 'Anonymous'
  }
});

const writeStream = fs.createWriteStream(outputFile);
doc.pipe(writeStream);

const HEADINGS = [
  'TABLE OF CONTENTS',
  "AUTHOR'S NOTE",
  'DEDICATION',
  'FOREWORD',
  'INTRODUCTION',
  'INTERLUDE I',
  'INTERLUDE II',
  'CHAPTER 1',
  'CHAPTER 2',
  'CHAPTER 3',
  'CHAPTER 4',
  'CHAPTER 5',
  'CHAPTER 6',
  'CHAPTER 7',
  'CHAPTER 8',
  'CHAPTER 9',
  'CHAPTER 10',
  'CHAPTER 11',
  'CHAPTER 12',
  'CHAPTER 13',
  'APPENDIX',
  'MESSAGE TO THE READER',
  'ACKNOWLEDGMENTS',
  'AUTHOR BIO'
];

function isHeading(line: string): boolean {
  const upper = line.trim().toUpperCase();
  for (const h of HEADINGS) {
    if (upper.startsWith(h)) return true;
  }
  return false;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

doc.moveDown(8);
doc.fontSize(26).font('Helvetica-Bold').text('Through The Veil', { align: 'center' });
doc.moveDown(1.5);
doc.fontSize(12).font('Helvetica-Oblique').text('A Journey Beyond the Illusion', { align: 'center' });
doc.addPage();

const paragraphs = content.split(/\n\n+/);
let isFirst = true;
let isTOC = false;

for (const para of paragraphs) {
  const trimmed = para.trim();
  
  if (!trimmed) continue;
  if (trimmed === 'Through The Veil') continue;
  
  const firstLine = trimmed.split('\n')[0].trim();
  const upperFirst = firstLine.toUpperCase();
  
  if (upperFirst === 'TABLE OF CONTENTS') {
    isTOC = true;
    isFirst = false;
    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold').text('TABLE OF CONTENTS', { align: 'center' });
    doc.moveDown(1.5);
    
    const tocLines = trimmed.split('\n').slice(1);
    for (const line of tocLines) {
      const l = line.trim();
      if (l) {
        doc.fontSize(9).font('Helvetica').text(l, { align: 'left' });
        doc.moveDown(0.15);
      }
    }
    continue;
  }
  
  if (isHeading(firstLine) && !isTOC) {
    if (!isFirst) {
      doc.addPage();
    }
    isFirst = false;
    
    doc.moveDown(3);
    
    let displayTitle = firstLine;
    if (firstLine.includes(' - ')) {
      const parts = firstLine.split(' - ');
      if (parts.length === 2) {
        doc.fontSize(11).font('Helvetica').text(parts[0].trim(), { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(18).font('Helvetica-Bold').text(parts[1].trim(), { align: 'center' });
      } else {
        doc.fontSize(18).font('Helvetica-Bold').text(displayTitle, { align: 'center' });
      }
    } else {
      doc.fontSize(18).font('Helvetica-Bold').text(displayTitle, { align: 'center' });
    }
    
    doc.moveDown(2);
    
    const bodyLines = trimmed.split('\n').slice(1).join('\n').trim();
    if (bodyLines) {
      const bodyParas = bodyLines.split(/\n\n+/);
      for (const bp of bodyParas) {
        const cleaned = cleanText(bp);
        if (cleaned) {
          doc.fontSize(10).font('Helvetica').text(cleaned, { 
            align: 'justify',
            lineGap: 2.5,
            width: 288
          });
          doc.moveDown(0.6);
        }
      }
    }
    continue;
  }
  
  if (isTOC && isHeading(firstLine)) {
    isTOC = false;
    doc.addPage();
    
    doc.moveDown(3);
    
    if (firstLine.includes(' - ')) {
      const parts = firstLine.split(' - ');
      if (parts.length === 2) {
        doc.fontSize(11).font('Helvetica').text(parts[0].trim(), { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(18).font('Helvetica-Bold').text(parts[1].trim(), { align: 'center' });
      } else {
        doc.fontSize(18).font('Helvetica-Bold').text(firstLine, { align: 'center' });
      }
    } else {
      doc.fontSize(18).font('Helvetica-Bold').text(firstLine, { align: 'center' });
    }
    
    doc.moveDown(2);
    
    const bodyLines = trimmed.split('\n').slice(1).join('\n').trim();
    if (bodyLines) {
      const cleaned = cleanText(bodyLines);
      if (cleaned) {
        doc.fontSize(10).font('Helvetica').text(cleaned, { 
          align: 'justify',
          lineGap: 2.5,
          width: 288
        });
        doc.moveDown(0.6);
      }
    }
    continue;
  }
  
  if (isTOC) continue;
  
  const cleaned = cleanText(trimmed);
  if (cleaned) {
    doc.fontSize(10).font('Helvetica').text(cleaned, { 
      align: 'justify',
      lineGap: 2.5,
      width: 288
    });
    doc.moveDown(0.6);
  }
}

doc.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputFile);
  console.log(`PDF created: ${outputFile}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
});
