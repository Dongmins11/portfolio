/* Reuse the published pages; do not keep a second resume content source. */
const exportButton = document.querySelector('#save-pdf');
const exportStatus = document.querySelector('#export-status');
const exportContent = document.querySelector('#export-content');
const sources = ['index.html', 'poco.html', 'kickcan.html', 'plc.html'];

function prepareMain(documentSource, file, position) {
  const main = documentSource.querySelector('main');
  if (!main) throw new Error(`${file}: 본문을 찾을 수 없습니다.`);
  const article = document.createElement('article');
  article.className = position ? 'export-case' : 'export-home';
  article.dataset.source = file;
  article.append(...main.childNodes);
  article.querySelectorAll('script, .skip, .case-nav, .demo-controls, .play-block, iframe, video').forEach(node => node.remove());
  article.querySelectorAll('details').forEach(node => { node.open = true; });
  article.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
  // Isolate repeated section IDs and keep intra-page links meaningful.
  const prefix = `export-${position}-`;
  article.querySelectorAll('[id]').forEach(node => { node.id = prefix + node.id; });
  article.querySelectorAll('a[href^="#"]').forEach(link => {
    link.setAttribute('href', '#' + prefix + link.getAttribute('href').slice(1));
  });
  // Use the original GitHub Pages address so saved PDFs do not contain localhost links.
  article.querySelectorAll('a[href]:not([href^="#"])').forEach(link => {
    const absolute = new URL(link.getAttribute('href'), 'https://dongmins11.github.io/portfolio/' + file);
    link.href = absolute.href;
  });
  return article;
}

async function waitForImages() {
  return Promise.all([...exportContent.querySelectorAll('img')].map(img => new Promise(resolve => {
    if (img.complete) { resolve(img.naturalWidth > 0); return; }
    const timer = setTimeout(() => resolve(false), 20000);
    const finish = success => { clearTimeout(timer); resolve(success); };
    img.addEventListener('load', () => finish(true), { once: true });
    img.addEventListener('error', () => finish(false), { once: true });
  })));
}

async function prepareExport() {
  try {
    const documents = await Promise.all(sources.map(async file => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`${file}: ${response.status}`);
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    }));
    documents.forEach((doc, index) => exportContent.append(prepareMain(doc, sources[index], index)));
    const results = await waitForImages();
    await document.fonts.ready;
    exportContent.setAttribute('aria-busy', 'false');
    if (results.some(loaded => !loaded)) {
      exportStatus.textContent = '일부 이미지가 준비되지 않았습니다. 새로고침한 뒤 다시 시도해 주세요.';
      exportButton.textContent = '이미지 로딩 확인 필요';
      return;
    }
    exportButton.disabled = false;
    exportButton.textContent = 'PDF로 저장';
    exportStatus.textContent = '준비되었습니다. 버튼을 누르면 인쇄 창이 열립니다.';
  } catch (error) {
    exportStatus.textContent = '자료를 불러오지 못했습니다. 새로고침해 주세요. 로컬 파일은 웹 서버로 열어야 합니다.';
    exportButton.textContent = '불러오기 실패';
    console.error(error);
  }
}
exportButton.addEventListener('click', () => window.print());
prepareExport();

