"use strict";

const missionDialog = get("rover-activity");
const map = get("map-shell");
const rover = get("rover");
const energy = get("energy");
const launch = get("launch");
const collectButton = get("collect-sample");
const finishButton = get("finish-mission");
const retry = get("retry");
const debrief = get("debrief");
const directions = [...document.querySelectorAll("[data-drive]")];
const missionSteps = [...document.querySelectorAll(".mission-steps li")];
const base = { x: 85, y: 274 };
const goals = {
  sample: { title: "月面採樣", objective: "採集至少一份樣本，並駕駛月球車返回左下方基地。", paragraphs: ["月球車剛抵達月面基地。遠方的採樣點，正等待你留下第一道探索的車輪軌跡。", "你將親自駕駛月球車，前往 A 或 B 採樣點。中央撞擊坑無法通行，崎嶇區域則需要更多電力。", "用方向鍵或螢幕按鈕移動，靠近採樣點後按 E 或「採集樣本」。帶回至少一份樣本，再返回左下方基地結算。"] },
  power: { title: "保留電力", objective: "採集至少一份樣本後返回基地，結算時保留至少 60% 電量。", paragraphs: ["基地傳來一項新的要求：月球車完成採樣後，還必須保留電力，準備後續工作。", "這次你仍要帶回至少一份樣本，但返回基地結算時，電量必須保持在 60% 以上。繞遠路和崎嶇地形都會增加消耗。", "用方向鍵或螢幕按鈕駕駛，靠近採樣點後按 E 或「採集樣本」。出發前，先想好一條兼顧採樣和返程的路線。"] },
  impact: { title: "找撞擊線索", objective: "探索 B 採樣點，帶回環坑邊緣的樣本並返回基地。", paragraphs: ["月面上的撞擊坑，保存著岩石曾經破碎與混合的線索。這次，基地希望你帶回環坑邊緣的樣本。", "你的目標是右上方 B 採樣點。需要繞過中央撞擊坑，也要留意 B 點附近崎嶇區域的耗電。", "用方向鍵或螢幕按鈕駕駛，在 B 點按 E 或「採集樣本」，再返回左下方基地。最後，看看這份樣本能告訴我們什麼。"] }
};
const sites = [
  { id: "a", x: 541, y: 275, name: "玄武岩", explanation: "A 點的玄武岩樣本可用來探討月球過去的熔岩活動。" },
  { id: "b", x: 541, y: 82, name: "角礫岩", explanation: "B 點的角礫岩包含多種岩屑，可用來討論撞擊如何破碎和混合岩石。" }
];
const vectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
const arrowKeys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
const heldKeys = new Set();
const heldPointers = new Map();
const collected = new Set();
const discovered = new Set();
let currentMission = "sample";
let phase = "ready";
let position = { ...base };
let battery = 100;
let driveFrame = 0;
let lastFrame = 0;
let trail = [];
const roverFlow = createMissionFlow(missionDialog, {
  reset: resetMission,
  suspend: () => { cancelAnimationFrame(driveFrame); clearControls(); },
  start: startDriving
});

function updateDebrief(title, message, emphasis = false) {
  debrief.querySelector("strong").textContent = title;
  debrief.querySelector("p").textContent = message;
  animateFeedback(debrief, emphasis);
}

