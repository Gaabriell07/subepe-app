const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// 44-byte minimal WAV files just to have a valid file to load
const dummyWavBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
const buffer = Buffer.from(dummyWavBase64, 'base64');

fs.writeFileSync(path.join(dir, 'success.wav'), buffer);
fs.writeFileSync(path.join(dir, 'error.wav'), buffer);

console.log("Dummy sound files created in assets/sounds/");
