/* Preserve the verified three-page PDF layout while the main website design evolves. */
const exportButton = document.querySelector('#save-pdf');
const exportStatus = document.querySelector('#export-status');
const exportContent = document.querySelector('#export-content');
const sources = ['pdf-source.html'];
let exportReady = false;

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
    if (img.complete && img.naturalWidth > 0) { resolve(true); return; }
    let retries = 0;
    let timer;
    let finished = false;
    const finish = success => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', retry);
      resolve(success);
    };
    const onLoad = () => finish(img.naturalWidth > 0);
    const retry = () => {
      clearTimeout(timer);
      if (retries >= 2) { finish(false); return; }
      const url = new URL(img.src);
      url.searchParams.set('pdf_retry', String(++retries));
      img.src = url.href;
      timer = setTimeout(retry, 30000);
    };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', retry);
    timer = setTimeout(retry, 30000);
    if (img.complete) retry();
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
      exportStatus.textContent = '일부 이미지가 준비되지 않았습니다. 버튼을 눌러 다시 불러와 주세요.';
      exportButton.textContent = '이미지 다시 불러오기';
      exportButton.disabled = false;
      return;
    }
    exportButton.disabled = false;
    exportReady = true;
    exportButton.textContent = 'PDF로 저장';
    exportStatus.textContent = '준비되었습니다. 버튼을 누르면 인쇄 창이 열립니다.';
  } catch (error) {
    exportStatus.textContent = '자료를 불러오지 못했습니다. 새로고침해 주세요. 로컬 파일은 웹 서버로 열어야 합니다.';
    exportButton.textContent = '불러오기 실패';
    console.error(error);
  }
}
exportButton.addEventListener('click', () => {
  if (exportReady) window.print();
  else location.reload();
});
prepareExport();
