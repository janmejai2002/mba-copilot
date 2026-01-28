const fs = require('fs');

// Read the file
const content = fs.readFileSync('components/SessionView.tsx', 'utf8');
const lines = content.split('\n');

// Remove lines 395-417 (0-indexed: 394-416) and insert the onClick handler
const fixedLines = [
    ...lines.slice(0, 395),
    '              onClick={isRecording ? stopRecording : startRecording}',
    ...lines.slice(418)
];

// Write back
fs.writeFileSync('components/SessionView.tsx', fixedLines.join('\n'), 'utf8');

console.log('✅ Fixed SessionView.tsx - removed duplicate code on lines 396-418');
