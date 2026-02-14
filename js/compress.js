mountNav(location.pathname);

let activeFile = null;

setupDropzone({
  dropzoneId: 'dropzone',
  inputId: 'fileInput',
  onFiles: ([file]) => {
    activeFile = file;
    setStatus(`Loaded ${file.name}.`);
  }
});

document.getElementById('compressBtn').addEventListener('click', async () => {
  if (!activeFile) {
    setStatus('Upload a PDF first.');
    return;
  }

  setStatus('Optimizing PDF...');
  const originalBytes = await activeFile.arrayBuffer();
  const pdf = await PDFLib.PDFDocument.load(originalBytes, { updateMetadata: false });
  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('');
  pdf.setCreator('');

  const compressedBytes = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
    updateFieldAppearances: false
  });

  const originalSizeKb = (originalBytes.byteLength / 1024).toFixed(1);
  const newSizeKb = (compressedBytes.byteLength / 1024).toFixed(1);
  document.getElementById('sizes').textContent = `Original: ${originalSizeKb} KB · Optimized: ${newSizeKb} KB`;

  downloadBlob(new Blob([compressedBytes], { type: 'application/pdf' }), `compressed-${Date.now()}.pdf`);
  setStatus('Compression complete. Download started.', true);
});
