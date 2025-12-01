import * as XLSX from 'xlsx';

export const extractTextFromExcel = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                let fullText = '';

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    // Convert sheet to CSV text
                    const text = XLSX.utils.sheet_to_csv(sheet);
                    if (text.trim()) {
                        fullText += `--- Hoja: ${sheetName} ---\n${text}\n\n`;
                    }
                });

                resolve(fullText);
            } catch (error) {
                console.error("Error parsing Excel:", error);
                reject(new Error("No se pudo leer el archivo Excel"));
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
