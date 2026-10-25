// The current main element is the print source. No fetching, cloning, or PDF snapshot.
const printButton = document.querySelector('#print-main');
async function printCurrentMain() {
 if (printButton.disabled) return;
 printButton.disabled = true; printButton.textContent = '이미지 준비 중…';
 try {
  const images = [...document.querySelectorAll('main img')];
  images.forEach(img => { img.loading = 'eager'; });
  await Promise.all(images.map(img => img.decode().catch(() => {})));
  await document.fonts.ready;
  if (images.some(img => !img.naturalWidth)) { alert('일부 이미지를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'); return; }
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.print();
 } finally { printButton.disabled = false; printButton.textContent = 'PDF 저장 ↗'; }
}
printButton.addEventListener('click', printCurrentMain);
if (new URLSearchParams(location.search).get('print') === '1') {
 window.addEventListener('load', () => { history.replaceState(null, '', location.pathname + location.hash); printCurrentMain(); }, { once: true });
}
