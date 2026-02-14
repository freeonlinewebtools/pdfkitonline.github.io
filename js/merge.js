import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

mountNav(location.pathname);

let files = [];
const previews = document.getElementById('previews');

setupDropzone({
  dropzoneId: 'dropzone',
  inputId: 'fileInput',
  multiple: true,
  onFiles: async (incoming) => {
    files = [...files, ...incoming];
    previews.innerHTML = '';
    for (const [index, file] of files.entries()) {
      const card = document.createElement('div');
      card.className = 'preview-item';
      card.innerHTML = `<strong>${index + 1}. ${file.name}</strong><canvas></canvas>`;
      previews.appendChild(card);
      await renderFirstPagePreview(file, card.querySelector('canvas'));
    }
    setStatus(`${files.length} file(s) ready.`);
  }
});

document.getElementById('mergeBtn').addEventListener('click', async () => {
  if (files.length < 2) {
    setStatus('Please add at least two PDF files.');
    return;
  }
  setStatus('Merging PDFs...');
  const merged = await PDFLib.PDFDocument.create();
  for (const file of files) {
    const pdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `merged-${Date.now()}.pdf`);
  setStatus('Merge complete. Download started.', true);
});
