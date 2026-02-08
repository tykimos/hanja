const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORDS_DIR = '/Users/tykimos/vibecode/hanja/words';
const OUTPUT_FILE = '/Users/tykimos/vibecode/hanja/scripts/extracted-hanja-data.json';

const GRADE_INFO = [
  { grade: '8급', filename: '8급 신출한자 훈음표.pdf', expected: 30 },
  { grade: '7급', filename: '7급 신출한자 훈음표.pdf', expected: 20 },
  { grade: '6급', filename: '6급 신출한자 훈음표.pdf', expected: 20 },
  { grade: '준5급', filename: '준5급 신출한자 훈음표.pdf', expected: 30 },
  { grade: '5급', filename: '5급 신출한자 훈음표.pdf', expected: 50 },
  { grade: '준4급', filename: '준4급 신출한자 훈음표.pdf', expected: 150 },
  { grade: '4급', filename: '4급 신출한자 훈음표.pdf', expected: 300 },
  { grade: '준3급', filename: '준3급 신출한자 훈음표.pdf', expected: 300 },
  { grade: '3급', filename: '3급 신출한자 훈음표.pdf', expected: 700 },
  { grade: '준2급', filename: '준2급 신출한자 훈음표.pdf', expected: 1000 },
  { grade: '2급', filename: '2급 신출한자 훈음표.pdf', expected: 1000 },
  { grade: '준1급', filename: '준1급 신출한자 훈음표.pdf', expected: 1000 },
  { grade: '1급', filename: '1급 신출한자 훈음표.pdf', expected: 1817 }
];

function extractTextFromPDF(pdfPath) {
  try {
    const result = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return result;
  } catch (error) {
    console.error(`  Error extracting text: ${error.message}`);
    return '';
  }
}

function parseHanjaFromText(text, grade) {
  const entries = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Match patterns:
    // 1. "歌 노래" followed by "가" on same or next line
    // 2. "家집" (no space) followed by "가"

    // Try to match: CJK character + optional space + Korean text
    const hanjaHunMatch = line.match(/^([一-龯㐀-䶵])\s*([가-힣]+)/);

    if (hanjaHunMatch) {
      const [_, hanja, hun] = hanjaHunMatch;

      // Look for eum: could be on same line after whitespace, or on next line
      let eum = null;

      // Check rest of current line
      const restOfLine = line.substring(hanjaHunMatch[0].length).trim();
      const eumMatch = restOfLine.match(/^([가-힣]+)$/);
      if (eumMatch) {
        eum = eumMatch[1];
      } else if (i + 1 < lines.length) {
        // Check next line
        const nextLine = lines[i + 1].trim();
        const nextEumMatch = nextLine.match(/^([가-힣]+)$/);
        if (nextEumMatch && nextEumMatch[1].length <= 3) {
          eum = nextEumMatch[1];
          i++; // Skip next line since we consumed it
        }
      }

      if (eum) {
        entries.push({
          hanja: hanja,
          hun: hun,
          eum: eum,
          grade: grade,
          fullHunEum: `${hun} ${eum}`
        });
      }
    }
  }

  return entries;
}

function main() {
  console.log('='.repeat(60));
  console.log('Starting Hanja PDF extraction with pdftotext...');
  console.log('='.repeat(60));
  console.log();

  const allEntries = [];
  let successCount = 0;
  let failCount = 0;

  for (const gradeInfo of GRADE_INFO) {
    const pdfPath = path.join(WORDS_DIR, gradeInfo.filename);

    console.log(`Processing ${gradeInfo.grade}...`);
    console.log(`  File: ${gradeInfo.filename}`);

    try {
      const text = extractTextFromPDF(pdfPath);
      const entries = parseHanjaFromText(text, gradeInfo.grade);

      console.log(`  Extracted: ${entries.length} characters`);
      console.log(`  Expected: ${gradeInfo.expected} characters`);

      if (entries.length > 0) {
        // Show first 3 as sample
        console.log(`  Sample entries:`);
        entries.slice(0, 3).forEach(e => {
          console.log(`    ${e.hanja} ${e.hun} ${e.eum}`);
        });
      }

      if (entries.length === gradeInfo.expected) {
        console.log(`  ✓ Count verified`);
        successCount++;
      } else if (entries.length > 0) {
        console.log(`  ⚠️  COUNT MISMATCH (diff: ${entries.length - gradeInfo.expected})`);
        successCount++;
      } else {
        console.log(`  ❌ No entries extracted`);
        failCount++;
      }

      allEntries.push(...entries);

    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      failCount++;
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('=== EXTRACTION SUMMARY ===');
  console.log('='.repeat(60));
  console.log(`Total characters extracted: ${allEntries.length}`);
  console.log(`Expected total: 6417`);
  console.log(`Files processed successfully: ${successCount}`);
  console.log(`Files failed: ${failCount}`);

  if (allEntries.length !== 6417) {
    console.log(`\n⚠️  TOTAL COUNT MISMATCH!`);
    console.log(`Difference: ${allEntries.length - 6417}`);
  }

  // Save to JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEntries, null, 2), 'utf8');
  console.log(`\n✓ Data saved to: ${OUTPUT_FILE}`);

  // Create summary by grade
  const byGrade = {};
  allEntries.forEach(entry => {
    if (!byGrade[entry.grade]) byGrade[entry.grade] = [];
    byGrade[entry.grade].push(entry);
  });

  console.log();
  console.log('='.repeat(60));
  console.log('=== BY GRADE ===');
  console.log('='.repeat(60));
  GRADE_INFO.forEach(info => {
    const count = byGrade[info.grade]?.length || 0;
    const status = count === info.expected ? '✓' : '⚠️';
    console.log(`${status} ${info.grade}: ${count} chars (expected ${info.expected})`);
  });

  const summaryPath = path.join(path.dirname(OUTPUT_FILE), 'extraction-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    total: allEntries.length,
    expected: 6417,
    byGrade: Object.fromEntries(
      Object.entries(byGrade).map(([grade, entries]) => [grade, entries.length])
    ),
    successCount,
    failCount
  }, null, 2), 'utf8');
  console.log(`\n✓ Summary saved to: ${summaryPath}`);

  console.log();
  console.log('='.repeat(60));
  console.log('Extraction complete!');
  console.log('='.repeat(60));
}

main();