function setStage(index) {
  missionSteps.forEach((step, number) => {
    if (number === index) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function distance(from, to) {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

function nearestSite() {
  return sites.find((site) => distance(position, site) <= 30);
}

function inRoughTerrain(point) {
  return point.x > 430 && point.y < 175;
}

function clearControls() {
  heldKeys.clear();
  heldPointers.clear();
  directions.forEach((button) => button.removeAttribute("data-held"));
}

function renderRover() {
  rover.setAttribute("transform", "translate(" + position.x + " " + position.y + ")");
  energy.value = battery;
  get("energy-text").value = Math.floor(battery) + "%";
  get("map-energy").value = Math.floor(battery) + "%";
  energy.classList.toggle("energy-low", battery < 25);
}

function updateProximity(blocked = false) {
  const site = nearestSite();
  const atBase = distance(position, base) <= 28;
  collectButton.disabled = phase !== "active" || !site || collected.has(site.id);
  finishButton.disabled = phase !== "active" || !atBase || collected.size === 0;
  let message = "探索月面，前往右側 A 或 B 採樣點。";
  if (inRoughTerrain(position)) message = "崎嶇區域：速度較慢，耗電較高。留意返程電力。";
  if (site) {
    message = collected.has(site.id) ? site.id.toUpperCase() + " 點已採集，可探索另一個點或返回基地。"
      : "發現 " + site.id.toUpperCase() + " 採樣點！按「採集樣本」或 E。";
    discovered.add(site.id);
    get("site-" + site.id).classList.add("site-discovered");
  }
  if (atBase) message = collected.size ? "已回到基地，可以按「返回基地結算」。" : "你在基地。前往右側採樣點展開探索。";
  if (blocked) message = "撞擊坑不可通行，請向上或向下繞過標示區域。";
  if (get("proximity-status").textContent !== message) get("proximity-status").textContent = message;
}

function stopDriving(nextPhase) {
  phase = nextPhase;
  cancelAnimationFrame(driveFrame);
  clearControls();
  directions.forEach((button) => { button.disabled = true; });
  collectButton.disabled = true;
  finishButton.disabled = true;
  launch.hidden = true;
  retry.hidden = false;
  missionDialog.dataset.scene = nextPhase === "failed" ? "retry" : "arrived";
  map.dataset.state = "ready";
  setStage(3);
  get("mission-phase").textContent = nextPhase === "failed" ? "電量耗盡 ／ 任務結束" : "已返回基地 ／ 等待結算";
  get("map-status").textContent = nextPhase === "failed" ? "月球車已停止" : "已返回基地";
  get("proximity-status").textContent = nextPhase === "failed" ? "電量耗盡，正在整理任務結果。" : "樣本已帶回，正在整理任務結果。";
  revealMissionResult();
}

function moveRover(dx, dy) {
  if (phase !== "active" || (dx === 0 && dy === 0)) return;
  const next = {
    x: Math.max(20, Math.min(620, position.x + dx)),
    y: Math.max(20, Math.min(345, position.y + dy))
  };
  const insideCrater = ((next.x - 300) / 100) ** 2 + ((next.y - 108) / 82) ** 2 < 1;
  if (insideCrater) {
    updateProximity(true);
    return;
  }
  const length = distance(position, next);
  if (!length) return;
  battery = Math.max(0, battery - length * (inRoughTerrain(next) ? 0.08 : 0.035));
  position = next;
  renderRover();
  const lastPoint = trail[trail.length - 1];
  if (distance(lastPoint, position) > 7) {
    trail.push({ ...position });
    if (trail.length > 600) trail.shift();
    get("route-trace").setAttribute("points", trail.map((point) => point.x.toFixed(1) + "," + point.y.toFixed(1)).join(" "));
  }
  map.dataset.state = "driving";
  if (battery === 0) {
    stopDriving("failed");
    return;
  }
  updateProximity();
}

function frame(time) {
  const elapsed = lastFrame ? Math.min((time - lastFrame) / 1000, 0.05) : 0;
  lastFrame = time;
  if (phase !== "active" || !missionDialog.open) return;
  const input = new Set([...heldKeys, ...heldPointers.values()]);
  let dx = 0;
  let dy = 0;
  for (const key of input) {
    dx += vectors[key].x;
    dy += vectors[key].y;
  }
  const magnitude = Math.hypot(dx, dy);
  if (magnitude) {
    const speed = inRoughTerrain(position) ? 65 : 105;
    moveRover(dx / magnitude * speed * elapsed, dy / magnitude * speed * elapsed);
  }
  if (phase === "active") driveFrame = requestAnimationFrame(frame);
}

function resetMission() {
  cancelAnimationFrame(driveFrame);
  clearControls();
  phase = "ready";
  position = { ...base };
  battery = 100;
  lastFrame = 0;
  collected.clear();
  discovered.clear();
  trail = [{ ...base }];
  missionDialog.dataset.scene = "ready";
  map.dataset.state = "ready";
  renderRover();
  get("route-trace").setAttribute("points", base.x + "," + base.y);
  get("route-trace").setAttribute("visibility", "hidden");
  get("arrival-signal").setAttribute("visibility", "hidden");
  get("drive-progress").value = 0;
  get("drive-percent").value = "0/2";
  debrief.classList.remove("report-open");
  launch.hidden = false;
  launch.disabled = false;
  retry.hidden = true;
  collectButton.disabled = true;
  finishButton.disabled = true;
  directions.forEach((button) => { button.disabled = true; });
  sites.forEach((site) => {
    get("site-" + site.id).classList.remove("site-collected", "site-discovered");
    get("inventory-" + site.id).textContent = site.id.toUpperCase() + " 樣本 · 尚未採集";
  });
  get("mission-phase").textContent = "待命 ／ 準備出發";
  get("map-status").textContent = "基地待命";
  get("proximity-status").textContent = "按「開始駕駛」後出發。";
  setStage(0);
  updateDebrief("任務目標", goals[currentMission].objective);
}

function collectSample() {
  const site = nearestSite();
  if (phase !== "active" || !site || collected.has(site.id)) return;
  collected.add(site.id);
  get("site-" + site.id).classList.add("site-collected");
  get("inventory-" + site.id).textContent = "✓ " + site.id.toUpperCase() + " 樣本 · 已採集";
  get("drive-progress").value = collected.size;
  get("drive-percent").value = collected.size + "/2";
  get("arrival-signal").setAttribute("transform", "translate(" + site.x + " " + site.y + ")");
  get("arrival-signal").setAttribute("visibility", "visible");
  map.dataset.state = "arrived";
  setStage(2);
  updateDebrief("樣本 " + site.id.toUpperCase() + " 已入庫", "可以繼續探索另一個採樣點，或返回左下方基地。", true);
  updateProximity();
}

function startDriving() {
  if (!missionDialog.open || missionDialog.dataset.mode !== "playing" || phase !== "ready") return;
  phase = "active";
  lastFrame = 0;
  clearControls();
  directions.forEach((button) => { button.disabled = false; });
  launch.hidden = true;
  retry.hidden = false;
  missionDialog.dataset.scene = "driving";
  map.dataset.state = "driving";
  get("route-trace").setAttribute("visibility", "visible");
  get("map-status").textContent = "手動駕駛中";
  get("mission-phase").textContent = "探索中 ／ 駕駛與採集";
  setStage(1);
  updateProximity();
  get("game-map").focus({ preventScroll: true });
  driveFrame = requestAnimationFrame(frame);
}
launch.addEventListener("click", startDriving);

collectButton.addEventListener("click", collectSample);
finishButton.addEventListener("click", () => {
  if (phase !== "active" || !collected.size || distance(position, base) > 28) return;
  stopDriving("complete");
});

function revealMissionResult() {
  if (phase !== "complete" && phase !== "failed") return;
  const returned = phase === "complete";
  let achieved = returned && collected.size > 0;
  if (currentMission === "power") achieved = achieved && battery >= 60;
  if (currentMission === "impact") achieved = achieved && collected.has("b");
  const samples = sites.filter((site) => collected.has(site.id));
  const explanation = samples.map((site) => site.explanation).join(" ");
  const outcome = achieved ? "任務達成" : "本次尚未達標";
  phase = "reported";
  missionDialog.dataset.scene = achieved ? "correct" : "retry";
  roverFlow.report({
    label: outcome,
    title: goals[currentMission].title + (achieved ? "，任務完成" : "，再試一條路線"),
    copy: (returned ? "月球車已回到基地。" : "月球車電量耗盡，未能返回基地。") + " 本次目標：" + goals[currentMission].objective,
    stats: [["採集樣本", collected.size + " 份"], ["剩餘電量", Math.floor(battery) + "%"], ["返程狀態", returned ? "已返回基地" : "未返回基地"]],
    knowledge: (samples.length ? "採樣紀錄：" + samples.map((site) => site.name).join("、") + "。 " + explanation + " " : "這次尚未採集樣本。 ") + "探索時要同時安排採樣與返程。繞行距離和地形會影響電力消耗，這裡的電量及樣本分布採簡化教學設定。",
    source: "https://science.nasa.gov/moon/lunar-craters/why-study-craters/"
  });
}

retry.addEventListener("click", () => {
  resetMission();
  launch.focus();
});

directions.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    if (phase !== "active" || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    heldPointers.set(event.pointerId, button.dataset.drive);
    button.dataset.held = "true";
    const vector = vectors[button.dataset.drive];
    moveRover(vector.x * 8, vector.y * 8);
  });
  function release(event) {
    heldPointers.delete(event.pointerId);
    if (![...heldPointers.values()].includes(button.dataset.drive)) button.removeAttribute("data-held");
  }
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("click", (event) => {
    if (event.detail !== 0 || phase !== "active") return;
    const vector = vectors[button.dataset.drive];
    moveRover(vector.x * 18, vector.y * 18);
  });
});

window.addEventListener("keydown", (event) => {
  if (!missionDialog.open || phase !== "active" || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof Element && event.target.closest("input, textarea, select")) return;
  const direction = arrowKeys[event.key];
  if (direction) {
    event.preventDefault();
    heldKeys.add(direction);
  }
  if (event.key.toLowerCase() === "e" && !event.repeat) {
    event.preventDefault();
    collectSample();
  }
});
window.addEventListener("keyup", (event) => {
  heldKeys.delete(arrowKeys[event.key]);
});
window.addEventListener("blur", clearControls);
document.addEventListener("visibilitychange", () => { if (document.hidden) clearControls(); });

document.querySelectorAll("[data-mission]").forEach((button) => {
  button.addEventListener("click", () => {
    currentMission = button.dataset.mission;
    get("rover-activity-title").textContent = goals[currentMission].title + "｜月球車控制台";
    get("mission-objective").textContent = goals[currentMission].objective;
    roverFlow.showBriefing(goals[currentMission]);
  });
});
missionDialog.addEventListener("close", () => {
  cancelAnimationFrame(driveFrame);
  clearControls();
});

const budgetDialog = get("power-budget-activity");
const budgetQuiz = get("power-budget-quiz");
const budgetFlow = createMissionFlow(budgetDialog, {
  reset: () => {
    budgetQuiz.reset();
    budgetQuiz.querySelector(".quiz-feedback").textContent = "";
    budgetDialog.dataset.scene = "ready";
  },
  suspend: () => {},
  start: () => budgetQuiz.querySelector("input").focus({ preventScroll: true })
});
document.querySelector('[data-open-activity="power-budget-activity"]').addEventListener("click", () => {
  budgetFlow.showBriefing({
    title: "電力判斷挑戰",
    paragraphs: ["月球車準備離開基地，控制中心要先確認一件事：抵達採樣點後，還有沒有足夠的電力？", "目前電量是 100%。A 平原路線消耗 25%，B 環坑邊緣消耗 50%。任務要求抵達時至少保留 60%。", "進入挑戰後，選擇你認為符合要求的路線，再核對判斷。最後一起看看，路線規劃和電力保留有什麼關係。"]
  });
});
budgetQuiz.addEventListener("submit", (event) => {
  event.preventDefault();
  if (budgetDialog.dataset.mode !== "playing") return;
  const choice = budgetQuiz.querySelector("input:checked");
  if (!choice) return;
  const correct = choice.hasAttribute("data-correct");
  budgetFlow.report({
    label: correct ? "任務達成" : "本次尚未達標",
    title: correct ? "留下足夠電力的路線" : "還要替電量多想一步",
    copy: choice.dataset.feedback,
    stats: [["你的路線", correct ? "A 平原" : "B 環坑邊緣"], ["抵達電量", correct ? "75%" : "50%"], ["任務門檻", "至少 60%"]],
    knowledge: "起始電量減去路線消耗，就是抵達時的剩餘電量。A 路線為 100% − 25% = 75%，B 路線為 100% − 50% = 50%。在這個教學情境中，只有 A 路線符合保留至少 60% 電量的要求。"
  });
});
