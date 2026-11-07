"use strict";

function createMissionFlow(dialog, { reset, suspend, start, immediateEntry = false }) {
  const find = (name) => dialog.querySelector("[data-mission-" + name + "]");
  const shell = find("shell");
  const intro = find("prologue");
  const play = find("play");
  const result = find("result");
  const enter = find("enter");
  const ease = "cubic-bezier(0.23, 1, 0.32, 1)";
  let revision = 0;
  let timer = 0;
  let animations = [];

  function clearMotion() {
    clearTimeout(timer);
    animations.forEach((animation) => animation.cancel());
    animations = [];
    shell.style.opacity = "";
  }

  function fade(element, from, to, duration, delay = 0) {
    const animation = element.animate([{ opacity: from }, { opacity: to }], {
      duration, delay, easing: ease, fill: "both"
    });
    animations.push(animation);
    return animation;
  }

  function revealBriefing() {
    clearMotion();
    enter.hidden = true;
    if (reducedMotion.matches || immediateEntry) { enter.hidden = false; return; }
    fade(intro.querySelector(".mission-prologue-label"), 0, 1, 1000);
    fade(find("prologue-title"), 0, 1, 1200, 350);
    let delay = 1700;
    find("prologue-copy").querySelectorAll("p").forEach((paragraph) => {
      fade(paragraph, 0, 1, 1400, delay);
      delay += Math.max(3400, Math.min(5200, paragraph.textContent.length * 85));
    });
    const briefingRevision = revision;
    timer = setTimeout(() => {
      if (!dialog.open || revision !== briefingRevision || dialog.dataset.mode !== "briefing") return;
      enter.hidden = false;
      fade(enter, 0, 1, 1000);
    }, delay);
  }

  function showBriefing(brief) {
    revision++;
    clearMotion();
    suspend();
    reset();
    [intro, play, result].forEach((panel) => { panel.hidden = panel !== intro; panel.inert = false; });
    dialog.dataset.mode = "briefing";
    find("label").textContent = brief.title;
    find("prologue-title").textContent = brief.title;
    find("prologue-copy").replaceChildren(...brief.paragraphs.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }));
    dialog.scrollTop = 0;
    find("prologue-title").focus({ preventScroll: true });
    revealBriefing();
  }

  async function transition(target) {
    const transitionRevision = ++revision;
    clearMotion();
    suspend();
    dialog.dataset.mode = target === result ? "ending" : "entering";
    [intro, play, result].forEach((panel) => { panel.inert = true; });
    if (!reducedMotion.matches) {
      try { await fade(shell, 1, 0, 700).finished; } catch { return; }
    }
    if (!dialog.open || revision !== transitionRevision) return;
    clearMotion();
    shell.style.opacity = "0";
    [intro, play, result].forEach((panel) => { panel.hidden = panel !== target; });
    if (target === play) reset();
    dialog.dataset.mode = target === result ? "result" : "playing";
    dialog.scrollTop = 0;
    if (!reducedMotion.matches) {
      const reveal = fade(shell, 0, 1, 1100);
      const actions = target === result ? fade(find("result-actions"), 0, 1, 900, 600) : reveal;
      if (target === result) fade(find("result-science"), 0, 1, 1000, 250);
      try { await Promise.all([reveal.finished, actions.finished]); } catch { return; }
    }
    if (!dialog.open || revision !== transitionRevision) return;
    clearMotion();
    target.inert = false;
    if (target === play) start();
    else find("result-title").focus({ preventScroll: true });
  }

  function report(data) {
    find("result-label").textContent = data.label;
    find("result-title").textContent = data.title;
    find("result-copy").textContent = data.copy;
    find("result-knowledge").textContent = data.knowledge;
    find("result-stats").replaceChildren(...data.stats.map(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const definition = document.createElement("dd");
      definition.textContent = value;
      group.append(term, definition);
      return group;
    }));
    find("result-source").hidden = !data.source;
    if (data.source) find("result-source").href = data.source;
    transition(result);
  }

  enter.addEventListener("click", () => {
    if (!enter.hidden && dialog.dataset.mode === "briefing") transition(play);
  });
  find("return").addEventListener("click", () => dialog.close());
  find("replay").addEventListener("click", () => {
    if (dialog.dataset.mode === "result" && !result.inert) transition(play);
  });
  dialog.addEventListener("close", () => { revision++; clearMotion(); suspend(); });
  reducedMotion.addEventListener("change", () => {
    if (!dialog.open || !reducedMotion.matches) return;
    if (dialog.dataset.mode === "briefing") revealBriefing();
    else animations.forEach((animation) => { if (animation.playState !== "finished") animation.finish(); });
  });
  return { showBriefing, report };
}
