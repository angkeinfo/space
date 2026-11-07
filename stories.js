"use strict";

const filmImages = {
  earth: "assets/hero.png",
  cabin: "assets/story.png",
  mentor: "assets/story-mentor.png",
  instrument: "assets/story-instrument.png",
  sleep: "assets/story-sleep.png",
  loose: "assets/story-loose-notebook.png",
  lamp: "assets/story-lamp-control.png",
  buckle: "assets/story-buckle.png",
  notebook: "assets/story-notebook-stowed.png"
};

const films = {
  flash: {
    start: "departure",
    science: "阿波羅的研究指出，來自太空的高能粒子能穿過太空船。當粒子與眼睛的組織作用時，可能觸發亮點的視覺感受。研究提出了不同的作用機制。閉眼、暗處仍有亮點的觀察，以及儀器比對資料，都能用來檢查解釋。",
    source: "https://ntrs.nasa.gov/api/citations/19760005597/downloads/19760005597.pdf",
    sourceLabel: "NASA｜阿波羅閃光研究",
    note: "角色與對話為虛構。觀察題材參考阿波羅研究，儀器比對情節為教學示意。",
    scenes: {
      departure: {
        title: "序幕｜離開地球",
        location: "飛往月球的航程",
        image: "earth",
        dialogue: [
          { speaker: "旁白", text: "地球在窗外慢慢變小。這是你第一次以見習航員的身分，參與一趟月球航程。" },
          { speaker: "米亞", text: "我是科學官米亞。這趟旅程，把你注意到的小事都記下來，好嗎？" }
        ],
        next: "flash"
      },
      flash: {
        title: "第一幕｜閉眼後的亮點",
        location: "太空艙內",
        image: "cabin",
        dialogue: [
          { speaker: "米亞", text: "剛才閉上眼睛時，我好像看見一個很短暫的亮點。" },
          { speaker: "旁白", text: "艙內傳來低低的儀器聲。你望向艙燈，又望向一旁的紀錄器。" }
        ],
        choices: [
          { label: "伸手把艙燈調暗", next: "lights" },
          { label: "按下紀錄器的開關", next: "records" }
        ]
      },
      lights: {
        title: "第二幕｜把光線調暗",
        location: "你選擇了艙燈",
        image: "mentor",
        dim: true,
        dialogue: [
          { speaker: "旁白", text: "你將艙燈調暗，把光線變化記進觀察筆記。" },
          { speaker: "米亞", text: "阿波羅任務也記錄過：太空人在暗處、甚至閉眼時，仍會察覺亮點。這條線索要怎麼檢查？" }
        ],
        choices: [
          { label: "請米亞再閉眼觀察一次", next: "eyes" },
          { label: "把「艙燈影響」寫成假設", next: "lampGuess" }
        ]
      },
      records: {
        title: "第二幕｜紀錄器的另一端",
        location: "你選擇了儀器紀錄",
        image: "instrument",
        dialogue: [
          { speaker: "旁白", text: "你打開紀錄器。一份記著粒子探測事件，一份記著亮點回報。" },
          { speaker: "米亞", text: "單看一份資料還不夠。我們可以把兩份紀錄放在一起比較。" }
        ],
        choices: [
          { label: "把兩份紀錄並排比對", next: "compareRecords" },
          { label: "請米亞再閉眼觀察一次", next: "eyes" }
        ]
      },
      eyes: {
        title: "第三幕｜閉上眼也能察覺？",
        location: "一項需要解釋的觀察",
        image: "cabin",
        dim: true,
        dialogue: [
          { speaker: "米亞", text: "如果閉上眼也能察覺亮點，單靠艙內燈光這個想法，好像還有地方需要解釋。" },
          { speaker: "旁白", text: "你在筆記旁畫上一個問號。現在，你要追查資料，還是先留下待研究的問題？" }
        ],
        choices: [
          { label: "把觀察帶回探測紀錄比對", next: "compareLights" },
          { label: "在筆記上寫下待解的問題", next: "openQuestion" }
        ]
      },
      lampGuess: {
        title: "第三幕｜假設遇到新線索",
        location: "你的第一個猜測",
        image: "mentor",
        dialogue: [
          { speaker: "米亞", text: "把假設寫下來很好。接下來，我們得看看它能不能解釋暗處、閉眼時的觀察。" },
          { speaker: "旁白", text: "你可以修改原來的想法，也可以先把它當作一項待檢驗的假設。" }
        ],
        choices: [
          { label: "重新檢查假設，並排比對紀錄", next: "compareLights" },
          { label: "把這個假設留在待查清單", next: "openQuestion" }
        ]
      },
      compareLights: {
        title: "第四幕｜線索開始連起來",
        location: "從光線觀察走到資料比對",
        image: "instrument",
        dialogue: [
          { speaker: "旁白", text: "你把亮點回報與粒子探測資料放在一起，開始檢查兩者的關聯。" },
          { speaker: "米亞", text: "研究者會用這種比對方式檢驗解釋。結合剛才的觀察，你現在怎麼想？" }
        ],
        choices: [
          { label: "把高能粒子寫進研究方向", next: "lightEnding" },
          { label: "列出還需要補上的觀察", next: "openQuestion" }
        ]
      },
      compareRecords: {
        title: "第三幕｜讓兩份紀錄對話",
        location: "從資料比對追查現象",
        image: "instrument",
        dialogue: [
          { speaker: "米亞", text: "探測資料和目擊回報放在一起，才能檢查亮點是否可能和粒子事件有關。" },
          { speaker: "旁白", text: "艙內的謎題逐漸有了方向，但每一個解釋仍需要能支持它的證據。" }
        ],
        choices: [
          { label: "把高能粒子寫進研究方向", next: "recordEnding" },
          { label: "在筆記上留下待解的問題", next: "openQuestion" }
        ]
      },
      lightEnding: {
        title: "尾聲｜從一盞艙燈開始",
        location: "你的調查完成了",
        image: "mentor",
        dialogue: [
          { speaker: "米亞", text: "你從光線開始，追問觀察，再走到資料。這一路上，猜測也跟著證據改變了。" }
        ],
        ending: { title: "從光線追到粒子的線索", copy: "你先調查環境，再用觀察和紀錄修正解釋，完成了這次探索。" }
      },
      recordEnding: {
        title: "尾聲｜紀錄留下的方向",
        location: "你的調查完成了",
        image: "mentor",
        dialogue: [
          { speaker: "米亞", text: "你先找資料，再把事件和觀察連起來。讓我們翻開這個現象背後的研究。" }
        ],
        ending: { title: "從兩份紀錄找到方向", copy: "你從探測紀錄出發，把高能粒子列為值得檢查的解釋。" }
      },
      openQuestion: {
        title: "尾聲｜留下一個好問題",
        location: "你的觀察筆記",
        image: "earth",
        dialogue: [
          { speaker: "旁白", text: "你在筆記上留下了還想知道的問題。這次的猜測，將成為下一次調查的起點。" },
          { speaker: "米亞", text: "先分清楚看見了什麼、還不知道什麼，也是一種研究的開始。" }
        ],
        ending: { title: "帶著問題繼續航行", copy: "你為下一次調查留下了問題。現在，一起看看這個現象背後的研究。" }
      }
    }
  },
  sleep: {
    start: "firstNight",
    science: "國際太空站的太空人會把睡袋固定在艙內，避免睡著後漂移。身旁的小物也要妥善固定。太空站內的睡眠空間不需要像地球上的床一樣放在地板上，整理空間與固定位置是休息前的重要準備。",
    source: "https://robotics.nasa.gov/spaceflight-qa/",
    sourceLabel: "NASA｜太空人如何睡覺？",
    note: "角色、對話和分支情節為虛構，睡袋固定的知識參考 NASA 資料。",
    scenes: {
      firstNight: {
        title: "序幕｜太空站的第一夜",
        location: "國際太空站 · 睡眠艙",
        image: "loose",
        dialogue: [
          { speaker: "旁白", text: "結束第一天的任務，你終於走進自己的睡眠艙。一本筆記輕輕漂在身旁。" },
          { speaker: "米亞", text: "歡迎來到太空的夜晚。你打算先做哪一件事？" }
        ],
        choices: [
          { label: "拉近睡袋，扣上固定帶", next: "bagFirst" },
          { label: "把筆記本收進物品袋", next: "bookFirst" },
          { label: "先躺下，試著休息看看", next: "driftEnding" }
        ]
      },
      bagFirst: {
        title: "第二幕｜扣上固定帶",
        location: "你先安排了睡袋",
        image: "loose",
        dialogue: [
          { speaker: "旁白", text: "你把睡袋的固定帶扣在艙壁上。轉過頭，筆記本還在慢慢漂移。" },
          { speaker: "米亞", text: "睡覺的位置有著落了。旁邊這個小傢伙呢？" }
        ],
        choices: [
          { label: "把筆記本收進物品袋", next: "readyBag" },
          { label: "先躺進睡袋看看", next: "notebookEnding" }
        ]
      },
      bookFirst: {
        title: "第二幕｜收好漂浮的小物",
        location: "你先整理了筆記本",
        image: "sleep",
        dialogue: [
          { speaker: "旁白", text: "你將筆記本收好，確認它不會再漂出物品袋。" },
          { speaker: "米亞", text: "小物品準備好了。休息前，再看看睡袋的固定帶吧。" }
        ],
        choices: [
          { label: "把睡袋固定在艙壁", next: "readyBook" },
          { label: "先躺下，試著休息看看", next: "bagEnding" }
        ]
      },
      readyBag: {
        title: "第三幕｜休息空間準備好了",
        location: "先固定睡袋，再整理物品",
        image: "sleep",
        dialogue: [
          { speaker: "米亞", text: "睡袋固定好了，小物也收好了。最後，想怎麼安排艙內的光線？" }
        ],
        choices: [
          { label: "把艙燈調暗", next: "dimEnding" },
          { label: "先維持燈光", next: "lightEnding" }
        ]
      },
      readyBook: {
        title: "第三幕｜每樣東西都有位置",
        location: "先整理物品，再固定睡袋",
        image: "sleep",
        dialogue: [
          { speaker: "旁白", text: "你檢查固定帶與物品袋，一樣一樣確認今晚的準備。" },
          { speaker: "米亞", text: "整理順序可以不同。現在，看看你想怎麼安排燈光。" }
        ],
        choices: [
          { label: "把艙燈調暗", next: "dimEnding" },
          { label: "先維持燈光", next: "lightEnding" }
        ]
      },
      dimEnding: {
        title: "尾聲｜安頓好的第一夜",
        location: "你的睡眠艙",
        image: "sleep",
        dim: true,
        dialogue: [
          { speaker: "旁白", text: "艙燈漸暗，你在固定好的睡袋裡，回想今天第一次看見的地球。" },
          { speaker: "米亞", text: "晚安，見習航員。睡前這些小準備，背後其實藏著太空生活的知識。" }
        ],
        ending: { title: "安頓好自己的第一夜", copy: "你固定了睡袋、收好物品，也調整了燈光。這是你完成的休息前準備。" }
      },
      lightEnding: {
        title: "尾聲｜整理好，再看一眼地球",
        location: "你的睡眠艙",
        image: "sleep",
        dialogue: [
          { speaker: "旁白", text: "睡袋和物品都固定好了。你暫時留著燈光，再看一眼窗外的地球。" },
          { speaker: "米亞", text: "你已經完成固定與收納。等準備休息時，再依需要調整光線。" }
        ],
        ending: { title: "留燈的第一夜", copy: "你選擇暫時保留燈光，同時完成了睡袋與物品的固定。" }
      },
      notebookEnding: {
        title: "尾聲｜漂過來的筆記本",
        location: "一件還沒收好的小物",
        image: "loose",
        dialogue: [
          { speaker: "旁白", text: "你剛安頓好，筆記本又漂進了視線。睡袋固定了，身旁的小物還沒有。" },
          { speaker: "米亞", text: "先把它收好，再安心整理休息空間吧。" }
        ],
        ending: { title: "筆記本提醒了你", copy: "你固定了睡袋，也從漂移的小物，發現休息前還需要完成的準備。" }
      },
      bagEnding: {
        title: "尾聲｜固定帶還沒扣上",
        location: "睡袋旁的提醒",
        image: "loose",
        dialogue: [
          { speaker: "旁白", text: "你收好了筆記本，正準備休息，卻發現睡袋還沒有固定在艙壁上。" },
          { speaker: "米亞", text: "小物和睡袋都需要各自的固定方式。先看看那條固定帶。" }
        ],
        ending: { title: "還需要扣上的固定帶", copy: "你先收好物品，但睡袋仍待固定。從這個結果回想一下，休息前還要完成什麼。" }
      },
      driftEnding: {
        title: "尾聲｜休息前的小插曲",
        location: "第一次在太空過夜",
        image: "loose",
        dialogue: [
          { speaker: "旁白", text: "你正準備躺下，漂移的小物和鬆著的固定帶讓你停了下來。" },
          { speaker: "米亞", text: "在太空站，先替自己和物品找到固定的位置，再開始休息的準備。" }
        ],
        ending: { title: "從一段小插曲學會準備", copy: "你直接試著休息，發現固定與收納的重要。重播時，看看不同的準備順序會發生什麼。" }
      }
    }
  }
};

