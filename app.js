let bank = [], quiz = [], current = 0, correct = 0, wrongAnswers = [], answered = false;
let selectedAnswers = [];

const el = id => document.getElementById(id);
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// 將答案統一整理成 A、AB、ABD、ABCD 這種格式
function normalizeAnswer(value){
  return [...new Set(
    String(value)
      .trim()
      .toUpperCase()
      .replace(/[^ABCD]/g, '')
      .split('')
  )].sort().join('');
}

// 將 A / ABD 等答案轉成完整選項文字
function answerText(q, answer){
  return answer
    .split('')
    .map(letter => `${letter}. ${q['選項' + letter]}`)
    .join('、');
}

async function loadBank(){
  try{
    const res = await fetch('questions.xlsx?ts=' + Date.now());

    if(!res.ok){
      throw new Error('找不到 questions.xlsx');
    }

    const data = await res.arrayBuffer();
    const wb = XLSX.read(data, {type:'array'});
    const rows = XLSX.utils.sheet_to_json(
      wb.Sheets['題庫'],
      {defval:''}
    );

    // 單選 A/B/C/D 與複選 AB/ACD/ABCD 都可以載入
    bank = rows.filter(r => {
      const answer = normalizeAnswer(r['正確答案']);

      return (
        r['題目ID'] &&
        r['題目'] &&
        r['級別'] &&
        r['考科'] &&
        answer.length >= 1 &&
        answer.length <= 4
      );
    });

    const summary = {};

    bank.forEach(q => {
      const key = `${q['級別']}／${q['考科']}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    const details = Object.entries(summary)
      .map(([k,v]) => `${k} ${v}題`)
      .join('、');

    el('loadStatus').textContent =
      `已載入 ${bank.length} 題${details ? `：${details}` : ''}`;

  }catch(err){
    el('loadStatus').textContent =
      '題庫載入失敗：' +
      err.message +
      '。請確認 questions.xlsx 位於網站根目錄。';
  }
}

function startQuiz(){
  const level = el('level').value;
  const subject = el('subject').value;
  const requested = Number(el('count').value);

  let pool = bank;

  if(level !== '全部'){
    pool = pool.filter(q => q['級別'] === level);
  }

  if(subject !== '全部'){
    pool = pool.filter(q => q['考科'] === subject);
  }

  if(!pool.length){
    return alert('目前這個級別與考科尚未建立題目。');
  }

  quiz = shuffle(pool)
    .slice(0, Math.min(requested, pool.length));

  if(pool.length < requested){
    alert(
      `目前符合條件的題庫只有 ${pool.length} 題，本次將出 ${quiz.length} 題。`
    );
  }

  current = 0;
  correct = 0;
  wrongAnswers = [];

  el('setup').classList.add('hidden');
  el('result').classList.add('hidden');
  el('quiz').classList.remove('hidden');

  showQuestion();
}

function showQuestion(){
  answered = false;
  selectedAnswers = [];

  const q = quiz[current];
  const right = normalizeAnswer(q['正確答案']);

  // 答案超過一個字母，就是複選題
  const isMultiple = right.length > 1;

  el('progress').textContent =
    `第 ${current + 1} / ${quiz.length} 題`;

  el('score').textContent =
    `答對 ${correct} 題`;

  el('quizTag').textContent =
    `${q['級別']}｜${q['考科']}` +
    `${q['年度'] ? `｜${q['年度']}年` : ''}`;

  // 複選題在題目前標示
  el('question').textContent =
    `${isMultiple ? '【複選題】' : ''}${q['題目']}`;

  el('feedback').classList.add('hidden');
  el('nextBtn').classList.add('hidden');

  const options = el('options');
  options.innerHTML = '';

  ['A','B','C','D'].forEach(letter => {

    const b = document.createElement('button');

    b.className = 'option';
    b.dataset.letter = letter;

    b.textContent =
      `${letter}. ${q['選項' + letter]}`;

    // 複選題：點一下選取，再點一下取消
    if(isMultiple){
      b.onclick = () => toggleAnswer(letter, b);
    }

    // 單選題：維持原本點一下立即判分
    else{
      b.onclick = () => submitAnswer(letter);
    }

    options.appendChild(b);
  });

  // 只有複選題才顯示「確認答案」
  if(isMultiple){

    const confirmBtn =
      document.createElement('button');

    confirmBtn.id = 'confirmBtn';
    confirmBtn.className = 'primary-btn';
    confirmBtn.textContent = '確認答案';

    confirmBtn.onclick = () => {

      if(selectedAnswers.length === 0){
        alert('請至少選擇一個答案。');
        return;
      }

      submitAnswer(
        selectedAnswers.join('')
      );
    };

    options.appendChild(confirmBtn);
  }

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}

// 複選題選取 / 取消選取
function toggleAnswer(letter, button){

  if(answered) return;

  if(selectedAnswers.includes(letter)){

    selectedAnswers =
      selectedAnswers.filter(
        x => x !== letter
      );

    button.classList.remove('selected');
  }

  else{

    selectedAnswers.push(letter);

    // 保證答案永遠按照 ABCD 排序
    selectedAnswers.sort();

    button.classList.add('selected');
  }
}

// 單選與複選共用的判分函式
function submitAnswer(chosen){

  if(answered) return;

  answered = true;

  const q = quiz[current];

  const right =
    normalizeAnswer(q['正確答案']);

  chosen =
    normalizeAnswer(chosen);

  const optionButtons =
    [...el('options')
      .querySelectorAll('.option')];

  optionButtons.forEach(button => {

    const letter =
      button.dataset.letter;

    // 移除複選中的藍色狀態
    button.classList.remove('selected');

    // 正確答案標綠色
    if(right.includes(letter)){
      button.classList.add('correct');
    }

    // 使用者選錯的答案標紅色
    if(
      chosen.includes(letter) &&
      !right.includes(letter)
    ){
      button.classList.add('wrong');
    }

    button.disabled = true;
  });

  const confirmBtn =
    el('confirmBtn');

  if(confirmBtn){
    confirmBtn.disabled = true;
  }

  // 必須完全一致才算答對
  // 例如正解 ABD：
  // ABD = 對
  // AB  = 錯
  // ABCD = 錯
  if(chosen === right){

    correct++;

  }else{

    wrongAnswers.push({
      q,
      chosen
    });
  }

  el('score').textContent =
    `答對 ${correct} 題`;

  el('feedback').innerHTML =
    `<strong>正確答案：${right}</strong><br>` +
    `${answerText(q, right)}<br><br>` +
    `${q['解析'] || '本題目前尚未建立解析。'}`;

  el('feedback')
    .classList.remove('hidden');

  el('nextBtn').textContent =
    current === quiz.length - 1
      ? '查看成績'
      : '下一題';

  el('nextBtn')
    .classList.remove('hidden');
}

function next(){

  current++;

  if(current < quiz.length){

    showQuestion();

  }else{

    showResult();
  }
}

function showResult(){

  el('quiz')
    .classList.add('hidden');

  el('result')
    .classList.remove('hidden');

  const pct =
    Math.round(
      correct / quiz.length * 100
    );

  el('resultText').textContent =
    `${correct} / ${quiz.length} 題，答對率 ${pct}%`;

  const list =
    el('wrongList');

  list.innerHTML =
    wrongAnswers.length
      ? '<h2>錯題解答</h2>'
      : '<p>全部答對！</p>';

  wrongAnswers.forEach(
    (item,idx) => {

      const q = item.q;

      const right =
        normalizeAnswer(
          q['正確答案']
        );

      const chosen =
        normalizeAnswer(
          item.chosen
        );

      const div =
        document.createElement(
          'article'
        );

      div.className =
        'wrong-item';

      div.innerHTML =
        `<h3>
          ${idx + 1}.
          [${q['級別']}｜${q['考科']}]
          ${q['題目']}
        </h3>

        <p>
          你的答案：
          ${chosen || '未作答'}
          ${
            chosen
              ? '－' + answerText(q, chosen)
              : ''
          }
        </p>

        <p>
          <strong>
            正確答案：
            ${right}－${answerText(q, right)}
          </strong>
        </p>

        <p>
          ${q['解析'] || ''}
        </p>`;

      list.appendChild(div);
    }
  );

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}

el('startBtn').onclick =
  startQuiz;

el('nextBtn').onclick =
  next;

el('restartBtn').onclick =
  () => {

    el('result')
      .classList.add('hidden');

    el('setup')
      .classList.remove('hidden');

    window.scrollTo({
      top:0,
      behavior:'smooth'
    });
  };

loadBank();
