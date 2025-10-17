function numberToSpanishWords(n) {
  if (n === 0) {
    return "cero";
  }
  if (n < 0) {
    return "menos " + numberToSpanishWords(Math.abs(n));
  }

  const units = [
    "", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
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

// 語音設定相關元素
const voiceSelect = document.getElementById('voice-select');
const testVoiceBtn = document.getElementById('test-voice-btn');
const rateSlider = document.getElementById('rate-slider');
const pitchSlider = document.getElementById('pitch-slider');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const voiceSettings = document.querySelector('.voice-settings');
const voiceSettingsBtn = document.getElementById('voice-settings-btn');

// 數字按鈕相關元素
const numberPad = document.getElementById('number-pad');
const numberDisplay = document.getElementById('number-display');
const numberButtons = document.querySelectorAll('.number-btn');

// 2. 全域變數
let currentNumber = 0;
let currentSpanishText = '';
let currentInputValue = '0'; // 數字按鈕的當前值

// 3. 初始化語音合成器
const synth = window.speechSynthesis;
let voices = [];
let spanishVoice = null;

// 載入可用的語音
function loadVoices() {
    const allVoices = synth.getVoices();
    
    // 只保留西班牙語語音
    voices = allVoices.filter(voice => voice.lang.startsWith('es'));
    
    // 更新語音選擇下拉選單
    updateVoiceSelect();
    
    // 尋找最佳的西班牙語語音
    spanishVoice = voices.find(voice => 
        voice.name.includes('Spanish') || 
        voice.name.includes('Español') ||
        voice.name.includes('es-ES') ||
        voice.name.includes('es-MX')
    );
    
    // 如果找不到特定的西班牙語語音，使用第一個西班牙語語音
    if (!spanishVoice && voices.length > 0) {
        spanishVoice = voices[0];
    }
    
    // 如果完全沒有西班牙語語音，使用第一個可用的語音作為備用
    if (!spanishVoice && allVoices.length > 0) {
        spanishVoice = allVoices[0];
        console.warn('未找到西班牙語語音，使用備用語音:', spanishVoice.name);
    }
    
    console.log('所有語音:', allVoices.map(v => `${v.name} (${v.lang})`));
    console.log('西班牙語語音:', voices.map(v => `${v.name} (${v.lang})`));
    console.log('選中的語音:', spanishVoice ? `${spanishVoice.name} (${spanishVoice.lang})` : 'None');
}

// 更新語音選擇下拉選單
function updateVoiceSelect() {
    if (!voiceSelect) return;
    
    voiceSelect.innerHTML = '';
    
    if (voices.length === 0) {
        voiceSelect.innerHTML = '<option value="">未找到西班牙語語音</option>';
        return;
    }
    
    // 只添加西班牙語語音選項
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        // 格式化語音名稱，移除語言代碼（因為都是西班牙語）
        let displayName = voice.name;
        if (displayName.includes('Spanish')) {
            displayName = displayName.replace('Spanish', '').trim();
        }
        if (displayName.includes('Español')) {
            displayName = displayName.replace('Español', '').trim();
        }
        
        // 添加地區標識
        let regionFlag = '🇪🇸';
        if (voice.lang.includes('MX')) {
            regionFlag = '🇲🇽';
        } else if (voice.lang.includes('AR')) {
            regionFlag = '🇦🇷';
        } else if (voice.lang.includes('CO')) {
            regionFlag = '🇨🇴';
        } else if (voice.lang.includes('PE')) {
            regionFlag = '🇵🇪';
        }
        
        option.textContent = `${displayName} ${regionFlag}`;
        voiceSelect.appendChild(option);
    });
    
    // 設定預設選中的語音
    if (spanishVoice) {
        const spanishIndex = voices.indexOf(spanishVoice);
        if (spanishIndex !== -1) {
            voiceSelect.value = spanishIndex;
        }
    }
}

