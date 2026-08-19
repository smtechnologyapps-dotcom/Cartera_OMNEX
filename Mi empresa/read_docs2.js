const XLSX = require('c:/Users/ingom/temp_parser/node_modules/xlsx');

const file1 = 'c:/Users/ingom/OneDrive/Documents/Agencia IA/Mi empresa/Cotizaciones de Aplicaciones Web (1).xlsx';
const file2 = 'c:/Users/ingom/OneDrive/Documents/Agencia IA/Mi empresa/Cotizaciones de Aplicaciones Web (2).xlsx';

function analyzeExcel(path) {
    try {
        const workbook = XLSX.readFile(path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
        console.log(`\n=== Analyzing: ${path} ===`);
        // Log header
        console.log("Headers:", json[0]);
        // Log first 5 rows
        for (let i = 1; i < Math.min(6, json.length); i++) {
            console.log(`Row ${i}:`, json[i]);
        }
    } catch (e) {
        console.error(`Error reading ${path}:`, e.message);
    }
}

analyzeExcel(file1);
analyzeExcel(file2);