document.querySelectorAll("[data-film]").forEach((dialog) => {
  const film = films[dialog.dataset.film];
  const find = (name) => dialog.querySelector("[data-film-" + name + "]");
  const frame = find("frame");
  const previousFrame = find("previous");
  const choices = find("choices");
  const nextButton = find("next");
  const skipButton = find("skip");
  const pauseButton = find("pause");
  const player = dialog.querySelector(".cinema-player");
  const prologue = find("prologue");
  const enterButton = find("enter");
  const transcript = find("transcript");
  const transcriptButton = find("toggle-transcript");
  const transcriptLines = find("transcript-lines");
  const previousLine = find("previous-line");
  const more = find("more");
  const storyDialogs = Array.from(document.querySelectorAll("[data-film]"));
  const nextStory = storyDialogs[(storyDialogs.indexOf(dialog) + 1) % storyDialogs.length];
  const nextStoryTitle = nextStory.querySelector(".cinema-bar h2").textContent;
  find("next-story-title").textContent = "下一則：" + nextStoryTitle;
  find("next-story").setAttribute("aria-label", "下一則故事：" + nextStoryTitle);
  const openingEase = "cubic-bezier(0.23, 1, 0.32, 1)";
  let prologueTimer = 0;
  let openingAnimations = [];
  let history = [];
  let lineIndex = 0;
  let paused = true;
  let waiting = false;
  let busy = false;
  let timer = 0;
  let version = 0;
  let shotVersion = 0;
  let camera;
  const soundButtons = [...dialog.querySelectorAll("[data-film-sound]")];
  storySound.subscribe((enabled, available, volume) => {
    soundButtons.forEach(button => {
      button.textContent = available ? (button.dataset.soundLabel || "音效") + "：" + (enabled ? "開啟" : "關閉") : "此瀏覽器不支援音效";
      button.setAttribute("aria-pressed", String(enabled));
      button.disabled = !available;
    });
    find("volume").value = volume;
    find("volume").disabled = !available;
    find("volume-value").value = volume + "%";
  });
  soundButtons.forEach(button => button.addEventListener("click", () => storySound.toggle(dialog)));
  find("volume").addEventListener("input", event => storySound.setVolume(event.target.value));

  function clearOpening() {
    clearTimeout(prologueTimer);
    openingAnimations.forEach((animation) => animation.cancel());
    openingAnimations = [];
    player.style.opacity = "";
  }

  function openingFade(element, duration, delay = 0) {
    const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration, delay, easing: openingEase, fill: "both"
    });
    openingAnimations.push(animation);
    return animation;
  }

  function revealPrologue() {
    clearOpening();
    enterButton.hidden = true;
    enterButton.disabled = false;
    if (reducedMotion.matches) {
      enterButton.hidden = false;
      return;
    }
    openingFade(prologue.querySelector(".prologue-label"), 1000);
    openingFade(find("prologue-title"), 1200, 350);
    let delay = 1700;
    prologue.querySelectorAll(".prologue-paragraph").forEach((paragraph) => {
      openingFade(paragraph, 1400, delay);
      // Keep each paragraph on screen long enough to read before the next appears.
      delay += Math.max(3400, Math.min(5200, paragraph.textContent.length * 85));
    });
    const openingVersion = version;
    prologueTimer = setTimeout(() => {
      if (!dialog.open || version !== openingVersion || dialog.dataset.mode !== "prologue") return;
      enterButton.hidden = false;
      openingFade(enterButton, 1000);
    }, delay);
  }

  function clearPlayback() {
    clearTimeout(timer);
    timer = 0;
  }

  function currentScene() {
    return film.scenes[history[history.length - 1].id];
  }

  function currentLines() {
    return history[history.length - 1].lines;
  }

  function currentSoundtrack() {
    return { ...storySoundtrack(dialog.dataset.film, history[history.length - 1].id, currentLines()[lineIndex]), key: version + ":" + lineIndex, sceneKey: version };
  }

  function speakerLabel(speaker) {
    return speaker === "米亞" ? (dialog.dataset.film === "sleep" ? "米亞｜艙內通訊" : "米亞｜科學官") : "旁白";
  }

  function pausePlayback() {
    paused = true;
    clearPlayback();
    if (camera) camera.pause();
    updateControls();
  }

  function closeTranscript(restoreFocus = true) {
    transcript.hidden = true;
    transcriptButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) transcriptButton.focus({ preventScroll: true });
  }

  function updateTranscript() {
    const lines = [];
    transcriptLines.replaceChildren();
    for (const step of history) {
      const scene = film.scenes[step.id];
      if (step.seen === undefined) continue;
      const chapter = document.createElement("li");
      chapter.className = "transcript-chapter";
      chapter.textContent = scene.title + (step.decision ? " · " + step.decision : "");
      transcriptLines.append(chapter);
      for (const line of (step.lines || scene.dialogue).slice(0, step.seen + 1)) {
        lines.push(line);
        const item = document.createElement("li");
        const speaker = document.createElement("strong");
        speaker.textContent = speakerLabel(line.speaker);
        const copy = document.createElement("p");
        copy.textContent = line.text;
        item.append(speaker, copy);
        transcriptLines.append(item);
      }
    }
    const prior = lines[lines.length - 2];
    previousLine.hidden = !prior;
    previousLine.textContent = prior ? prior.speaker + "：" + prior.text : "";
  }

  function scheduleLine() {
    clearPlayback();
    if (paused || waiting || busy || !dialog.open) return;
    const line = currentLines()[lineIndex];
    timer = setTimeout(advanceLine, Math.max(3300, Math.min(6800, line.text.length * 120)));
  }

  function updateControls() {
    find("back").disabled = busy || history.length <= 1;
    nextButton.disabled = busy || waiting;
    skipButton.hidden = waiting;
    skipButton.disabled = busy;
    pauseButton.disabled = busy;
    pauseButton.textContent = paused ? "自動播放" : "改為手動";
    pauseButton.setAttribute("aria-pressed", String(!paused));
    find("status").textContent = busy ? "正在準備場景" : waiting ? (currentScene().ending ? "故事已完成" : "等待你的決定") : paused ? "手動模式：點「下一句」繼續" : "自動播放中";
  }

  async function renderShot(line, sceneVersion) {
    const shot = ++shotVersion;
    const source = filmImages[line.image || currentScene().image];
    const image = new Image();
    image.src = source;
    try { await image.decode(); } catch { /* Keep the dialogue usable if an image is unavailable. */ }
    if (shot !== shotVersion || sceneVersion !== version || !dialog.open) return false;
    previousFrame.style.transform = getComputedStyle(frame).transform;
    previousFrame.style.objectPosition = frame.style.objectPosition;
    previousFrame.src = frame.getAttribute("src") || source;
    frame.getAnimations().forEach((animation) => animation.cancel());
    frame.src = source;
    const face = line.framing === "face";
    frame.style.objectPosition = face ? "76% 38%" : line.image === "notebook" ? "54% 42%" : "50% 42%";
    frame.style.transformOrigin = face ? "76% 35%" : "50% 42%";
    frame.style.transform = reducedMotion.matches ? "none" : "scale(" + (face ? 1.13 : 1.025) + ")";
    dialog.dataset.shot = line.framing || "wide";
    dialog.dataset.dimmed = String(Boolean(line.dim || currentScene().dim || (dialog.dataset.film === "flash" && history.some(step => step.id === "lights"))));
    if (!reducedMotion.matches) {
      frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: openingEase });
      const scale = face ? 1.13 : 1.025;
      camera = frame.animate([
        { transform: "scale(" + scale + ") translateX(0)" },
        { transform: "scale(" + (scale + 0.035) + ") translateX(-.4%)" }
      ], { duration: 8500, easing: "linear", fill: "forwards" });
    }
    const evidence = find("evidence");
    evidence.hidden = !line.evidence;
    evidence.dataset.view = line.evidence || "";
    if (line.evidence) animateFeedback(evidence);
    find("action").textContent = line.action || "";
    find("action").hidden = !line.action;
    return true;
  }

  async function showLine(play = true) {
    const sceneVersion = version;
    const oldLineTop = find("dialogue").getBoundingClientRect().top;
    const line = currentLines()[lineIndex];
    busy = true;
    clearPlayback();
    updateControls();
    if (!await renderShot(line, sceneVersion)) return false;
    busy = false;
    history[history.length - 1].seen = lineIndex;
    updateTranscript();
    find("speaker").textContent = speakerLabel(line.speaker);
    find("avatar").classList.toggle("is-mia", line.speaker === "米亞");
    find("avatar").classList.toggle("is-radio", line.speaker === "米亞" && dialog.dataset.film === "sleep");
    find("avatar").textContent = line.speaker === "米亞" ? (dialog.dataset.film === "sleep" ? "◉" : "") : "✦";
    find("subtitle").textContent = line.text;
    if (dialog.dataset.mode === "playing") {
      storySound.shot(dialog, currentSoundtrack());
    }
    previousLine.getAnimations().forEach((animation) => animation.cancel());
    if (!previousLine.hidden && !reducedMotion.matches) {
      const distance = Math.max(0, Math.min(90, oldLineTop - previousLine.getBoundingClientRect().top));
      previousLine.animate([
        { opacity: 0.9, transform: "translateY(" + distance + "px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 280, easing: openingEase });
    }
    animateFeedback(find("dialogue"), true);
    updateControls();
    if (play) scheduleLine();
    return true;
  }

  async function showEnding() {
    const endingVersion = ++version;
    busy = true;
    paused = true;
    clearPlayback();
    if (camera) camera.pause();
    storySound.fadeOut(dialog);
    storySound.cue("transition", dialog);
    more.open = false;
    closeTranscript(false);
    find("playback").inert = true;
    dialog.dataset.mode = "ending";
    updateControls();
    if (!reducedMotion.matches) {
      const fadeOut = player.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 700, easing: openingEase, fill: "forwards"
      });
      openingAnimations.push(fadeOut);
      try { await fadeOut.finished; } catch { return; }
    }
    if (endingVersion !== version || !dialog.open) return;
    clearOpening();
    player.style.opacity = "0";
    find("playback").hidden = true;
    find("ending").hidden = false;
    find("ending").inert = true;
    dialog.dataset.mode = "ended";
    storySound.ending(dialog);
    dialog.scrollTop = 0;
    if (!reducedMotion.matches) {
      const fadeIn = openingFade(player, 1100);
      openingFade(dialog.querySelector(".cinema-ending-science"), 1000, 250);
      openingFade(find("route").closest("details"), 900, 400);
      const actions = openingFade(dialog.querySelector(".cinema-ending-actions"), 900, 600);
      openingFade(find("next-story-title"), 900, 600);
      try { await Promise.all([fadeIn.finished, actions.finished]); } catch { return; }
    }
    if (endingVersion !== version || !dialog.open) return;
    clearOpening();
    find("ending").inert = false;
    busy = false;
    updateControls();
    find("ending-title").focus({ preventScroll: true });
  }

  function finishDialogue() {
    clearPlayback();
    waiting = true;
    const scene = currentScene();
    choices.replaceChildren();
    find("prompt").hidden = Boolean(scene.ending) || !scene.choices;
    if (scene.choices) {
      for (const choice of scene.choices) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cinema-choice";
        button.textContent = choice.label;
        button.addEventListener("click", () => {
          if (!waiting || busy) return;
          storySound.cue("choice", dialog);
          history.push({ id: choice.next, decision: choice.label });
          renderScene();
        });
        choices.append(button);
      }
      animateFeedback(choices, true);
    } else if (scene.ending) {
      find("ending-title").textContent = scene.ending.title;
      find("ending-copy").textContent = scene.ending.copy;
      const recap = storyRouteRecap(dialog.dataset.film, history);
      if (recap.title) find("ending-title").textContent = recap.title;
      if (recap.copy) find("ending-copy").textContent = recap.copy;
      find("ending-recap").textContent = recap.recap;
      find("ending-reflection").textContent = recap.reflection;
      find("science").textContent = film.science;
      find("source").href = film.source;
      find("source").textContent = film.sourceLabel + " ↗";
      const route = find("route");
      route.replaceChildren();
      for (const step of history.filter((step) => step.decision)) {
        const item = document.createElement("li");
        item.textContent = step.decision;
        route.append(item);
      }
      showEnding();
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cinema-choice";
      button.textContent = "繼續故事 →";
      button.addEventListener("click", () => {
        if (!waiting || busy) return;
        storySound.cue("choice", dialog);
        history.push({ id: scene.next });
        renderScene();
      });
      choices.append(button);
    }
    updateControls();
  }

  function advanceLine() {
    if (busy || waiting || !dialog.open) return;
    if (lineIndex < currentLines().length - 1) {
      lineIndex++;
      showLine();
    } else {
      finishDialogue();
    }
  }

  async function renderScene(opening = false) {
    clearPlayback();
    more.open = false;
    closeTranscript(false);
    const renderVersion = ++version;
    const scene = currentScene();
    history[history.length - 1].lines = directStoryScene(dialog.dataset.film, history[history.length - 1].id, scene, history);
    busy = true;
    waiting = false;
    lineIndex = 0;
    choices.replaceChildren();
    find("prompt").hidden = true;
    find("ending").hidden = true;
    find("scene").textContent = scene.title;
    find("location").textContent = scene.location;
    find("note").textContent = film.note;
    updateControls();
    dialog.scrollTop = 0;
    if (!await showLine(!opening) || renderVersion !== version || !dialog.open) return;
    if (!opening) nextButton.focus({ preventScroll: true });
    return renderVersion;
  }

  async function startFilm() {
    if (enterButton.hidden || enterButton.disabled || dialog.dataset.mode !== "prologue") return;
    clearOpening();
    enterButton.disabled = true;
    find("playback").inert = true;
    dialog.dataset.mode = "entering";
    const openingVersion = ++version;
    await storySound.prepare();
    if (!dialog.open || version !== openingVersion) return;
    storySound.fadeOut(dialog);
    storySound.cue("transition", dialog);
    if (!reducedMotion.matches) {
      const fadeOut = prologue.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 700, easing: openingEase, fill: "forwards"
      });
      openingAnimations.push(fadeOut);
      try { await fadeOut.finished; } catch { return; }
    }
    if (!dialog.open || version !== openingVersion) return;
    player.style.opacity = "0";
    prologue.hidden = true;
    find("playback").hidden = false;
    paused = true;
    history = [{ id: film.start }];
    const sceneVersion = await renderScene(true);
    if (!sceneVersion || sceneVersion !== version || !dialog.open) return;
    dialog.dataset.mode = "playing";
    storySound.shot(dialog, currentSoundtrack());
    if (!reducedMotion.matches) {
      const fadeIn = openingFade(player, 1200);
      try { await fadeIn.finished; } catch { return; }
    }
    if (sceneVersion !== version || !dialog.open) return;
    clearOpening();
    find("playback").inert = false;
    if (document.hidden) paused = true;
    updateControls();
    scheduleLine();
    nextButton.focus({ preventScroll: true });
  }

  function showPrologue() {
    version++;
    shotVersion++;
    storySound.stop(dialog);
    clearOpening();
    clearPlayback();
    if (camera) camera.cancel();
    frame.getAnimations().forEach((animation) => animation.cancel());
    frame.removeAttribute("src");
    previousFrame.removeAttribute("src");
    history = [];
    transcriptLines.replaceChildren();
    previousLine.hidden = true;
    more.open = false;
    closeTranscript(false);
    busy = true;
    waiting = false;
    dialog.dataset.mode = "prologue";
    find("playback").hidden = true;
    find("playback").inert = false;
    find("ending").hidden = true;
    find("ending").inert = false;
    find("prologue").hidden = false;
    dialog.scrollTop = 0;
    find("prologue-title").focus({ preventScroll: true });
    revealPrologue();
    storySound.start(dialog);
  }

  nextButton.addEventListener("click", advanceLine);
  transcriptButton.addEventListener("click", () => {
    if (!transcript.hidden) { closeTranscript(); return; }
    more.open = false;
    pausePlayback();
    transcript.hidden = false;
    transcriptButton.setAttribute("aria-expanded", "true");
    transcriptLines.scrollTop = transcriptLines.scrollHeight;
    find("close-transcript").focus({ preventScroll: true });
    animateFeedback(transcript);
  });
  find("close-transcript").addEventListener("click", () => closeTranscript());
  more.addEventListener("toggle", () => {
    if (more.open && dialog.open && dialog.dataset.mode === "playing") {
      closeTranscript(false);
      pausePlayback();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    if (!transcript.hidden) {
      event.preventDefault();
      closeTranscript();
    } else if (more.open) {
      event.preventDefault();
      more.open = false;
      more.querySelector("summary").focus({ preventScroll: true });
    }
  });
  skipButton.addEventListener("click", async () => {
    if (busy || waiting) return;
    more.open = false;
    lineIndex = currentLines().length - 1;
    if (!await showLine(false)) return;
    finishDialogue();
    const destination = choices.querySelector("button");
    if (destination) destination.focus({ preventScroll: true });
  });
  pauseButton.addEventListener("click", () => {
    closeTranscript(false);
    more.open = false;
    paused = !paused;
    updateControls();
    scheduleLine();
  });
  find("back").addEventListener("click", () => {
    if (busy || history.length <= 1) return;
    history.pop();
    renderScene();
  });
  find("enter").addEventListener("click", startFilm);
  find("return-list").addEventListener("click", () => dialog.close());
  find("next-story").addEventListener("click", () => {
    // Let the current dialog finish closing and restore focus before opening the next story.
    dialog.addEventListener("close", () => {
      document.querySelector('[data-open-activity="' + nextStory.id + '"]').click();
    }, { once: true });
    dialog.close();
  });
  find("restart").addEventListener("click", showPrologue);
  document.querySelector('[data-open-activity="' + dialog.id + '"]').addEventListener("click", showPrologue);
  dialog.addEventListener("close", () => {
    version++;
    shotVersion++;
    storySound.stop(dialog);
    clearOpening();
    clearPlayback();
    if (camera) camera.cancel();
    frame.getAnimations().forEach((animation) => animation.cancel());
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) frame.getAnimations().forEach((animation) => animation.cancel());
    if (reducedMotion.matches && dialog.open && dialog.dataset.mode === "prologue") revealPrologue();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden || !dialog.open || dialog.dataset.mode !== "playing") return;
    paused = true;
    clearPlayback();
    if (camera) camera.pause();
    updateControls();
  });
});
