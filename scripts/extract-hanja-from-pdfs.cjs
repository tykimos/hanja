const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const WORDS_DIR = '/Users/tykimos/vibecode/hanja/words';
const OUTPUT_FILE = '/Users/tykimos/vibecode/hanja/scripts/extracted-hanja-data.json';

const GRADE_INFO = [
  { grade: '8급', filename: '8급 신출한자 훈음표.pdf', expected: 30, cumulative: 30 },
  { grade: '7급', filename: '7급 신출한자 훈음표.pdf', expected: 20, cumulative: 50 },
  { grade: '6급', filename: '6급 신출한자 훈음표.pdf', expected: 20, cumulative: 70 },
  { grade: '준5급', filename: '준5급 신출한자 훈음표.pdf', expected: 30, cumulative: 100 },
  { grade: '5급', filename: '5급 신출한자 훈음표.pdf', expected: 50, cumulative: 150 },
  { grade: '준4급', filename: '준4급 신출한자 훈음표.pdf', expected: 150, cumulative: 300 },
  { grade: '4급', filename: '4급 신출한자 훈음표.pdf', expected: 300, cumulative: 600 },
  { grade: '준3급', filename: '준3급 신출한자 훈음표.pdf', expected: 300, cumulative: 900 },
  { grade: '3급', filename: '3급 신출한자 훈음표.pdf', expected: 700, cumulative: 1600 },
  { grade: '준2급', filename: '준2급 신출한자 훈음표.pdf', expected: 1000, cumulative: 2600 },
  { grade: '2급', filename: '2급 신출한자 훈음표.pdf', expected: 1000, cumulative: 3600 },
  { grade: '준1급', filename: '준1급 신출한자 훈음표.pdf', expected: 1000, cumulative: 4600 },
  { grade: '1급', filename: '1급 신출한자 훈음표.pdf', expected: 1817, cumulative: 6417 }
];

/**
 * Extract text from a PDF file
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractFromPDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await PDFParse(dataBuffer);
  return data.text;
}

/**
 * Parse Hanja entries from extracted PDF text
 * @param {string} text - Raw text from PDF
 * @param {string} grade - Grade level (e.g., '8급', '7급')
 * @returns {Array<Object>} Array of Hanja entries
 */
function parseHanjaFromText(text, grade) {
  // PDF format typically has entries like:
  // 한자 훈 음
  // Parse and extract each character with its hun and eum

  const entries = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log(`  Total non-empty lines: ${lines.length}`);

  // Pattern to match: 한자(character) 훈(meaning) 음(pronunciation)
  // This may vary based on actual PDF structure - adjust as needed
  // Matching CJK characters followed by Korean text
  const hanjaPattern = /([一-龯㐀-䶵])\s+([가-힣\s]+?)\s+([가-힣]+)/g;

  let match;
  while ((match = hanjaPattern.exec(text)) !== null) {
    const [_, hanja, hun, eum] = match;
    entries.push({
      hanja: hanja.trim(),
      hun: hun.trim(),
      eum: eum.trim(),
      grade: grade
    });
  }

  // Alternative parsing: Try line-by-line parsing if pattern matching fails
  if (entries.length === 0) {
    console.log(`  Pattern matching failed, trying line-by-line parsing...`);

    for (const line of lines) {
      // Skip headers, page numbers, and non-data lines
      if (line.includes('한자') || line.includes('훈') || line.includes('음') ||
          line.includes('페이지') || line.includes('Page') ||
          /^\d+$/.test(line) || line.length < 3) {
        continue;
      }

      // Try to parse: 한자 훈 음 (space-separated)
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const potentialHanja = parts[0];
        // Check if first part is a CJK character
        if (/^[一-龯㐀-䶵]$/.test(potentialHanja)) {
          const hun = parts.slice(1, -1).join(' ');
          const eum = parts[parts.length - 1];

          entries.push({
            hanja: potentialHanja,
            hun: hun,
            eum: eum,
            grade: grade
          });
        }
      }
    }
  }

  // Show sample entries for debugging
  if (entries.length > 0) {
    console.log(`  Sample entries:`);
    console.log(`    ${entries[0].hanja} - ${entries[0].hun} - ${entries[0].eum}`);
    if (entries.length > 1) {
      console.log(`    ${entries[1].hanja} - ${entries[1].hun} - ${entries[1].eum}`);
    }
  }

  return entries;
}

