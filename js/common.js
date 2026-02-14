const TOOL_LINKS = [
  { href: 'merge.html', label: 'Merge' },
  { href: 'split.html', label: 'Split' },
  { href: 'compress.html', label: 'Compress' },
  { href: 'rotate.html', label: 'Rotate' },
  { href: 'remove.html', label: 'Remove Pages' },
  { href: 'pdf-to-png.html', label: 'PDF to PNG' }
];

function mountNav(activePath) {
  const nav = document.getElementById('toolNav');
  if (!nav) return;
  nav.innerHTML = TOOL_LINKS
    .map((item) => `<a href="${item.href}" class="${activePath.endsWith(item.href) ? 'active' : ''}">${item.label}</a>`)
    .join('');
}

function setupDropzone({ dropzoneId, inputId, multiple = false, onFiles }) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  input.multiple = multiple;

  const openPicker = () => input.click();
  dropzone.addEventListener('click', openPicker);

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type === 'application/pdf');
    if (files.length) onFiles(multiple ? files : [files[0]]);
  });

  input.addEventListener('change', () => {
    const files = [...input.files].filter((f) => f.type === 'application/pdf');
    if (files.length) onFiles(multiple ? files : [files[0]]);
  });
}

async function renderFirstPagePreview(file, canvas) {
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.4 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function setStatus(message, success = false) {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = message;
  el.className = success ? 'notice success' : 'notice';
}
