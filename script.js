function numberToSpanishWords(n) {
  if (n === 0) {
    return "cero";
  }
  if (n < 0) {
    return "menos " + numberToSpanishWords(Math.abs(n));
  }

  const units = [
    "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"
  ];
  const tens = [
    "", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"
  ];
  const hundreds = [
    "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"
  ];

  function convertLessThanOneThousand(num) {
    let result = "";
    if (num >= 100) {
      if (num === 100) {
        result += "cien";
      } else {
        result += hundreds[Math.floor(num / 100)];
      }
      num %= 100;
      if (num > 0) {
        result += " ";
      }
    }
    if (num > 0) {
      if (num < 20) {
        result += units[num];
      } else {
        result += tens[Math.floor(num / 10)];
        if (num % 10 > 0) {
          result += " y " + units[num % 10];
        }
      }
    }
    return result;
  }

  let words = [];
  let chunkIndex = 0;
  const scales = ["", "mil", "millón", "billón"];

  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      let chunkWords = convertLessThanOneThousand(chunk);
      if (chunkIndex === 1) { // thousands
        if (chunk === 1) { // special case for "mil" instead of "un mil"
          words.unshift("mil");
        } else {
          words.unshift(chunkWords + " mil");
        }
      } else if (chunkIndex > 1) { // millions, billions etc.
        let scaleWord = scales[chunkIndex];
        if (chunk > 1) { // plural for millions, billions
          scaleWord += "es";
        }
        words.unshift(chunkWords + " " + scaleWord);
      } else { // units
        words.unshift(chunkWords);
      }
    }
    n = Math.floor(n / 1000);
    chunkIndex++;
  }

  return words.join(" ").trim();
}

// 1. 獲取所有需要的 HTML 元素
const mainActionBtn = document.getElementById('main-action-btn'); // 開始練習按鈕
const repeatBtn = document.getElementById('repeat-btn');
const actionBtn = document.getElementById('action-btn'); // 檢查答案/下一題按鈕
const answerInput = document.getElementById('answer-input');
const resultMessage = document.getElementById('result-message');

// 2. 全域變數
let currentNumber = 0;
let currentSpanishText = '';

// 3. 初始化語音合成器
const synth = window.speechSynthesis;

// ==========================================================
// 核心 UX 邏輯：全新的三階段 UI 狀態管理器
// ==========================================================
function updateUIState(state) {
    // 首先隱藏或禁用所有互動元素
    repeatBtn.disabled = true;
    answerInput.disabled = true;
    actionBtn.disabled = true;
    mainActionBtn.style.display = 'none'; // 先隱藏主按鈕

    if (state === 'listening') {
        // 階段一：聽音檔
        // 顯示測驗元件並啟用功能
        document.querySelector('.quiz-area').style.display = 'flex';
        repeatBtn.disabled = false;
        answerInput.disabled = false;
        actionBtn.disabled = false;
        actionBtn.textContent = '檢查答案'; // 顯示檢查答案按鈕
        answerInput.focus(); // 自動聚焦到輸入框
        
    } else if (state === 'answer_checked') {
        // 階段二：已檢查答案
        // 保持測驗元件顯示，使用者仍可重聽題目
        document.querySelector('.quiz-area').style.display = 'flex';
        repeatBtn.disabled = false; // 啟用重聽按鈕
        actionBtn.disabled = false;
        actionBtn.textContent = '⏭️ 下一題'; // 顯示下一題按鈕

    } else { // state === 'initial'
        // 初始狀態
        // 只顯示「開始練習」按鈕，隱藏測驗元件
        document.querySelector('.quiz-area').style.display = 'none';
        mainActionBtn.textContent = '▶️ 開始練習';
        mainActionBtn.style.display = 'block';
    }
}

// 播放語音的函式
function speak(text) {
    if (synth.speaking) {
        synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    synth.speak(utterance);
}

// 產生新題目的函式 (現在由主按鈕觸發)
function startNewQuestion() {
    currentNumber = Math.floor(Math.random() * 100);
    currentSpanishText = numberToSpanishWords(currentNumber);

    answerInput.value = '';
    resultMessage.textContent = '';
    resultMessage.className = 'result';

    speak(currentSpanishText);
    
    // 進入「聽音檔」階段
    updateUIState('listening');
}

// 檢查答案的函式
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value, 10);

    resultMessage.className = 'result';

    if (isNaN(userAnswer)) {
        resultMessage.textContent = '請輸入有效的數字。';
        return; 
    }

    if (userAnswer === currentNumber) {
        resultMessage.textContent = `✅ ¡Correcto! 答案就是 ${currentNumber}。`;
        resultMessage.classList.add('correct');
    } else {
        resultMessage.textContent = `❌ 不對喔。正確答案是 ${currentNumber}。`;
        resultMessage.classList.add('incorrect');
    }
    
    // 進入「已檢查答案」階段
    updateUIState('answer_checked');
}

// ==========================================================
// 4. 設定事件監聽
// ==========================================================
mainActionBtn.addEventListener('click', startNewQuestion);

repeatBtn.addEventListener('click', () => {
    if (currentSpanishText) {
        speak(currentSpanishText);
    }
});

actionBtn.addEventListener('click', () => {
    if (actionBtn.textContent === '檢查答案') {
        checkAnswer();
    } else if (actionBtn.textContent === '⏭️ 下一題') {
        startNewQuestion();
    }
});

answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !actionBtn.disabled && actionBtn.textContent === '檢查答案') {
        checkAnswer();
    }
});

// ==========================================================
// 5. 頁面載入時的初始設定
// ==========================================================
updateUIState('initial'); // 設置初始狀態