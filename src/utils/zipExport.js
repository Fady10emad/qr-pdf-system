import JSZip from 'jszip';
import QRCode from 'qrcode';

export const downloadItemsAsZip = async (items, styleConfig, zipFileName = 'PDF_QR_Codes.zip') => {
  if (!items || items.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('qr_codes');

  const targetSize = styleConfig?.exportSize || 1024;
  const fgColor = styleConfig?.fgColor || '#000000';
  const bgColor = styleConfig?.bgColor || '#ffffff';
  const level = styleConfig?.level || 'H';

  // Process all items in parallel
  const promises = items.map(async (item, index) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;

      await QRCode.toCanvas(canvas, item.url, {
        width: targetSize,
        margin: 3,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: level,
      });

      // If center logo enabled, draw center PDF indicator
      if (styleConfig?.showCenterLogo) {
        const ctx = canvas.getContext('2d');
        const centerSize = targetSize * 0.22;
        const centerPos = (targetSize - centerSize) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(centerPos, centerPos, centerSize, centerSize, centerSize * 0.2);
        ctx.fill();
        ctx.lineWidth = targetSize * 0.01;
        ctx.strokeStyle = fgColor;
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.font = `bold ${centerSize * 0.38}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PDF', targetSize / 2, targetSize / 2);
      }

      // Convert canvas to base64
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      const cleanName = item.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${index + 1}_${cleanName}_QR.png`;

      folder.file(fileName, base64Data, { base64: true });
    } catch (err) {
      console.error(`Failed to generate QR image for ${item.name}:`, err);
    }
  });

  await Promise.all(promises);

  // Generate zip file and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};
