const screens = [...document.querySelectorAll(".screen")];
const startScreen = document.querySelector("#startScreen");
const quizScreen = document.querySelector("#quizScreen");
const resultScreen = document.querySelector("#resultScreen");
const nextButton = document.querySelector("#nextButton");
const choices = document.querySelector("#choices");
const answerForm = document.querySelector("#answerForm");
const answerInput = document.querySelector("#answerInput");
const answerButton = document.querySelector("#answerButton");

let questions = [];
let current = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let mistakes = [];

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

const kanjiRunPattern = /([\p{Script=Han}々〆ヵヶ]+)/gu;
const kanjiOnlyPattern = /^[\p{Script=Han}々〆ヵヶ]+$/u;

function primaryReading(reading) {
  return reading.split(/[／/]/)[0].replace(/[～\s]/g, "");
}

function furiganaHtml(word) {
  const reading = primaryReading(word.reading);
  const segments = word.jp.split(kanjiRunPattern).filter(Boolean);
  let cursor = 0;

  return segments.map((segment, index) => {
    if (!kanjiOnlyPattern.test(segment)) {
      const literal = segment.replace(/[～\s]/g, "");
      if (literal) {
        const position = reading.indexOf(literal, cursor);
        if (position >= cursor) cursor = position + literal.length;
      }
      return escapeHtml(segment);
    }

    const nextLiteral = segments.slice(index + 1)
      .find((part) => !kanjiOnlyPattern.test(part) && part.replace(/[～\s]/g, ""));
    const nextText = nextLiteral?.replace(/[～\s]/g, "") || "";
    const nextPosition = nextText ? reading.lastIndexOf(nextText) : -1;
    const rubyText = nextPosition >= cursor ? reading.slice(cursor, nextPosition) : reading.slice(cursor);
    cursor += rubyText.length;

    return rubyText
      ? `<ruby>${escapeHtml(segment)}<rt>${escapeHtml(rubyText)}</rt></ruby>`
      : escapeHtml(segment);
  }).join("");
}

function exampleHtml(word, example) {
  if (!example) return furiganaHtml(word);
  const position = example.indexOf(word.jp);
  if (position < 0) return escapeHtml(example);
  return `${escapeHtml(example.slice(0, position))}${furiganaHtml(word)}${escapeHtml(example.slice(position + word.jp.length))}`;
}

