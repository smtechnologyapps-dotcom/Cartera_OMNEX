const fs = require('fs');
const pdf = require('c:/Users/ingom/temp_parser/node_modules/pdf-parse');
const path = require('path');

const dirPath = 'c:/Users/ingom/OneDrive/Documents/Agencia IA/Mi empresa';

async function main() {
    try {
        const files = fs.readdirSync(dirPath);
        const pdfFile = files.find(f => f.endsWith('.pdf'));
        if (!pdfFile) {
            console.log("No PDF found.");
            return;
        }
        
        console.log("=== Analyzing PDF:", pdfFile, "===");
        const dataBuffer = fs.readFileSync(path.join(dirPath, pdfFile));
        const pdfFn = typeof pdf === 'function' ? pdf : pdf.default || pdf;
        const data = await pdfFn(dataBuffer);
        const lines = data.text.split('\n');
        for (let i = 0; i < Math.min(80, lines.length); i++) {
            if (lines[i].trim()) {
                console.log(lines[i]);
            }
        }
    } catch (e) {
        console.error("PDF error: ", e.message);
    }
}

main();
