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

document.getElementById('rotateBtn').addEventListener('click', async () => {
  if (!activeFile) {
    setStatus('Upload a PDF first.');
    return;
  }
  const pdf = await PDFLib.PDFDocument.load(await activeFile.arrayBuffer());
  const pageCount = pdf.getPageCount();
  const targets = parseRange(document.getElementById('rangeInput').value.trim(), pageCount);
  if (!targets.length) {
    setStatus('Enter a valid page range.');
    return;
  }

  const angle = Number(document.getElementById('angleInput').value);
  targets.forEach((p) => {
    const page = pdf.getPage(p - 1);
    page.setRotation(PDFLib.degrees(angle));
  });

  const bytes = await pdf.save();
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `rotated-${Date.now()}.pdf`);
  setStatus('Rotation complete. Download started.', true);
});
