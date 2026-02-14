import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

mountNav(location.pathname);

let activeFile = null;
const previews = document.getElementById('previews');

setupDropzone({
  dropzoneId: 'dropzone',
  inputId: 'fileInput',
  onFiles: ([file]) => {
    activeFile = file;
    setStatus(`Loaded ${file.name}.`);
    previews.innerHTML = '';
  }
});

document.getElementById('convertBtn').addEventListener('click', async () => {
  if (!activeFile) {
    setStatus('Upload a PDF first.');
    return;
  }

  setStatus('Converting pages to PNG...');
  previews.innerHTML = '';

  const zip = new JSZip();
  const bytes = await activeFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const card = document.createElement('div');
    card.className = 'preview-item';
    card.innerHTML = `<strong>Page ${i}</strong>`;
    card.appendChild(canvas);
    previews.appendChild(card);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    zip.file(`page-${i}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `pdf-to-png-${Date.now()}.zip`);
  setStatus('Conversion complete. ZIP download started.', true);
});