function showScreen(screen) {
  screens.forEach((item) => item.classList.toggle("is-active", item === screen));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupOptionGroup(selector) {
  document.querySelectorAll(selector).forEach((option) => {
    option.addEventListener("click", () => {
      document.querySelectorAll(selector).forEach((item) => item.classList.remove("is-selected"));
      option.classList.add("is-selected");
    });
  });
}

setupOptionGroup(".mode-option");
setupOptionGroup(".count-option");

function selectedQuestionCount(source, reviewMode) {
  if (reviewMode) return source.length;
  const raw = document.querySelector('input[name="count"]:checked').value;
  return raw === "all" ? source.length : Math.min(Number(raw), source.length);
}

function buildQuestions(source = words, reviewMode = false) {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const size = selectedQuestionCount(source, reviewMode);
  return shuffle(source).slice(0, size).map((word) => ({
    word,
    direction: mode === "mixed" ? (Math.random() > 0.5 ? "jp-ko" : "ko-jp") : mode,
  }));
}

function startQuiz(source = words, reviewMode = false) {
  questions = buildQuestions(source, reviewMode);
  current = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  mistakes = [];
  showScreen(quizScreen);
  renderQuestion();
}

function buildOptions(answer) {
  const pool = shuffle(words.filter((word) => word.id !== answer.id));
  const sameCategory = pool.filter((word) => word.category === answer.category).slice(0, 3);
  const selectedIds = new Set(sameCategory.map((word) => word.id));
  const others = pool.filter((word) => !selectedIds.has(word.id));
  return shuffle([answer, ...sameCategory, ...others].slice(0, 4));
}

function renderQuestion() {
  const { word, direction } = questions[current];
  const isJpKo = direction === "jp-ko";
  const total = questions.length;

  document.querySelector("#questionNumber").textContent =
    `${String(current + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  document.querySelector("#scoreLabel").textContent = `정답 ${score}`;
  document.querySelector("#progressBar").style.width = `${((current + 1) / total) * 100}%`;
  document.querySelector("#questionType").textContent = isJpKo
    ? "이 표현의 뜻은?"
    : "이 뜻에 맞는 일본어 표현은?";

  const question = document.querySelector("#question");
  if (isJpKo) question.innerHTML = furiganaHtml(word);
  else question.textContent = word.ko;
  question.classList.toggle("is-korean", !isJpKo);
  document.querySelector("#reading").textContent = isJpKo
    ? categoryNames[word.category]
    : `${categoryNames[word.category]} · 한자 또는 히라가나로 입력하세요`;

  choices.hidden = !isJpKo;
  answerForm.hidden = isJpKo;
  choices.innerHTML = isJpKo ? buildOptions(word).map((item, index) => `
    <button class="choice" type="button" data-id="${item.id}">
      <span class="letter">${String.fromCharCode(65 + index)}</span>
      <span>${escapeHtml(item.ko)}</span>
    </button>
  `).join("") : "";
  answerInput.value = "";
  answerInput.disabled = false;
  answerButton.disabled = false;
  answerForm.classList.remove("is-correct", "is-wrong");
  if (!isJpKo) requestAnimationFrame(() => answerInput.focus());

  const feedback = document.querySelector("#feedback");
  feedback.hidden = true;
  feedback.classList.remove("is-wrong");
  nextButton.hidden = true;
}

function normalizeJapanese(value) {
  return value.normalize("NFKC").replace(/\s/g, "").replace(/^[~〜～]/, "");
}

function isTypedAnswerCorrect(word, value) {
  const submitted = normalizeJapanese(value);
  const accepted = [word.jp, ...word.reading.split(/[／/]/)]
    .map(normalizeJapanese);
  return accepted.includes(submitted);
}

function splitNote(note) {
  const marker = "예: ";
  const markerIndex = note.indexOf(marker);
  if (markerIndex < 0) return { explanation: note, example: "" };
  return {
    explanation: note.slice(0, markerIndex).trim(),
    example: note.slice(markerIndex + marker.length).trim(),
  };
}

function completeAnswer(correct, selected = null) {
  const { word, direction } = questions[current];
  if (direction === "jp-ko") {
    [...choices.children].forEach((button) => {
      button.disabled = true;
      if (Number(button.dataset.id) === word.id) button.classList.add("correct");
    });
    if (!correct && selected) selected.classList.add("wrong");
  } else {
    answerInput.disabled = true;
    answerButton.disabled = true;
    answerForm.classList.add(correct ? "is-correct" : "is-wrong");
  }

  if (correct) {
    score += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    streak = 0;
    if (!mistakes.some((item) => item.id === word.id)) mistakes.push(word);
  }

  const feedback = document.querySelector("#feedback");
  const { explanation, example } = splitNote(word.note);
  feedback.hidden = false;
  feedback.classList.toggle("is-wrong", !correct);
  document.querySelector("#feedbackIcon").textContent = correct ? "✓" : "!";
  document.querySelector("#feedbackTitle").textContent = correct
    ? "정답이에요"
    : `정답은 ${direction === "jp-ko" ? word.ko : word.jp}`;
  document.querySelector("#feedbackNote").textContent = explanation;
  document.querySelector("#exampleJp").innerHTML = exampleHtml(word, example);
  document.querySelector("#exampleKo").textContent = categoryNames[word.category];
  document.querySelector("#scoreLabel").textContent = `정답 ${score}`;
  nextButton.innerHTML = current === questions.length - 1
    ? '결과 보기 <span>→</span>'
    : '다음 문제 <span>→</span>';
  nextButton.hidden = false;
}

choices.addEventListener("click", (event) => {
  const selected = event.target.closest(".choice");
  if (!selected || selected.disabled) return;
  const { word } = questions[current];
  completeAnswer(Number(selected.dataset.id) === word.id, selected);
});

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (answerInput.disabled || !answerInput.value.trim()) return;
  const { word } = questions[current];
  completeAnswer(isTypedAnswerCorrect(word, answerInput.value));
});

function finishQuiz() {
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  document.querySelector("#finalScore").textContent = score;
  document.querySelector("#finalScore").nextElementSibling.textContent = `/ ${total}`;
  document.querySelector("#accuracy").textContent = `${percent}%`;
  document.querySelector("#bestStreak").textContent = bestStreak;
  document.querySelector("#wrongCount").textContent = mistakes.length;
  document.querySelector("#resultRing").style.setProperty("--score-angle", `${percent * 3.6}deg`);
  document.querySelector("#resultTitle").textContent = percent === 100
    ? "완벽하게 익혔어요!"
    : percent >= 80
      ? "거의 다 익혔어요!"
      : percent >= 50
        ? "좋은 흐름이에요!"
        : "한 번 더 풀어볼까요?";
  document.querySelector("#resultMessage").textContent = percent === 100
    ? "선택한 모든 표현을 정확히 기억하고 있어요."
    : `${mistakes.length}개 표현만 다시 보면 훨씬 단단해질 거예요.`;
  document.querySelector("#reviewButton").disabled = mistakes.length === 0;
  showScreen(resultScreen);
}

nextButton.addEventListener("click", () => {
  if (current < questions.length - 1) {
    current += 1;
    renderQuestion();
  } else {
    finishQuiz();
  }
});

document.querySelector("#startButton").addEventListener("click", () => startQuiz());
document.querySelector("#quitButton").addEventListener("click", () => showScreen(startScreen));
document.querySelector("#retryButton").addEventListener("click", () => startQuiz());
document.querySelector("#reviewButton").addEventListener("click", () => {
  const reviewWords = [...mistakes];
  if (reviewWords.length) startQuiz(reviewWords, true);
});

document.addEventListener("keydown", (event) => {
  if (!quizScreen.classList.contains("is-active")) return;
  if (!choices.hidden && ["1", "2", "3", "4"].includes(event.key)) choices.children[Number(event.key) - 1]?.click();
  if (event.key === "Enter" && !nextButton.hidden) nextButton.click();
});
