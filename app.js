let bank = [], quiz = [], current = 0, correct = 0, wrongAnswers = [], answered = false;

const el = id => document.getElementById(id);
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

async function loadBank(){
  try{
    const res = await fetch('questions.xlsx?ts=' + Date.now());
    if(!res.ok) throw new Error('找不到 questions.xlsx');
    const data = await res.arrayBuffer();
    const wb = XLSX.read(data, {type:'array'});
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['題庫'], {defval:''});
    bank = rows.filter(r =>
      r['題目ID'] && r['題目'] && r['級別'] && r['考科'] &&
      ['A','B','C','D'].includes(String(r['正確答案']).trim().toUpperCase())
    );
    const summary = {};
    bank.forEach(q => {
      const key = `${q['級別']}／${q['考科']}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    const details = Object.entries(summary).map(([k,v]) => `${k} ${v}題`).join('、');
    el('loadStatus').textContent = `已載入 ${bank.length} 題${details ? `：${details}` : ''}`;
  }catch(err){
    el('loadStatus').textContent = '題庫載入失敗：' + err.message + '。請確認 questions.xlsx 位於網站根目錄。';
  }
}

function startQuiz(){
  const level = el('level').value;
  const subject = el('subject').value;
  const requested = Number(el('count').value);
  let pool = bank;
  if(level !== '全部') pool = pool.filter(q => q['級別'] === level);
  if(subject !== '全部') pool = pool.filter(q => q['考科'] === subject);
  if(!pool.length) return alert('目前這個級別與考科尚未建立題目。');
  quiz = shuffle(pool).slice(0, Math.min(requested, pool.length));
  if(pool.length < requested) alert(`目前符合條件的題庫只有 ${pool.length} 題，本次將出 ${quiz.length} 題。`);
  current = 0; correct = 0; wrongAnswers = [];
  el('setup').classList.add('hidden');
  el('result').classList.add('hidden');
  el('quiz').classList.remove('hidden');
  showQuestion();
}

function showQuestion(){
  answered = false;
  const q = quiz[current];
  el('progress').textContent = `第 ${current+1} / ${quiz.length} 題`;
  el('score').textContent = `答對 ${correct} 題`;
  el('quizTag').textContent = `${q['級別']}｜${q['考科']}${q['年度'] ? `｜${q['年度']}年` : ''}`;
  el('question').textContent = q['題目'];
  el('feedback').classList.add('hidden');
  el('nextBtn').classList.add('hidden');
  const options = el('options');
  options.innerHTML = '';
  ['A','B','C','D'].forEach(letter => {
    const b = document.createElement('button');
    b.className = 'option';
    b.textContent = `${letter}. ${q['選項'+letter]}`;
    b.onclick = () => answer(letter, b);
    options.appendChild(b);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

function answer(letter, button){
  if(answered) return;
  answered = true;
  const q = quiz[current];
  const right = String(q['正確答案']).trim().toUpperCase();
  [...el('options').children].forEach((b,i) => {
    const l = ['A','B','C','D'][i];
    if(l === right) b.classList.add('correct');
    b.disabled = true;
  });
  if(letter === right) correct++;
  else{
    button.classList.add('wrong');
    wrongAnswers.push({q, chosen:letter});
  }
  el('score').textContent = `答對 ${correct} 題`;
  el('feedback').innerHTML = `<strong>正確答案：${right}. ${q['選項'+right]}</strong><br>${q['解析'] || '本題目前尚未建立解析。'}`;
  el('feedback').classList.remove('hidden');
  el('nextBtn').textContent = current === quiz.length-1 ? '查看成績' : '下一題';
  el('nextBtn').classList.remove('hidden');
}

function next(){
  current++;
  if(current < quiz.length) showQuestion();
  else showResult();
}

function showResult(){
  el('quiz').classList.add('hidden');
  el('result').classList.remove('hidden');
  const pct = Math.round(correct / quiz.length * 100);
  el('resultText').textContent = `${correct} / ${quiz.length} 題，答對率 ${pct}%`;
  const list = el('wrongList');
  list.innerHTML = wrongAnswers.length ? '<h2>錯題解答</h2>' : '<p>全部答對！</p>';
  wrongAnswers.forEach((item,idx) => {
    const q = item.q;
    const right = String(q['正確答案']).trim().toUpperCase();
    const div = document.createElement('article');
    div.className = 'wrong-item';
    div.innerHTML = `<h3>${idx+1}. [${q['級別']}｜${q['考科']}] ${q['題目']}</h3>
      <p>你的答案：${item.chosen}. ${q['選項'+item.chosen]}</p>
      <p><strong>正確答案：${right}. ${q['選項'+right]}</strong></p>
      <p>${q['解析'] || ''}</p>`;
    list.appendChild(div);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

el('startBtn').onclick = startQuiz;
el('nextBtn').onclick = next;
el('restartBtn').onclick = () => {
  el('result').classList.add('hidden');
  el('setup').classList.remove('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
};
loadBank();
