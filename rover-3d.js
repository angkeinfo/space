"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const core = window.LunarRoverCore;
  const dialog = $("rover-3d-activity"), host = $("rover-3d-scene"), hud = $("r3-hud");
  const simulation = new core.Simulation();
  const audio = new window.LunarRoverAudio();
  const keys = new Set(), pointers = new Map();
  const pads = [...dialog.querySelectorAll("[data-rover-control]")];
  const mapCanvas = $("r3-map"), mapContext = mapCanvas.getContext("2d");
  let world = null, enginePromise = null, frameId = 0, lastTime = 0, hudTime = 0;
  let paused = false, ready = false, reported = false, revision = 0, pulse = null;
  let drag = null;

  const flow = createMissionFlow(dialog, { reset: resetGame, suspend: suspendGame, start: startGame, immediateEntry: true });

  function loadEngine() {
    if (window.THREE) return Promise.resolve();
    if (enginePromise) return enginePromise;
    enginePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => { script.remove(); reject(new Error("3D library load timed out")); }, 20000);
      script.src = "assets/vendor/three-0.180.0.js";
      script.onload = () => { clearTimeout(timer); if (window.THREE) resolve(); else reject(new Error("3D library unavailable")); };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("3D library failed to load")); };
      document.head.append(script);
    }).catch((error) => { enginePromise = null; throw error; });
    return enginePromise;
  }

  function clearInput() {
    keys.clear(); pointers.clear(); pulse = null; drag = null;
    pads.forEach((button) => button.removeAttribute("data-held"));
  }
  function suspendGame() {
    revision++; cancelAnimationFrame(frameId); frameId = 0; lastTime = 0; clearInput();
    audio.stop();
  }
  function resetGame() {
    suspendGame(); simulation.reset(); paused = false; ready = false; reported = false;
    $("r3-paused").hidden = true; hud.inert = false;
    $("r3-load-error").hidden = true; $("r3-loading").hidden = false; hud.hidden = true;
    audio.reset();
    if (world) { world.recenter(); world.sampleFocus = 0; world.lastDistance = 0; world.effects.reset(); world.wheels.forEach((wheel) => { wheel.rotation.x = 0; }); }
    updateHud(); drawMap();
  }

  async function startGame() {
    const token = ++revision;
    try {
      await loadEngine();
      if (token !== revision || !dialog.open || dialog.dataset.mode !== "playing") return;
      if (!world) {
        world = new window.LunarRoverWorld(host, () => showLoadError(new Error("WebGL context lost")));
        connectCamera(world.canvas);
      }
      world.resize(); world.recenter(); simulation.start(); ready = true; paused = false;
      $("r3-loading").hidden = true; $("r3-load-error").hidden = true; hud.hidden = false;
      world.canvas.tabIndex = 0; world.canvas.focus({ preventScroll: true });
      updateHud(); lastTime = 0; hudTime = 0; cancelAnimationFrame(frameId); frameId = requestAnimationFrame(tick);
    } catch (error) {
      if (token === revision && dialog.open) showLoadError(error);
    }
  }

  function showLoadError(error) {
    console.error("Lunar rover 3D:", error);
    suspendGame(); ready = false; hud.hidden = true;
    $("r3-loading").hidden = true; $("r3-load-error").hidden = false;
    if (world) { world.dispose(); world = null; }
    $("r3-load-retry").focus({ preventScroll: true });
  }

  function readInput(time) {
    const values = new Set([...keys, ...pointers.values()]);
    if (pulse && time < pulse.until) values.add(pulse.control);
    return {
      throttle: Number(values.has("forward")) - Number(values.has("backward")),
      steer: Number(values.has("right")) - Number(values.has("left"))
    };
  }

  function tick(time) {
    if (!ready || paused || !world || !dialog.open || dialog.dataset.mode !== "playing") return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 2) : 0; lastTime = time;
    const input = readInput(time);
    // Catch up with small collision-safe steps when a rendered frame is slow.
    for (let remaining = dt; remaining > .00001; remaining -= .05) {
      const step = Math.min(.05, remaining);
      simulation.step(step, input); world.effects.step(simulation, step, reducedMotion.matches);
    }
    audio.update(simulation);
    try { world.render(simulation, dt, reducedMotion.matches); }
    catch (error) { showLoadError(error); return; }
    if (time - hudTime > 90) { updateHud(); drawMap(); hudTime = time; }
    if (simulation.phase === "failed") { reportResult(); return; }
    frameId = requestAnimationFrame(tick);
  }

  function statusMessage() {
    const site = simulation.nearbySite;
    if (simulation.phase === "sampling") {
      const p = simulation.sampleProgress;
      const stage = p < .23 ? "展開機械臂" : p < .57 ? "夾取岩石" : p < .87 ? "抬升樣本" : "樣本入庫、收臂";
      return [stage + " · " + simulation.sampling.name + " " + Math.round(p * 100) + "%", "ready"];
    }
    if (simulation.blocked) return [simulation.blocked, "warning"];
    if (site && !simulation.collected.has(site.id)) {
      return Math.abs(simulation.speed) < .65
        ? ["已抵達 " + site.id.toUpperCase() + " 點！按「採集樣本」或 E。", "ready"]
        : ["已靠近採樣點，先放開前進鍵，停穩再採集。", "warning"];
    }
    if (simulation.atBase) return simulation.collected.size
      ? [Math.abs(simulation.speed) < .65 ? "已返回基地！可以結算這次探索。" : "已回到基地，停穩後即可結算。", "ready"]
      : ["你在基地。朝 A 或 B 採樣點出發，採集岩石樣本。", "normal"];
    if (simulation.battery < 25) return ["電量偏低，請留意回基地的距離。", "warning"];
    if (simulation.rough) return ["崎嶇地形：速度較慢、耗電增加。", "warning"];
    if (site) return ["這個採樣點已完成，可以探索另一點或返回基地。", "normal"];
    return simulation.collected.size ? ["樣本已入庫。跟著綠色指引返回基地，或繼續探索 B 點。", "normal"]
      : ["跟著指引與導航圖探索，停在採樣點旁邊再採集。", "normal"];
  }

  function updateHud() {
    const active = ready && !paused && simulation.phase === "active";
    $("r3-energy").value = Math.ceil(simulation.battery) + "%";
    $("r3-battery").value = simulation.battery;
    $("r3-battery").closest(".rover-battery").classList.toggle("is-low", simulation.battery < 25);
    $("r3-speed").innerHTML = Math.abs(simulation.speed).toFixed(1) + " <small>m/s</small>";
    $("r3-distance").innerHTML = Math.round(simulation.distance) + " <small>m</small>";
    $("r3-coordinates").value = (simulation.x < 0 ? "西 " : "東 ") + Math.abs(simulation.x).toFixed(1) + "m ／ " + (simulation.z < 0 ? "北 " : "南 ") + Math.abs(simulation.z).toFixed(1) + "m";
    core.SITES.forEach((site) => {
      const collected = simulation.collected.has(site.id), el = $("r3-inventory-" + site.id);
      el.textContent = (collected ? "✓ " : "○ ") + site.id.toUpperCase() + " " + site.name;
      el.classList.toggle("is-collected", collected);
    });
    const target = simulation.target;
    const remaining = Math.round(core.distance(simulation, target));
    $("r3-target").value = target.name + " · " + remaining + " m";
    const bearing = Math.atan2(target.x - simulation.x, -(target.z - simulation.z));
    $("r3-target-arrow").style.transform = "rotate(" + (bearing - simulation.heading) + "rad)";
    const [message, tone] = statusMessage();
    if ($("r3-status").textContent !== message) $("r3-status").textContent = message;
    $("r3-status").dataset.tone = tone;
    $("r3-collect").disabled = !active || !simulation.canCollect;
    $("r3-finish").disabled = !active || !simulation.canFinish;
    $("r3-recover").disabled = !active;
    pads.forEach((button) => { button.disabled = !active; });
    $("r3-sampling").hidden = simulation.phase !== "sampling";
    $("r3-sampling").value = simulation.sampleProgress * 100;
  }

  function drawMap() {
    const ctx = mapContext, size = 320, scale = size / 128;
    const point = (x, z) => [(x + 64) * scale, (z + 64) * scale];
    ctx.clearRect(0, 0, size, size); ctx.fillStyle = "#09141e"; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#243746"; ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40, size); ctx.moveTo(0, i * 40); ctx.lineTo(size, i * 40); ctx.stroke(); }
    const rough = point(17, -64); ctx.fillStyle = "#8e735329"; ctx.fillRect(rough[0], rough[1], size - rough[0], 52 * scale);
    const crater = point(core.CRATER.x, core.CRATER.z);
    ctx.beginPath(); ctx.arc(...crater, core.CRATER.radius * scale, 0, Math.PI * 2); ctx.fillStyle = "#29323b"; ctx.fill(); ctx.strokeStyle = "#6e7880"; ctx.lineWidth = 3; ctx.stroke();
    core.ROCKS.forEach((rock) => { ctx.beginPath(); ctx.arc(...point(rock.x, rock.z), rock.radius * scale, 0, 7); ctx.fillStyle = "#59606a"; ctx.fill(); });
    ctx.beginPath(); simulation.trail.forEach((p, i) => { const [x, z] = point(p.x, p.z); if (i) ctx.lineTo(x, z); else ctx.moveTo(x, z); }); ctx.lineWidth = 2; ctx.strokeStyle = "#92f0d177"; ctx.stroke();
    const base = point(core.BASE.x, core.BASE.z); ctx.fillStyle = "#92f0d1"; ctx.fillRect(base[0] - 7, base[1] - 7, 14, 14);
    ctx.font = 'bold 23px "Microsoft JhengHei",sans-serif'; ctx.textAlign = "center"; ctx.fillText("基地", base[0], base[1] + 29);
    core.SITES.forEach((site, index) => {
      const p = point(site.x, site.z); ctx.beginPath(); ctx.arc(...p, 7, 0, 7);
      ctx.fillStyle = simulation.collected.has(site.id) ? "#92f0d1" : index ? "#9cc9ff" : "#ffca8d"; ctx.fill();
      ctx.fillText((simulation.collected.has(site.id) ? "✓" : "") + site.id.toUpperCase(), p[0], p[1] - 14);
    });
    const p = point(simulation.x, simulation.z);
    ctx.save(); ctx.translate(...p); ctx.rotate(simulation.heading); ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-7, 8); ctx.lineTo(0, 4); ctx.lineTo(7, 8); ctx.closePath(); ctx.fillStyle = "#f6f8ff"; ctx.fill(); ctx.strokeStyle = "#0a1723"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }

  function collect() {
    if (!ready || paused || !simulation.collect()) return;
    clearInput(); updateHud();
    if (simulation.phase === "failed") reportResult();
  }
  function finish() { if (ready && !paused && simulation.finish()) reportResult(); }
  function reportResult() {
    if (reported) return;
    reported = true;
    const success = simulation.phase === "complete";
    const samples = core.SITES.filter((site) => simulation.collected.has(site.id));
    const minutes = Math.floor(simulation.elapsed / 60), seconds = Math.floor(simulation.elapsed % 60);
    simulation.phase = "reported";
    flow.report({
      label: success ? "任務達成" : "探索結束",
      title: success ? "月面採樣，任務完成" : "電量耗盡，再規劃一條路線",
      copy: success ? "你已駕駛月球車返回基地，並帶回 " + samples.length + " 份樣本。每一次路線選擇，都是這次探索的一部分。" : "月球車尚未返回基地。試著縮短繞行路線、避開崎嶇地形，並提早安排返程。",
      stats: [["採集樣本", samples.length + " 份"], ["剩餘電量", Math.floor(simulation.battery) + "%"], ["行駛里程", Math.round(simulation.distance) + " m"], ["探索時間", minutes + " 分 " + seconds + " 秒"]],
      knowledge: (samples.length ? samples.map((site) => site.detail).join(" ") : "這次沒有帶回樣本。") + " 地形會改變行進速度與耗電，前往採樣點時，也要把回基地的路算進去。這裡的距離、電量及樣本配置為簡化教學設定。" + (simulation.recoveries ? " 本次使用了 " + simulation.recoveries + " 次回正，每次消耗 5% 電量。" : ""),
      source: "https://science.nasa.gov/moon/lunar-craters/why-study-craters/"
    });
    audio.cue(success ? "success" : "failed");
  }

  function setPaused(value) {
    if (!ready || !["active", "sampling"].includes(simulation.phase) || dialog.dataset.mode !== "playing") return;
    paused = value; clearInput(); cancelAnimationFrame(frameId); lastTime = 0;
    $("r3-paused").hidden = !paused; hud.inert = paused;
    if (world) world.canvas.tabIndex = paused ? -1 : 0;
    updateHud();
    if (paused) { audio.stop(); if (audio.context) audio.context.suspend().catch(() => {}); $("r3-resume").focus({ preventScroll: true }); }
    else { audio.unlock(); world.canvas.focus({ preventScroll: true }); frameId = requestAnimationFrame(tick); }
  }

  function connectCamera(canvas) {
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("pointerdown", (event) => {
      if (paused || !ready) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId || !world) return;
      world.orbit -= (event.clientX - drag.x) * .006;
      world.elevation = Math.max(.25, Math.min(1, world.elevation + (event.clientY - drag.y) * .003));
      drag.x = event.clientX; drag.y = event.clientY;
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => canvas.addEventListener(type, () => { drag = null; }));
    canvas.addEventListener("wheel", (event) => {
      if (paused || !world) return;
      event.preventDefault(); world.cameraDistance = Math.max(8, Math.min(20, world.cameraDistance + event.deltaY * .01));
    }, { passive: false });
  }

  pads.forEach((button) => {
    const control = button.dataset.roverControl;
    button.addEventListener("pointerdown", (event) => {
      if (!ready || paused || simulation.phase !== "active" || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, control); button.dataset.held = "true";
    });
    function release(event) {
      pointers.delete(event.pointerId);
      if (![...pointers.values()].includes(control)) button.removeAttribute("data-held");
    }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => button.addEventListener(type, release));
    button.addEventListener("click", (event) => { if (event.detail === 0 && ready && !paused) pulse = { control, until: performance.now() + 650 }; });
  });
  const bindings = { w: "forward", arrowup: "forward", s: "backward", arrowdown: "backward", a: "left", arrowleft: "left", d: "right", arrowright: "right" };
  window.addEventListener("keydown", (event) => {
    if (!dialog.open || dialog.dataset.mode !== "playing" || !ready || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.("input,textarea,select")) return;
    const key = event.key.toLowerCase();
    if (bindings[key]) { event.preventDefault(); if (!paused) keys.add(bindings[key]); }
    if (key === "e" && !event.repeat && !paused) { event.preventDefault(); collect(); }
  });
  window.addEventListener("keyup", (event) => { keys.delete(bindings[event.key.toLowerCase()]); });
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", () => { if (document.hidden && dialog.open && ready && !paused) setPaused(true); });
  dialog.addEventListener("cancel", (event) => { if (dialog.dataset.mode === "playing" && ready) { event.preventDefault(); setPaused(!paused); } });
  dialog.addEventListener("close", () => {
    suspendGame(); ready = false; paused = false;
    audio.dispose();
    if (world) { world.dispose(); world = null; }
  });
  $("r3-collect").addEventListener("click", collect); $("r3-finish").addEventListener("click", finish);
  $("r3-pause").addEventListener("click", () => setPaused(true)); $("r3-resume").addEventListener("click", () => setPaused(false));
  $("r3-leave").addEventListener("click", () => dialog.close());
  $("r3-restart").addEventListener("click", () => { resetGame(); startGame(); });
  $("r3-recenter").addEventListener("click", () => { if (world) { world.recenter(); world.render(simulation, 0, true); } });
  $("r3-recover").addEventListener("click", () => {
    if (!ready || paused || !simulation.recover()) return;
    clearInput(); world.recenter(); updateHud(); if (simulation.phase === "failed") reportResult();
  });
  $("r3-load-retry").addEventListener("click", () => { resetGame(); startGame(); });
  // Unlock in the actual button gesture, before the cinematic transition/async engine load.
  dialog.querySelectorAll("[data-mission-enter],[data-mission-replay]").forEach((button) => button.addEventListener("click", () => audio.unlock()));
  $("r3-restart").addEventListener("click", () => audio.unlock());
  $("r3-sound").addEventListener("click", () => {
    audio.unlock(); audio.setMuted(!audio.muted);
    $("r3-sound").textContent = audio.muted ? "音效：關" : "音效：開";
    $("r3-sound").setAttribute("aria-pressed", String(!audio.muted));
  });
  $("r3-fallback").addEventListener("click", () => {
    dialog.close();
    $("rover-activity").addEventListener("close", () => $("open-rover-3d").focus({ preventScroll: true }), { once: true });
    $("r3-legacy-opener").click();
  });
  $("open-rover-3d").addEventListener("click", () => flow.showBriefing({
    title: "月面採樣 · 3D 探索",
    paragraphs: [
      "你已抵達月面基地。這次，親自駕駛六輪月球車，尋找岩石樣本，再把發現帶回來。",
      "A 點在平原，B 點位於較耗電的崎嶇區域。中央撞擊坑無法通行，途中也要繞開大岩石。採集至少一份樣本並返回基地，就能完成任務。",
      "用 W/S 或方向鍵駕駛，也能按住螢幕方向按鈕。停穩後按 E 採樣，機械臂會展開、夾取並將樣本放入收集盒；回基地後結算。音效可在畫面左下方開關。"
    ]
  }));
})();