// 監聽語音載入事件
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}

// 立即嘗試載入語音
loadVoices();

// 檢測是否為手機設備
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

// 更新數字顯示
function updateNumberDisplay() {
    if (numberDisplay) {
        numberDisplay.textContent = currentInputValue;
    }
    if (answerInput) {
        answerInput.value = currentInputValue;
    }
}

// 處理數字按鈕點擊
function handleNumberButtonClick(button) {
    const number = button.dataset.number;
    const action = button.dataset.action;
    
    if (number !== undefined) {
        // 數字按鈕
        if (currentInputValue === '0') {
            currentInputValue = number;
        } else {
            currentInputValue += number;
        }
        updateNumberDisplay();
    } else if (action === 'clear') {
        // 清除按鈕
        currentInputValue = '0';
        updateNumberDisplay();
    } else if (action === 'backspace') {
        // 退格按鈕
        if (currentInputValue.length > 1) {
            currentInputValue = currentInputValue.slice(0, -1);
        } else {
            currentInputValue = '0';
        }
        updateNumberDisplay();
    }
}

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
    return new Promise((resolve, reject) => {
        try {
            // 停止當前播放
            if (synth.speaking) {
                synth.cancel();
            }
            
            // 等待一小段時間確保停止完成
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // 設定語言
                utterance.lang = 'es-ES';
                
                // 從設定面板獲取語音參數
                const rate = rateSlider ? parseFloat(rateSlider.value) : 0.8;
                const pitch = pitchSlider ? parseFloat(pitchSlider.value) : 1.0;
                
                utterance.rate = rate;
                utterance.pitch = pitch;
                utterance.volume = 1.0; // 最大音量
                
                // 從語音選擇器獲取選中的語音
                if (voiceSelect && voiceSelect.value !== '') {
                    const selectedIndex = parseInt(voiceSelect.value);
                    if (voices[selectedIndex]) {
                        utterance.voice = voices[selectedIndex];
                    }
                } else if (spanishVoice) {
                    utterance.voice = spanishVoice;
                }
                
                // 設定事件監聽器
                utterance.onstart = () => {
                    console.log('語音播放開始');
                };
                
                utterance.onend = () => {
                    console.log('語音播放結束');
                    resolve();
                };
                
                utterance.onerror = (event) => {
                    console.error('語音播放錯誤:', event.error);
                    reject(event.error);
                };
                
                // 播放語音
                synth.speak(utterance);
                
            }, 100);
            
        } catch (error) {
            console.error('語音播放失敗:', error);
            reject(error);
        }
    });
}

// 產生新題目的函式 (現在由主按鈕觸發)
async function startNewQuestion() {
    currentNumber = Math.floor(Math.random() * 1000);
    currentSpanishText = numberToSpanishWords(currentNumber);

    // 重置輸入值
    currentInputValue = '0';
    answerInput.value = '';
    resultMessage.textContent = '';
    resultMessage.className = 'result';
    
    // 更新數字顯示
    updateNumberDisplay();

    try {
        await speak(currentSpanishText);
        // 進入「聽音檔」階段
        updateUIState('listening');
    } catch (error) {
        console.error('語音播放失敗:', error);
        // 即使語音播放失敗，也進入聽音檔階段
        updateUIState('listening');
        resultMessage.textContent = '⚠️ 語音播放失敗，請檢查瀏覽器設定';
        resultMessage.className = 'result';
    }
}

// 檢查答案的函式
function checkAnswer() {
    // 優先使用輸入框的值，如果為空則使用數字按鈕的值
    let userInputValue = answerInput.value.trim();
    if (!userInputValue) {
        userInputValue = currentInputValue;
    }
    
    const userAnswer = parseInt(userInputValue, 10);

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
    
    // 同步更新 currentInputValue
    currentInputValue = userInputValue;
    updateNumberDisplay();
    
    // 進入「已檢查答案」階段
    updateUIState('answer_checked');
}

