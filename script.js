// ---------- Word list used to build random text ----------
const WORDS = [
  "variable", "function", "array", "loop", "string", "object", "class", "method",
  "browser", "server", "database", "network", "memory", "compile", "debug", "syntax",
  "binary", "stack", "queue", "pointer", "logic", "input", "output", "keyboard",
  "screen", "program", "code", "data", "file", "system", "design", "build",
  "learn", "write", "read", "test", "run", "fast", "smart", "simple",
  "practice", "speed", "focus", "skill", "project", "engineer", "student", "college"
];

// ---------- DOM elements ----------
const textEl = document.getElementById("text");
const inputEl = document.getElementById("input");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accEl = document.getElementById("accuracy");
const bestEl = document.getElementById("best");
const resultEl = document.getElementById("result");
const modesEl = document.getElementById("modes");
const areaEl = document.getElementById("typingArea");

// ---------- State ----------
let timeLimit = 30;
let timeLeft = timeLimit;
let timer = null;
let started = false;
let finished = false;
let text = "";
let chars = [];          // <span> for each character
let prevLength = 0;
let totalKeys = 0;       // all characters typed (not counting backspace)
let goodKeys = 0;        // characters typed correctly at the moment of typing

// ---------- Best score (saved in the browser) ----------
function getBest() {
  try { return Number(localStorage.getItem("bestWpm")) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem("bestWpm", v); } catch (e) {}
}

// ---------- Build the text ----------
function generateText(count = 150) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return out.join(" ");
}

function renderText() {
  textEl.innerHTML = "";
  chars = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.textContent = ch;
    textEl.appendChild(span);
    chars.push(span);
  }
  chars[0].classList.add("current");
}

// ---------- Calculations ----------
function countCorrect() {
  const typed = inputEl.value;
  let c = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) c++;
  }
  return c;
}

function calcWpm() {
  const elapsed = timeLimit - timeLeft;          // seconds
  if (elapsed <= 0) return 0;
  // Standard rule: 1 word = 5 characters
  return Math.round((countCorrect() / 5) / (elapsed / 60));
}

function calcAccuracy() {
  return totalKeys === 0 ? 100 : Math.round((goodKeys / totalKeys) * 100);
}

function updateStats() {
  wpmEl.textContent = calcWpm();
  accEl.textContent = calcAccuracy();
}

// ---------- Timer ----------
function startTest() {
  started = true;
  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    updateStats();
    if (timeLeft <= 0) finishTest();
  }, 1000);
}

function finishTest() {
  clearInterval(timer);
  finished = true;
  inputEl.disabled = true;

  const wpm = calcWpm();
  const acc = calcAccuracy();
  document.getElementById("rWpm").textContent = wpm;
  document.getElementById("rAcc").textContent = acc;
  document.getElementById("rErr").textContent = totalKeys - goodKeys;

  let msg = wpm < 30 ? "Keep practising, you'll improve fast!"
          : wpm < 50 ? "Good speed! Aim for 50+ next."
          : wpm < 70 ? "Great typing speed!"
          : "Excellent! You type faster than most people.";
  if (wpm > getBest()) {
    saveBest(wpm);
    bestEl.textContent = wpm;
    msg = "🏆 New personal best! " + msg;
  }
  document.getElementById("rMsg").textContent = msg;
  resultEl.classList.remove("hidden");
}

// ---------- Handle typing ----------
inputEl.addEventListener("input", () => {
  if (finished) return;
  if (!started) startTest();

  const typed = inputEl.value;

  // Count only newly added characters (ignore backspace)
  if (typed.length > prevLength) {
    totalKeys++;
    if (typed[typed.length - 1] === text[typed.length - 1]) goodKeys++;
  }
  prevLength = typed.length;

  // Colour each character
  chars.forEach((span, i) => {
    span.className = "";
    if (i < typed.length) {
      span.classList.add(typed[i] === text[i] ? "correct" : "wrong");
    } else if (i === typed.length) {
      span.classList.add("current");
    }
  });

  // Keep the current character visible by scrolling the text up
  const current = chars[typed.length];
  if (current) {
    const line = Math.floor(current.offsetTop / 34) ;   // ~line height in px
    textEl.style.transform = "translateY(" + (-Math.max(0, line - 1) * 34) + "px)";
  }

  updateStats();

  // Finished all the text early
  if (typed.length >= text.length) finishTest();
});

// Block paste so the test can't be cheated
inputEl.addEventListener("paste", e => e.preventDefault());

// ---------- Reset / Restart ----------
function resetTest() {
  clearInterval(timer);
  started = false;
  finished = false;
  timeLeft = timeLimit;
  prevLength = 0;
  totalKeys = 0;
  goodKeys = 0;

  text = generateText();
  inputEl.value = "";
  inputEl.disabled = false;
  inputEl.maxLength = text.length;
  textEl.style.transform = "translateY(0)";

  timeEl.textContent = timeLeft;
  wpmEl.textContent = 0;
  accEl.textContent = 100;
  bestEl.textContent = getBest();
  resultEl.classList.add("hidden");

  renderText();
  inputEl.focus();
}

// ---------- Events ----------
document.getElementById("restart").addEventListener("click", resetTest);
areaEl.addEventListener("click", () => inputEl.focus());

modesEl.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  modesEl.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  timeLimit = Number(btn.dataset.time);
  resetTest();
});

// Tab key = quick restart
document.addEventListener("keydown", e => {
  if (e.key === "Tab") { e.preventDefault(); resetTest(); }
});

resetTest();