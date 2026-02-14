import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

mountNav(location.pathname);

let activeFile = null;
const previews = document.getElementById('previews');

function parseRange(input, maxPage) {
  const pages = new Set();
  input.split(',').map((s) => s.trim()).filter(Boolean).forEach((token) => {
    if (token.includes('-')) {
      const [a, b] = token.split('-').map((n) => Number(n));
      const start = Math.max(1, Math.min(a, b));
      const end = Math.min(maxPage, Math.max(a, b));
      for (let i = start; i <= end; i += 1) pages.add(i);
    } else {
      const p = Number(token);
      if (p >= 1 && p <= maxPage) pages.add(p);
    }
  });
  return [...pages].sort((x, y) => x - y);
}

setupDropzone({
  dropzoneId: 'dropzone',
  inputId: 'fileInput',
  onFiles: async ([file]) => {
    activeFile = file;
    previews.innerHTML = '';
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const card = document.createElement('div');
      card.className = 'preview-item';
      card.innerHTML = `<strong>Page ${i}</strong>`;
      card.appendChild(canvas);
      previews.appendChild(card);
    }
    setStatus(`Loaded ${file.name}.`);
  }
});

document.getElementById('splitBtn').addEventListener('click', async () => {
  if (!activeFile) {
    setStatus('Upload a PDF first.');
    return;
  }
  const source = await PDFLib.PDFDocument.load(await activeFile.arrayBuffer());
  const pageCount = source.getPageCount();
  const range = document.getElementById('rangeInput').value.trim();
  const selected = parseRange(range, pageCount);
  if (!selected.length) {
    setStatus('Enter a valid page range.');
    return;
  }

  setStatus('Extracting pages...');
  const out = await PDFLib.PDFDocument.create();
  const copied = await out.copyPages(source, selected.map((p) => p - 1));
  copied.forEach((page) => out.addPage(page));
  const bytes = await out.save();
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `split-${Date.now()}.pdf`);
  setStatus('Split complete. Download started.', true);
});
