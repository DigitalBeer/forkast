import fs from 'fs';

const content = fs.readFileSync('coverage/lcov.info', 'utf8');
const records = content.split('end_of_record');
const targets = [
    'measurements\\conversions.ts',
    'localStorage\\tags.ts',
    'services\\suggestionService.ts',
    'html-fallback.ts',
    'schema-org.ts',
    'shopping\\aggregate.ts',
];

for (const record of records) {
    const sfMatch = record.match(/^SF:(.+\.(?:ts|tsx))/m);
    if (!sfMatch) continue;
    const filePath = sfMatch[1];
    const matched = targets.some(t => filePath.includes(t));
    if (!matched) continue;

    console.log('=== ' + filePath.split('\\').slice(-2).join('/') + ' ===');

    const daMatches = record.matchAll(/^DA:(\d+),(\d+)/gm);
    for (const m of daMatches) {
        if (m[2] === '0') console.log('  LINE ' + m[1] + ' not covered');
    }

    const brdaMatches = record.matchAll(/^BRDA:(\d+),(\d+),(\d+),(\d+|\-)/gm);
    for (const m of brdaMatches) {
        if (m[4] === '0' || m[4] === '-') console.log('  BRANCH at line ' + m[1] + ' block=' + m[2] + ' branch=' + m[3] + ' taken=' + m[4]);
    }
}
