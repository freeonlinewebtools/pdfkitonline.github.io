mountNav(location.pathname);

let activeFile = null;

function parseRange(input, maxPage) {
  const pages = new Set();
  input.split(',').map((s) => s.trim()).filter(Boolean).forEach((token) => {
    if (token.includes('-')) {
      const [a, b] = token.split('-').map(Number);
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
  onFiles: ([file]) => {
    activeFile = file;
    setStatus(`Loaded ${file.name}.`);
  }
});

document.getElementById('removeBtn').addEventListener('click', async () => {
  if (!activeFile) {
    setStatus('Upload a PDF first.');
    return;
  }

  const pdf = await PDFLib.PDFDocument.load(await activeFile.arrayBuffer());
  const pageCount = pdf.getPageCount();
  const removePages = parseRange(document.getElementById('rangeInput').value.trim(), pageCount);
  if (!removePages.length) {
    setStatus('Enter pages to remove.');
    return;
  }

  const keep = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (!removePages.includes(i)) keep.push(i - 1);
  }
  if (!keep.length) {
    setStatus('Cannot remove all pages.');
    return;
  }

  const out = await PDFLib.PDFDocument.create();
  const copied = await out.copyPages(pdf, keep);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `pages-removed-${Date.now()}.pdf`);
  setStatus('Pages removed. Download started.', true);
});
