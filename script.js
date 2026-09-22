const words = [
  { jp:"～としての", reading:"～としての", ko:"~로서의", note:"명사 + として(~로서) + の(뒤의 명사를 수식)", example:"正式路線名としての「山手線」", translation:"정식 노선명으로서의 ‘야마노테선’" },
  { jp:"～を結ぶ", reading:"～を むすぶ", ko:"~을 잇다 · 연결하다", note:"結ぶ는 떨어진 것을 이어 관계를 만드는 동사예요.", example:"品川駅と田端駅を結ぶ路線", translation:"시나가와역과 다바타역을 잇는 노선" },
  { jp:"及び", reading:"および", ko:"및 · 그리고", note:"공문이나 설명문에서 쓰는 격식 있는 연결 표현이에요.", example:"事業基本計画及び鉄道要覧", translation:"사업기본계획 및 철도요람" },
  { jp:"～でもある", reading:"～でもある", ko:"~이기도 하다", note:"である(~이다)에 も(~도)가 들어간 형태예요.", example:"山手線の区間でもある。", translation:"야마노테선의 구간이기도 하다." },
  { jp:"～を除き", reading:"～を のぞき", ko:"~을 제외하고", note:"除く(제외하다)의 연용형으로 공문에서 자주 보여요.", example:"一部区間を除き、ほぼ全線複々線である。", translation:"일부 구간을 제외하고 거의 전 구간이 복복선이다." },
  { jp:"ほぼ", reading:"ほぼ", ko:"거의 · 대체로", note:"어떤 수치나 상태가 완전한 수준에 아주 가까움을 나타내요.", example:"ほぼ全線", translation:"거의 전 구간" },
  { jp:"～であるが", reading:"～であるが", ko:"~이지만", note:"문어체 である(~이다)와 역접의 が(~지만)가 합쳐졌어요.", example:"複々線であるが、このうち…", translation:"복복선이지만, 이 가운데…" },
  { jp:"このうち", reading:"このうち", ko:"이 중에서 · 이 가운데", note:"앞서 말한 여러 대상 중 일부를 골라 말할 때 써요.", example:"このうちの貨物列車が走る線路", translation:"이 가운데 화물열차가 운행하는 선로" },
  { jp:"～や～", reading:"～や～", ko:"~나 ~ 등", note:"여러 예 가운데 대표적인 몇 가지를 나열해요.", example:"特急列車や貨物列車", translation:"특급열차나 화물열차 등" },
  { jp:"～の走る", reading:"～の はしる", ko:"~가 달리는 · 운행하는", note:"열차가 주어일 때 走る는 자연스럽게 ‘운행하다’로 옮겨요.", example:"貨物列車の走る線路", translation:"화물열차가 운행하는 선로" },
  { jp:"～と呼ぶ", reading:"～と よぶ", ko:"~라고 부르다", note:"AをBと呼ぶ는 ‘A를 B라고 부르다’라는 구조예요.", example:"この線路を「山手貨物線」と呼ぶ。", translation:"이 선로를 ‘야마노테 화물선’이라고 부른다." },
  { jp:"このほか", reading:"このほか", ko:"이 밖에 · 그 외에도", note:"この(이) + ほか(밖, 다른 것)로 내용을 덧붙일 때 써요.", example:"このほか、別線も使われている。", translation:"이 밖에도 별도 선로가 사용되고 있다." },
  { jp:"～において", reading:"～において", ko:"~에서 · ~에 있어서", note:"장소·범위의 で를 격식 있고 문어적으로 나타내요.", example:"代々木駅―新宿駅間において", translation:"요요기역~신주쿠역 구간에서" },
  { jp:"～で乗り入れている", reading:"～で のりいれている", ko:"~을 통해 직통 운행하고 있다", note:"乗り入れる(다른 노선에 직통 운행하다) + ている(지속)이에요.", example:"中央線が別線で乗り入れている。", translation:"주오선이 별도 선로를 통해 직통 운행하고 있다." },
  { jp:"乗る", reading:"のる", ko:"타다 · 올라타다", note:"탈것에 올라타는 동작. 乗り入れる에서는 乗り가 돼요.", example:"電車に乗る。", translation:"전철을 타다." },
  { jp:"入れる", reading:"いれる", ko:"넣다 · 들이다", note:"무언가를 안으로 넣는 타동사로, 자동사 入る와 짝을 이뤄요.", example:"箱に本を入れる。", translation:"상자에 책을 넣다." }
];
const screens=[...document.querySelectorAll(".screen")],startScreen=document.querySelector("#startScreen"),quizScreen=document.querySelector("#quizScreen"),resultScreen=document.querySelector("#resultScreen"),nextButton=document.querySelector("#nextButton"),choices=document.querySelector("#choices");
let questions=[],current=0,score=0,streak=0,bestStreak=0,mistakes=[];
const shuffle=list=>[...list].sort(()=>Math.random()-.5);
function showScreen(screen){screens.forEach(item=>item.classList.toggle("is-active",item===screen));window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll(".mode-option").forEach(option=>option.addEventListener("click",()=>{document.querySelectorAll(".mode-option").forEach(item=>item.classList.remove("is-selected"));option.classList.add("is-selected");}));
function buildQuestions(source=words){const mode=document.querySelector('input[name="mode"]:checked').value,size=Math.min(10,source.length);return shuffle(source).slice(0,size).map(word=>({word,direction:mode==="mixed"?(Math.random()>.5?"jp-ko":"ko-jp"):mode}));}
function startQuiz(source=words){questions=buildQuestions(source);current=0;score=0;streak=0;bestStreak=0;mistakes=[];showScreen(quizScreen);renderQuestion();}
function renderQuestion(){
  const {word,direction}=questions[current],isJpKo=direction==="jp-ko";
  document.querySelector("#questionNumber").textContent=`${String(current+1).padStart(2,"0")} / ${String(questions.length).padStart(2,"0")}`;
  document.querySelector("#scoreLabel").textContent=`정답 ${score}`;document.querySelector("#progressBar").style.width=`${((current+1)/questions.length)*100}%`;
  document.querySelector("#questionType").textContent=isJpKo?"이 표현의 뜻은?":"이 뜻에 맞는 일본어 표현은?";
  const question=document.querySelector("#question");question.textContent=isJpKo?word.jp:word.ko;question.classList.toggle("is-korean",!isJpKo);
  document.querySelector("#reading").textContent=isJpKo?word.reading:"알맞은 표현을 고르세요";
  const options=shuffle([word,...shuffle(words.filter(item=>item!==word)).slice(0,3)]);
  choices.innerHTML=options.map((item,index)=>`<button class="choice" type="button" data-correct="${item===word}"><span class="letter">${String.fromCharCode(65+index)}</span><span>${isJpKo?item.ko:item.jp}</span></button>`).join("");
  const feedback=document.querySelector("#feedback");feedback.hidden=true;feedback.classList.remove("is-wrong");nextButton.hidden=true;
}
choices.addEventListener("click",event=>{
  const selected=event.target.closest(".choice");if(!selected||selected.disabled)return;
  const {word,direction}=questions[current],correct=selected.dataset.correct==="true";
  [...choices.children].forEach(button=>{button.disabled=true;if(button.dataset.correct==="true")button.classList.add("correct");});
  if(correct){score++;streak++;bestStreak=Math.max(bestStreak,streak);}else{selected.classList.add("wrong");streak=0;if(!mistakes.includes(word))mistakes.push(word);}
  const feedback=document.querySelector("#feedback");feedback.hidden=false;feedback.classList.toggle("is-wrong",!correct);
  document.querySelector("#feedbackIcon").textContent=correct?"✓":"!";document.querySelector("#feedbackTitle").textContent=correct?"정답이에요":`정답은 ${direction==="jp-ko"?word.ko:word.jp}`;
  document.querySelector("#feedbackNote").textContent=word.note;document.querySelector("#exampleJp").textContent=word.example;document.querySelector("#exampleKo").textContent=word.translation;
  document.querySelector("#scoreLabel").textContent=`정답 ${score}`;nextButton.innerHTML=current===questions.length-1?'결과 보기 <span>→</span>':'다음 문제 <span>→</span>';nextButton.hidden=false;
});
function finishQuiz(){
  const total=questions.length,percent=Math.round(score/total*100);document.querySelector("#finalScore").textContent=score;document.querySelector("#finalScore").nextElementSibling.textContent=`/ ${total}`;
  document.querySelector("#accuracy").textContent=`${percent}%`;document.querySelector("#bestStreak").textContent=bestStreak;document.querySelector("#wrongCount").textContent=mistakes.length;
  document.querySelector("#resultRing").style.setProperty("--score-angle",`${percent*3.6}deg`);document.querySelector("#resultTitle").textContent=percent===100?"전 구간 완주!":percent>=80?"거의 다 왔어요!":percent>=50?"좋은 흐름이에요!":"한 번 더 달려볼까요?";
  document.querySelector("#resultMessage").textContent=percent===100?"모든 표현을 정확히 기억하고 있어요.":`${mistakes.length}개 표현만 다시 보면 훨씬 단단해질 거예요.`;document.querySelector("#reviewButton").disabled=mistakes.length===0;showScreen(resultScreen);
}
nextButton.addEventListener("click",()=>{if(current<questions.length-1){current++;renderQuestion();}else finishQuiz();});
document.querySelector("#startButton").addEventListener("click",()=>startQuiz());document.querySelector("#quitButton").addEventListener("click",()=>showScreen(startScreen));document.querySelector("#retryButton").addEventListener("click",()=>startQuiz());
document.querySelector("#reviewButton").addEventListener("click",()=>{const reviewWords=[...mistakes];if(reviewWords.length)startQuiz(reviewWords);});
document.addEventListener("keydown",event=>{if(!quizScreen.classList.contains("is-active"))return;if(["1","2","3","4"].includes(event.key))choices.children[Number(event.key)-1]?.click();if(event.key==="Enter"&&!nextButton.hidden)nextButton.click();});
