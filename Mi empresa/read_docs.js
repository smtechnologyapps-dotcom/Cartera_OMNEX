const fs = require('fs');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

const excelPath = 'c:/Users/ingom/OneDrive/Documents/Agencia IA/Mi empresa/Cotizaciones de Aplicaciones Web (1).xlsx';
const pdfPath = 'c:/Users/ingom/OneDrive/Documents/Agencia IA/Mi empresa/Fact-108-Mar_2026_ECO MUNDO INTERNACIONAL, S.A___Marca temporal__.pdf';

async function main() {
    console.log("=== EXCEL FILE ===");
    try {
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
        for (let i = 0; i < Math.min(20, json.length); i++) {
            console.log(json[i]);
        }
    } catch (e) {
        console.error("Excel error: ", e.message);
    }

    console.log("\n=== PDF FILE ===");
    try {
        let dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const lines = data.text.split('\n');
        for (let i = 0; i < Math.min(40, lines.length); i++) {
            console.log(lines[i]);
        }
    } catch (e) {
        console.error("PDF error: ", e.message);
    }
}

main();
