'use strict';
const candidates = ['钟昌洲', '李萍', '陈雨婷', '郑月平', '朱清伟', '罗雪梅', '夏玲', '戴慧敏', '官丽伟'];
const palette = [['#eee7fa','#9975c1'],['#fcece5','#c68d71'],['#e7efec','#82a795'],['#e8edf9','#839ac6'],['#f8e9ed','#c18a9c'],['#f3eddc','#b49b62'],['#e8eef5','#87a1b5'],['#eee8f5','#a18bb9'],['#e9f0e5','#90a57a']];
const storageKey = 'organizer-draw-production-v1';
const elements = Object.fromEntries(['stage','label','name','description','draw','status','time','candidates','dialog'].map(identifier => [identifier, document.getElementById(identifier)]));
let running = false;
let result = null;
candidates.forEach((name, index) => {
  const card = document.createElement('div');
  card.className = 'person';
  card.style.setProperty('--bg', palette[index][0]);
  card.style.setProperty('--fg', palette[index][1]);
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = name[0];
  const label = document.createElement('span');
  label.textContent = name;
  card.append(avatar, label);
  elements.candidates.append(card);
});
const cards = [...elements.candidates.children];
function randomIndex(length) {
  const range = 0x100000000;
  const limit = range - range % length;
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % length;
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let index = 0; index < 54; index++) {
    const particle = document.createElement('span');
    particle.className = 'confetti';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.background = ['#b394e5','#e7bd8e','#c2d7bf','#dfb4cd','#a4bbde'][index % 5];
    particle.style.setProperty('--drift', `${Math.random() * 240 - 120}px`);
    particle.style.animationDelay = `${Math.random() * .6}s`;
    document.body.append(particle);
    setTimeout(() => particle.remove(), 4000);
  }
}
function showResult(savedResult) {
  result = savedResult;
  elements.stage.className = 'stage finished';
  elements.name.textContent = savedResult.name;
  elements.label.textContent = '幸运揭晓 · 组织委员';
  elements.description.textContent = `恭喜${savedResult.name}，新的小担当就交给你啦！`;
  elements.status.textContent = '抽签已完成';
  elements.draw.textContent = '重新抽签';
  elements.draw.disabled = false;
  elements.time.textContent = `揭晓于 ${new Date(savedResult.time).toLocaleString('zh-CN', {hour12:false})} · ${savedResult.persisted === false ? '存储不可用，请截图保存' : '结果已保存'}`;
  cards.forEach((card, index) => { card.classList.remove('active'); card.classList.toggle('winner', candidates[index] === savedResult.name); });
  running = false;
}
function startDraw() {
  if (running) return;
  let winnerIndex;
  let startingIndex;
  try { winnerIndex = randomIndex(candidates.length); startingIndex = randomIndex(candidates.length); }
  catch { elements.description.textContent = '安全随机源不可用，请使用本机 localhost 地址打开。'; return; }
  running = true;
  elements.draw.disabled = true;
  elements.draw.textContent = '幸运正在酝酿…';
  elements.status.textContent = '抽签进行中';
  elements.stage.className = 'stage running';
  elements.label.textContent = '心跳加速 · 即将揭晓';
  elements.description.textContent = '让幸运，慢慢落在一个名字上';
  elements.time.textContent = '';
  cards.forEach(card => card.classList.remove('winner'));
  let step = 0;
  const totalSteps = 29;
  function tick() {
    const activeIndex = (startingIndex + step) % candidates.length;
    cards.forEach((card, index) => card.classList.toggle('active', index === activeIndex));
    elements.name.textContent = candidates[activeIndex];
    step++;
    if (step < totalSteps) setTimeout(tick, 55 + 230 * Math.pow(step / totalSteps, 3));
    else {
      const savedResult = {name:candidates[winnerIndex], time:new Date().toISOString()};
      try { localStorage.setItem(storageKey, JSON.stringify(savedResult)); }
      catch { savedResult.persisted = false; }
      showResult(savedResult);
      celebrate();
    }
  }
  tick();
}
elements.draw.addEventListener('click', () => {
  if (running) return;
  if (result) elements.dialog.showModal();
  else startDraw();
});
document.getElementById('cancel').addEventListener('click', () => elements.dialog.close());
document.getElementById('confirm').addEventListener('click', () => { elements.dialog.close(); startDraw(); });
try {
  const savedResult = JSON.parse(localStorage.getItem(storageKey));
  if (savedResult && candidates.includes(savedResult.name) && Number.isFinite(Date.parse(savedResult.time))) showResult(savedResult);
} catch {}