// ==========================================================
// 4. 設定事件監聽
// ==========================================================
mainActionBtn.addEventListener('click', startNewQuestion);

repeatBtn.addEventListener('click', async () => {
    if (currentSpanishText) {
        try {
            await speak(currentSpanishText);
        } catch (error) {
            console.error('重複播放失敗:', error);
            resultMessage.textContent = '⚠️ 語音播放失敗，請檢查瀏覽器設定';
            resultMessage.className = 'result';
        }
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

// 同步輸入框的變化到數字按鈕顯示
answerInput.addEventListener('input', () => {
    currentInputValue = answerInput.value;
    updateNumberDisplay();
});

// 語音設定面板事件監聽器
if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
        const selectedIndex = parseInt(voiceSelect.value);
        if (voices[selectedIndex]) {
            spanishVoice = voices[selectedIndex];
            console.log('語音已更改為:', spanishVoice.name);
        }
    });
}

if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', async () => {
        try {
            await speak('uno dos tres');
        } catch (error) {
            console.error('測試語音失敗:', error);
        }
    });
}

if (rateSlider && rateValue) {
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });
}

if (pitchSlider && pitchValue) {
    pitchSlider.addEventListener('input', () => {
        pitchValue.textContent = pitchSlider.value;
    });
}

// 語音設定面板顯示/隱藏
if (voiceSettingsBtn && voiceSettings) {
    voiceSettingsBtn.addEventListener('click', () => {
        if (voiceSettings.style.display === 'none') {
            voiceSettings.style.display = 'block';
            voiceSettingsBtn.textContent = '❌ 關閉設定';
        } else {
            voiceSettings.style.display = 'none';
            voiceSettingsBtn.textContent = '⚙️ 語音設定';
        }
    });
}

// 數字按鈕事件監聽器
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        handleNumberButtonClick(button);
    });
});

// ==========================================================
// 5. 頁面載入時的初始設定
// ==========================================================

// 檢查瀏覽器是否支援語音合成
function checkSpeechSynthesisSupport() {
    if (!('speechSynthesis' in window)) {
        console.error('此瀏覽器不支援語音合成');
        resultMessage.textContent = '⚠️ 您的瀏覽器不支援語音功能，請使用 Chrome、Safari 或 Edge';
        resultMessage.className = 'result';
        return false;
    }
    return true;
}

// 初始化應用
function initializeApp() {
    if (checkSpeechSynthesisSupport()) {
        // 延遲載入語音，確保頁面完全載入
        setTimeout(() => {
            loadVoices();
        }, 1000);
    }
    
    // 根據設備類型設定輸入方式
    if (isMobileDevice()) {
        // 手機設備：隱藏輸入框，顯示數字按鈕
        if (answerInput) {
            answerInput.style.display = 'none';
        }
        if (numberPad) {
            numberPad.style.display = 'block';
        }
    } else {
        // 桌面設備：顯示輸入框，隱藏數字按鈕
        if (answerInput) {
            answerInput.style.display = 'block';
        }
        if (numberPad) {
            numberPad.style.display = 'none';
        }
    }
    
    // 初始化數字顯示
    updateNumberDisplay();
    
    updateUIState('initial');
}

// 頁面載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 監聽視窗大小變化，重新調整輸入方式
window.addEventListener('resize', () => {
    // 延遲執行，避免頻繁觸發
    setTimeout(() => {
        if (isMobileDevice()) {
            // 手機設備：隱藏輸入框，顯示數字按鈕
            if (answerInput) {
                answerInput.style.display = 'none';
            }
            if (numberPad) {
                numberPad.style.display = 'block';
            }
        } else {
            // 桌面設備：顯示輸入框，隱藏數字按鈕
            if (answerInput) {
                answerInput.style.display = 'block';
            }
            if (numberPad) {
                numberPad.style.display = 'none';
            }
        }
    }, 100);
});