/**
 * Main extraction function
 */
async function main() {
  console.log('========================================');
  console.log('Starting Hanja PDF extraction...');
  console.log('========================================\n');

  const allEntries = [];
  let successCount = 0;
  let failCount = 0;

  for (const gradeInfo of GRADE_INFO) {
    const pdfPath = path.join(WORDS_DIR, gradeInfo.filename);

    console.log(`\nProcessing ${gradeInfo.grade}...`);
    console.log(`  File: ${gradeInfo.filename}`);

    try {
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        console.error(`  ERROR: File not found!`);
        failCount++;
        continue;
      }

      const text = await extractFromPDF(pdfPath);
      console.log(`  Text extracted: ${text.length} characters`);

      const entries = parseHanjaFromText(text, gradeInfo.grade);

      console.log(`  Extracted ${entries.length} characters`);
      console.log(`  Expected: ${gradeInfo.expected} characters`);

      if (entries.length !== gradeInfo.expected) {
        console.warn(`  ⚠️  COUNT MISMATCH for ${gradeInfo.grade}!`);
        console.warn(`  Difference: ${entries.length - gradeInfo.expected}`);
      } else {
        console.log(`  ✓ Count verified`);
      }

      allEntries.push(...entries);
      successCount++;

    } catch (error) {
      console.error(`  ERROR processing ${gradeInfo.filename}:`, error.message);
      console.error(`  Stack trace:`, error.stack);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log('=== EXTRACTION SUMMARY ===');
  console.log('========================================');
  console.log(`Total characters extracted: ${allEntries.length}`);
  console.log(`Expected total: 6417`);
  console.log(`Files processed successfully: ${successCount}`);
  console.log(`Files failed: ${failCount}`);

  if (allEntries.length !== 6417) {
    console.warn(`\n⚠️  TOTAL COUNT MISMATCH!`);
    console.warn(`Difference: ${allEntries.length - 6417}`);
  } else {
    console.log(`\n✓ Total count verified!`);
  }

  // Save to JSON
  console.log(`\nSaving data to: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEntries, null, 2), 'utf8');
  console.log(`✓ Data saved successfully`);

  // Also create a quick summary by grade
  const byGrade = {};
  allEntries.forEach(entry => {
    if (!byGrade[entry.grade]) byGrade[entry.grade] = [];
    byGrade[entry.grade].push(entry);
  });

  console.log('\n========================================');
  console.log('=== BY GRADE ===');
  console.log('========================================');
  GRADE_INFO.forEach(info => {
    const count = byGrade[info.grade]?.length || 0;
    const status = count === info.expected ? '✓' : '⚠️';
    console.log(`${status} ${info.grade}: ${count} chars (expected ${info.expected})`);
  });

  // Save summary file
  const summaryPath = '/Users/tykimos/vibecode/hanja/scripts/extraction-summary.json';
  const summary = {
    totalExtracted: allEntries.length,
    totalExpected: 6417,
    byGrade: GRADE_INFO.map(info => ({
      grade: info.grade,
      extracted: byGrade[info.grade]?.length || 0,
      expected: info.expected,
      match: (byGrade[info.grade]?.length || 0) === info.expected
    })),
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\n✓ Summary saved to: ${summaryPath}`);

  console.log('\n========================================');
  console.log('Extraction complete!');
  console.log('========================================\n');
}

// Run the script
main().catch(error => {
  console.error('\n========================================');
  console.error('FATAL ERROR:');
  console.error('========================================');
  console.error(error);
  process.exit(1);
});
