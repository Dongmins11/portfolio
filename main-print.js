// Preview and print the current main DOM, never a separate resume source.
const printButton = document.querySelector('#print-main');
let previewActive = false;
let originalNodes = [];
let returnFocus = null;
const main = document.querySelector('main');
async function preparePrintAssets() {
 const images = [...main.querySelectorAll('img')];
 images.forEach(img => { img.loading = 'eager'; });
 await Promise.all(images.map(img => img.decode().catch(() => {})));
 await document.fonts.load('400 16px Pretendard');
 await document.fonts.ready;
 if (images.some(img => !img.naturalWidth)) throw new Error('일부 이미지를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
}
function createSheet(label) {
 const sheet = document.createElement('div'); sheet.className = 'pdf-sheet'; sheet.setAttribute('aria-label', label);
 const number = document.createElement('span'); number.className = 'pdf-sheet-label'; number.textContent = label; sheet.append(number);
 main.append(sheet); return sheet;
}
function moveToSheet(node, sheet) {
 const marker = document.createComment('print-origin'); node.before(marker); originalNodes.push([node,marker]); sheet.append(node);
}
function fits(sheet) { return sheet.getBoundingClientRect().height <= 1122.8; }
function place(nodes,label) {
 let sheet=createSheet(label);
 nodes.filter(Boolean).forEach(node => {
  moveToSheet(node,sheet);
  if (!fits(sheet) && sheet.children.length > 2) {
   sheet=createSheet(label+' · 계속'); sheet.append(node);
  }
  // Split a growing section at whole child-block boundaries, keeping original nodes.
  if (!fits(sheet)) {
   let source=node;
   let sourceSheet=sheet;
   let guard=0;
   while(!fits(sourceSheet) && guard++<30){
    const container=source.querySelector(':scope > .wrap') || source;
    const children=[...container.children];
    if(children.length<2)break;
    const continuation=createSheet(label+' · 계속');
    const shell=node.cloneNode(false);shell.removeAttribute('id');continuation.append(shell);
    let target=shell;
    if(container!==source){target=document.createElement('div');target.className='wrap';shell.append(target);}
    while(!fits(sourceSheet)&&container.children.length>1){
     const chunk=container.lastElementChild;
     moveToSheet(chunk,target);target.prepend(chunk);
    }
    source=shell;sourceSheet=continuation;
   }
  }
 });
}
function closePrintPreview() {
 if(!previewActive)return;
 // Children restore before their original parents.
 [...originalNodes].reverse().forEach(([node,marker])=>{marker.replaceWith(node);}); originalNodes=[];
 main.querySelectorAll(':scope > .pdf-sheet').forEach(node=>node.remove());
 document.querySelector('#print-preview-bar')?.remove(); document.body.classList.remove('pdf-preview'); previewActive=false;
 returnFocus?.focus();
}
async function openPrintPreview() {
 if(previewActive)return;
 printButton.disabled=true; printButton.textContent='미리보기 준비 중…';returnFocus=document.activeElement;
 try {
  await preparePrintAssets();
  const intro=main.querySelector('#about'),skills=main.querySelector('#skills');
  const featured=[...main.querySelectorAll('.ongoing-section')];
  const projects=main.querySelector('#completed-projects');
  const rows=projects?[...projects.querySelectorAll(':scope > .project-row')]:[];
  const heading=projects?.querySelector(':scope > .section-heading');const journey=main.querySelector('#journey');
  document.body.classList.add('pdf-preview'); previewActive=true;
  const bar=document.createElement('div');bar.id='print-preview-bar';bar.innerHTML='<strong>PDF 미리보기</strong><p>배치 확인 후 저장하세요. A4 · 배율 100% · 배경 그래픽 켜기</p><button id="print-preview-close" type="button">웹페이지로 돌아가기</button><button id="print-preview-save" type="button">PDF로 저장</button>';
  document.body.prepend(bar);
  bar.querySelector('#print-preview-close').addEventListener('click',closePrintPreview);
  bar.querySelector('#print-preview-save').addEventListener('click',async()=>{await preparePrintAssets();window.print();});
  place([intro,journey,skills],'프로필 · Experience · 프로젝트 기반 적용 경험');
  featured.forEach((node,i)=>place([node],`메인 프로젝트 ${i+1}`));
  for(let i=0;i<rows.length;i+=2){
   const final=i+2>=rows.length;
   const group=[...(i===0?[heading]:[]),...rows.slice(i,i+2)];
   place(group,'완료 프로젝트');
  }

  // Empty source containers stay in the DOM so restoration preserves all handlers.
  if(projects){projects.dataset.printHidden='true';projects.style.display='none';}
  let n=0;main.querySelectorAll(':scope > .pdf-sheet').forEach(sheet=>{sheet.querySelector('.pdf-sheet-label').textContent=++n+' / '+main.querySelectorAll(':scope > .pdf-sheet').length;});
  window.scrollTo(0,0);bar.querySelector('#print-preview-save').focus();
 } catch(error){if(previewActive)closePrintPreview();alert(error.message);}finally{printButton.disabled=false;printButton.textContent='PDF 저장 ↗';}
}

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&previewActive){event.preventDefault();closePrintPreview();}});
// Clear only the preview's temporary display override on return.
const observer=new MutationObserver(()=>{if(!previewActive){const projects=document.querySelector('[data-print-hidden]');if(projects){projects.style.removeProperty('display');delete projects.dataset.printHidden;}}});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
printButton.addEventListener('click',openPrintPreview);
if(new URLSearchParams(location.search).get('print')==='1')window.addEventListener('load',()=>{history.replaceState(null,'',location.pathname+location.hash);openPrintPreview();},{once:true});
