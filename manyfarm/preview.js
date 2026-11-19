const links = [...document.querySelectorAll('.case-nav a')];
const sections = [...document.querySelectorAll('.case-section, #simulation')];
function updateNav() {
  const current = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 190) || sections[0];
  links.forEach(link => {
    const active = link.hash === '#' + current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', updateNav, {passive:true});
updateNav();
document.querySelectorAll('[data-scene-title]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-scene-title]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    document.getElementById('scene-title').textContent = button.dataset.sceneTitle;
    document.getElementById('scene-caption').textContent = button.dataset.sceneCaption;
  });
});
document.getElementById('print-page')?.addEventListener('click', () => window.print());
