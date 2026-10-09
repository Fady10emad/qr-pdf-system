/**
 * Generates a valid minimal standalone PDF File in memory
 * for instant testing without needing an existing PDF on the device.
 */
export const createSamplePdfFile = (title = 'Sample_Document') => {
  const dateStr = new Date().toLocaleDateString();
  const textContent = `PDF QR Studio Demo Document\\nCreated: ${dateStr}\\nThis is a sample document for testing non-expiring QR generation.`;

  // Minimal valid PDF-1.4 file format
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 174 >>
stream
BT
/F1 22 Tf
72 700 Td
(${title}) Tj
/F1 12 Tf
0 -36 Td
(Generated via PDF QR Studio) Tj
0 -24 Td
(Date: ${dateStr}) Tj
0 -24 Td
(Scan the QR code to verify permanent access!) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000470 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
548
%%EOF`;

  const blob = new Blob([pdfString], { type: 'application/pdf' });
  const fileName = `${title}_${Date.now().toString().slice(-4)}.pdf`;
  return new File([blob], fileName, { type: 'application/pdf' });
};
