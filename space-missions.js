"use strict";

(() => {
  const destinations = [
    { id: "mercury", name: "水星", english: "Mercury", type: "岩石行星", position: "離太陽第 1 近", feature: "滿布撞擊坑的地表", description: "水星是最靠近太陽、也是太陽系最小的行星。表面像月球一樣留著許多撞擊坑，幾乎沒有大氣可以留住熱量。", mission: "尋找撞擊的痕跡", prompt: "仔細看看水星的表面。這些圓圓的凹洞，可能是怎麼形成的？", answer: "小行星或彗星撞上表面，就可能留下撞擊坑。水星缺少風雨侵蝕，許多古老的痕跡得以保存。", size: 27, orbit: 0.18, angle: 3.8, period: 95 },
    { id: "venus", name: "金星", english: "Venus", type: "岩石行星", position: "離太陽第 2 近", feature: "厚厚的大氣與雲層", description: "金星的大小和地球相近，卻有截然不同的環境。厚厚的二氧化碳大氣留住熱量，讓它成為太陽系表面最熱的行星。", mission: "找出高溫的原因", prompt: "水星比較靠近太陽，為什麼金星的表面反而更熱？", answer: "距離不是唯一的因素。金星濃厚的二氧化碳大氣產生強烈的溫室效應，讓熱量不容易散失。", size: 37, orbit: 0.28, angle: 1.5, period: 125 },
    { id: "earth", name: "地球", english: "Earth", type: "岩石行星", position: "離太陽第 3 近", feature: "藍色海洋與白色雲層", description: "這是我們的家。地球表面有大片液態水，周圍包覆著大氣，也是目前唯一已知有生命的星球。月球是它的天然衛星。", mission: "辨認我們的家", prompt: "從太空看地球，藍色、綠褐色和白色的區域，分別可能是什麼？", answer: "藍色主要是海洋，綠褐色是陸地，白色可能是雲層或冰雪。試著找找看：哪一種顏色占的面積最大？", size: 43, orbit: 0.39, angle: 5.7, period: 160 },
    { id: "mars", name: "火星", english: "Mars", type: "岩石行星", position: "離太陽第 4 近", feature: "鐵鏽紅的地表", description: "火星是一顆寒冷的岩石行星，地表的氧化鐵讓它呈現紅色。探測車在這裡尋找岩石與地形的線索，研究過去的環境。", mission: "追查紅色的線索", prompt: "火星看起來紅紅的，是因為它很燙嗎？想想生活中還有哪些東西有這種顏色。", answer: "紅色不代表高溫。火星地表含有氧化鐵，就像鐵生鏽時會出現的紅褐色；實際上，火星的環境十分寒冷。", size: 34, orbit: 0.49, angle: 2.65, period: 195 },
    { id: "jupiter", name: "木星", english: "Jupiter", type: "氣體巨行星", position: "離太陽第 5 近", feature: "條紋雲帶與大紅斑", description: "木星是太陽系最大的行星，主要由氫和氦組成。它的雲帶像一道道條紋，大紅斑則是一個持續很久的巨大風暴。", mission: "尋找巨大的風暴", prompt: "找找木星條紋間的紅色斑點。它是一塊陸地，還是一場風暴？", answer: "大紅斑是一場巨大風暴。木星沒有像地球一樣可站立的固體表面，我們看到的條紋與斑點位在大氣中。", size: 79, orbit: 0.64, angle: 0.6, period: 250 },
    { id: "saturn", name: "土星", english: "Saturn", type: "氣體巨行星", position: "離太陽第 6 近", feature: "寬廣而明亮的環", description: "土星最醒目的特徵是美麗的環。這些環由許多冰與岩石碎塊組成；土星本身和木星一樣，主要由氫和氦組成。", mission: "解開行星環的祕密", prompt: "土星環看起來像一整片光碟。它真的是一塊完整的固體嗎？", answer: "土星環是無數碎塊共同繞行的結果，其中多數是冰，也有岩石和塵埃。遠遠望去，才像一圈完整的環。", size: 65, orbit: 0.77, angle: 4.04, period: 310 },
    { id: "uranus", name: "天王星", english: "Uranus", type: "冰巨行星", position: "離太陽第 7 近", feature: "淡藍色與傾斜的自轉軸", description: "天王星呈現淡淡的藍綠色，大氣中的甲烷是原因之一。它的自轉軸傾斜得很厲害，看起來就像側躺著繞太陽運行。", mission: "想像側躺的行星", prompt: "拿一顆球當作天王星。如果它側躺著旋轉，和直立旋轉的樣子有什麼不同？", answer: "天王星的自轉軸幾乎躺在公轉軌道平面上。這種傾斜讓它的季節與日照變化非常特別。", size: 46, orbit: 0.87, angle: 2.95, period: 370 },
    { id: "neptune", name: "海王星", english: "Neptune", type: "冰巨行星", position: "離太陽第 8 近", feature: "藍色大氣與強風", description: "海王星是八大行星中距離太陽最遠的一顆。這個寒冷的藍色世界有強烈的風和風暴，即使遠離太陽，大氣仍然十分活躍。", mission: "分辨海洋與大氣", prompt: "海王星和地球都呈現藍色。看到藍色，就能判斷它的表面有海洋嗎？", answer: "不能只靠顏色判斷。海王星的藍色來自大氣對光的作用，並不代表它有像地球一樣的表面海洋。", size: 44, orbit: 0.98, angle: 5.6, period: 430 },
    { id: "moon", name: "月球", english: "Moon", type: "地球的天然衛星", position: "繞著地球運行", feature: "月海與撞擊坑", description: "月球不是行星，而是繞著地球運行的天然衛星。深色的月海是古老熔岩形成的平原，表面也保留著許多撞擊坑。", mission: "出發，月面採樣！", prompt: "駕駛月球車前往採樣點，留意路線與電量，再把樣本帶回基地。", answer: "先規劃返程需要的電量。平原和崎嶇地形的耗電不同，選擇路線時也要考慮想採集哪一種樣本。", size: 18, angle: 0.2, period: 35 }
  ];
  const sun = {
    id: "sun", name: "太陽", english: "Sun", type: "恆星",
    position: "太陽系的中心恆星", feature: "明亮的活動區與日冕",
    description: "太陽是太陽系裡的恆星，主要由氫和氦組成。它的核心進行核融合，釋放出光和熱，為地球帶來能量。八大行星都繞著它運行。",
    mission: "分辨誰會自己發光",
    prompt: "太陽和行星在照片裡都很明亮。它們發光的方式一樣嗎？哪一個會自己產生光與熱？",
    answer: "太陽是恆星，核心的核融合產生能量，向外發出光與熱。行星主要反射太陽的光。試著比較太陽明亮的活動區與行星表面的紋理！",
    button: document.getElementById("space-sun")
  };
  const interactiveBodies = [...destinations, sun];
  const explorer = document.getElementById("space-explorer");
  const viewport = document.getElementById("space-viewport");
  const camera = document.getElementById("space-camera");
  const planetLayer = document.getElementById("space-planets");
  const trackLayer = document.getElementById("orbit-tracks");
  const detail = document.getElementById("planet-detail");
  const back = document.getElementById("space-back");
  const pause = document.getElementById("space-pause");
  const lunarMissions = document.getElementById("lunar-missions");
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const photoCredits = {
    sun: { mission: "SDO / AIA 171 Å（極紫外光著色影像）", credit: "NASA / GSFC / Solar Dynamics Observatory", url: "https://science.nasa.gov/photojournal/image-of-sun-from-nasas-solar-dynamics-observatory/" },
    mercury: { mission: "MESSENGER", credit: "NASA / JHUAPL / Carnegie", url: "https://science.nasa.gov/wp-content/uploads/2024/03/pia15162-mercury-basins-messenger-16x9-1.jpg" },
    venus: { mission: "Mariner 10", credit: "NASA / JPL-Caltech", url: "https://science.nasa.gov/wp-content/uploads/2024/03/venus-mariner-10-pia23791-fig2-16x9-1.jpg" },
    earth: { mission: "Apollo 17", credit: "NASA", url: "https://science.nasa.gov/wp-content/uploads/2024/03/blue-marble-apollo-17-16x9-1.jpg" },
    mars: { mission: "Viking", credit: "NASA / JPL-Caltech / USGS", url: "https://science.nasa.gov/wp-content/uploads/2024/03/mars-full-globe-16x9-1.jpg" },
    jupiter: { mission: "Juno（色彩增強合成影像）", credit: "NASA / JPL-Caltech / SwRI / MSSS / Kevin M. Gill (CC BY)", url: "https://www.jpl.nasa.gov/images/pia22946-jupiter-marble/" },
    saturn: { mission: "Cassini", credit: "NASA / JPL-Caltech / Space Science Institute", url: "https://science.nasa.gov/wp-content/uploads/2023/05/saturn-farewell-pia21345-sse-banner-1920x640-1.jpg" },
    uranus: { mission: "Voyager 2", credit: "NASA / JPL-Caltech", url: "https://science.nasa.gov/wp-content/uploads/2024/03/uranus-pia18182-16x9-1.jpg" },
    neptune: { mission: "Voyager 2（經色彩處理）", credit: "NASA / JPL", url: "https://science.nasa.gov/wp-content/uploads/2024/03/pia01492-neptune-full-disk-16x9-1.jpg" },
    moon: { mission: "LRO（攝影資料合成）", credit: "NASA / GSFC / Arizona State University", url: "https://science.nasa.gov/resource/lunar-near-side/" }
  };
  let selected = null;
  let paused = false;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let dimensions;
  let opener;
  let pointingAtPlanet = false;
  let keyboardOnPlanet = false;

  destinations.forEach((planet) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "space-planet planet-" + planet.id;
    button.style.setProperty("--planet-size", planet.size + "px");
    button.setAttribute("aria-label", "探索" + planet.name);
    button.setAttribute("aria-controls", "planet-detail");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = '<span class="planet-visual" aria-hidden="true"><span class="planet-sphere"></span></span><span class="planet-name">' + planet.name + "</span>";
    planetLayer.append(button);
    planet.button = button;
    connectDestination(planet);
    if (planet.id !== "moon") {
      const track = document.createElement("span");
      track.className = "orbit-track";
      trackLayer.append(track);
      planet.track = track;
    }
  });
  connectDestination(sun);

  function connectDestination(body) {
    const button = body.button;
    button.addEventListener("click", (event) => selectPlanet(body, button, event.detail === 0));
    button.addEventListener("pointerenter", () => { pointingAtPlanet = true; updateAnimation(); });
    button.addEventListener("pointerleave", () => { pointingAtPlanet = false; updateAnimation(); });
    button.addEventListener("focus", () => { keyboardOnPlanet = button.matches(":focus-visible"); updateAnimation(); });
    button.addEventListener("blur", () => { keyboardOnPlanet = false; updateAnimation(); });
  }

  function measure() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const mobile = width <= 700;
    dimensions = { width, height, mobile, cx: width * 0.49, cy: mobile ? 300 : height * 0.53, rx: width * (mobile ? 0.41 : 0.43), ry: mobile ? 180 : Math.min(height * 0.32, 255) };
    sun.x = dimensions.cx;
    sun.y = dimensions.cy;
    sun.renderSize = mobile ? 56 : 92;
    sun.button.style.left = sun.x + "px";
    sun.button.style.top = sun.y + "px";
    destinations.forEach((planet, index) => {
      planet.renderSize = Math.max(mobile ? 30 : 38, planet.size * (mobile ? 1.02 : 1.45));
      planet.renderOrbit = (mobile ? [0.34, 0.5, 0.62, 0.72, 0.8, 0.88, 0.97, 1.02] : [0.23, 0.35, 0.47, 0.59, 0.7, 0.82, 0.92, 1.02])[index];
      planet.button.style.setProperty("--planet-size", planet.renderSize + "px");
      if (!planet.track) return;
      Object.assign(planet.track.style, { left: dimensions.cx + "px", top: dimensions.cy + "px", width: dimensions.rx * planet.renderOrbit * 2 + "px", height: dimensions.ry * planet.renderOrbit * 2 + "px" });
    });
    positionPlanets();
    moveCamera();
  }

  function positionPlanets() {
    const { cx, cy, rx, ry } = dimensions;
    destinations.forEach((planet, index) => {
      const startingAngle = dimensions.mobile ? [3.8, 1.65, 5.7, 2.3, 0.6, 4.04, 3.2, 5.6, 0.2][index] : planet.id === "venus" ? 1.05 : planet.angle;
      const angle = startingAngle + elapsed / (planet.period * 1000) * Math.PI * 2;
      if (planet.id === "moon") {
        const earth = destinations.find((item) => item.id === "earth");
        const radius = dimensions.mobile ? 58 : 76;
        planet.x = earth.x + Math.cos(angle) * radius;
        planet.y = earth.y + Math.sin(angle) * radius;
      } else {
        planet.x = cx + Math.cos(angle) * rx * planet.renderOrbit;
        planet.y = cy + Math.sin(angle) * ry * planet.renderOrbit;
      }
    });
    separateTargets();
    destinations.forEach((planet) => {
      planet.button.style.transform = `translate(${planet.x}px, ${planet.y}px) translate(-50%, -50%)`;
    });
  }

  function separateTargets() {
    // This projected teaching diagram prioritizes clear, non-overlapping touch targets.
    const radius = (planet) => Math.max(56, planet.renderSize * (planet.id === "saturn" ? 2.28 : 1) + 12) / 2;
    for (let pass = 0; pass < 48; pass++) {
      destinations.forEach((planet, index) => {
        const r = radius(planet);
        for (let next = index + 1; next < destinations.length; next++) {
          const other = destinations[next];
          const dx = other.x - planet.x;
          const dy = other.y - planet.y;
          const distance = Math.hypot(dx, dy) || 1;
          const overlap = r + radius(other) + 12 - distance;
          if (overlap <= 0) continue;
          const moveX = (dx || 0.1) / distance * overlap / 2;
          const moveY = (dy || 0.1) / distance * overlap / 2;
          planet.x -= moveX;
          planet.y -= moveY;
          other.x += moveX;
          other.y += moveY;
        }
        const dx = planet.x - dimensions.cx;
        const dy = planet.y - dimensions.cy;
        const distance = Math.hypot(dx, dy) || 1;
        const sunClearance = r + (dimensions.mobile ? 28 : 46) + 10;
        if (distance < sunClearance) {
          planet.x = dimensions.cx + (dx || 0.1) / distance * sunClearance;
          planet.y = dimensions.cy + (dy || 0.1) / distance * sunClearance;
        }
        planet.x = Math.max(r + 10, Math.min(dimensions.width - r - 10, planet.x));
        planet.y = Math.max(dimensions.mobile ? 165 : 130, Math.min(dimensions.height - r - 24, planet.y));
      });
    }
  }

  function moveCamera() {
    if (!selected) {
      camera.style.transform = "translate(0px, 0px) scale(1)";
      return;
    }
    const scale = Math.min(dimensions.mobile ? 170 : 260, dimensions.width * 0.38) / selected.renderSize;
    const targetX = dimensions.width * (dimensions.mobile ? 0.5 : 0.30);
    const targetY = dimensions.mobile ? 230 : dimensions.height * 0.52;
    camera.style.transform = `translate(${targetX - selected.x * scale}px, ${targetY - selected.y * scale}px) scale(${scale})`;
  }

  function selectPlanet(planet, control, keyboard = false) {
    opener = control;
    selected = planet;
    explorer.classList.add("is-focused");
    explorer.classList.toggle("keyboard-navigation", keyboard);
    interactiveBodies.forEach((item) => {
      const active = item === planet;
      item.button.classList.toggle("is-selected", active);
      item.button.setAttribute("aria-pressed", String(active));
      item.button.setAttribute("aria-hidden", String(!active));
      // Return to the overview before choosing another destination.
      item.button.tabIndex = -1;
    });
    document.getElementById("planet-title").textContent = planet.name;
    document.getElementById("planet-type").textContent = planet.type;
    document.getElementById("planet-english").textContent = planet.english;
    document.getElementById("planet-description").textContent = planet.description;
    const photo = photoCredits[planet.id];
    document.getElementById("planet-photo-mission").textContent = photo.mission;
    document.getElementById("planet-photo-credit").textContent = photo.credit;
    document.getElementById("planet-photo-source").href = photo.url;
    document.getElementById("planet-position").textContent = planet.position;
    document.getElementById("planet-feature").textContent = planet.feature;
    document.getElementById("assignment-title").textContent = planet.mission;
    document.getElementById("assignment-prompt").textContent = planet.prompt;
    document.getElementById("assignment-answer").textContent = planet.answer;
    document.getElementById("assignment-answer").hidden = true;
    document.getElementById("assignment-reveal").setAttribute("aria-expanded", "false");
    document.getElementById("assignment-reveal").textContent = "看看探索提示";
    document.getElementById("lunar-mission-link").hidden = planet.id !== "moon";
    document.getElementById("space-overview-note").hidden = true;
    document.getElementById("space-instruction").hidden = true;
    lunarMissions.hidden = planet.id !== "moon";
    detail.hidden = false;
    back.hidden = false;
    pause.hidden = true;
    moveCamera();
    document.getElementById("space-announcement").textContent = "已抵達" + planet.name + "，可以閱讀介紹與探索任務。";
    if (keyboard) document.getElementById("planet-title").focus({ preventScroll: true });
    if (explorer.getBoundingClientRect().top < 0) explorer.scrollIntoView({ behavior: "instant", block: "start" });
    updateAnimation();
  }

  function returnToOverview(keyboard = false) {
    selected = null;
    explorer.classList.remove("is-focused");
    explorer.classList.toggle("keyboard-navigation", keyboard);
    detail.hidden = true;
    back.hidden = true;
    pause.hidden = false;
    lunarMissions.hidden = true;
    document.getElementById("space-overview-note").hidden = false;
    document.getElementById("space-instruction").hidden = false;
    interactiveBodies.forEach((planet) => {
      planet.button.classList.remove("is-selected");
      planet.button.setAttribute("aria-pressed", "false");
      planet.button.removeAttribute("aria-hidden");
      planet.button.tabIndex = 0;
    });
    moveCamera();
    document.getElementById("space-announcement").textContent = "已返回太陽系總覽。";
    if (opener) opener.focus({ preventScroll: true });
    updateAnimation();
  }

  function tick(time) {
    elapsed += lastTime ? Math.min(time - lastTime, 50) : 0;
    lastTime = time;
    positionPlanets();
    frame = requestAnimationFrame(tick);
  }

  function updateAnimation() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (!selected && !paused && !pointingAtPlanet && !keyboardOnPlanet && !motionPreference.matches && !document.hidden) frame = requestAnimationFrame(tick);
    pause.disabled = motionPreference.matches;
    pause.textContent = motionPreference.matches ? "公轉已靜止" : paused ? "▷ 繼續公轉" : "Ⅱ 暫停公轉";
    pause.setAttribute("aria-pressed", String(paused || motionPreference.matches));
  }

  pause.addEventListener("click", () => { paused = !paused; updateAnimation(); });
  back.addEventListener("click", (event) => returnToOverview(event.detail === 0));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selected && !document.querySelector("dialog[open]")) returnToOverview(true);
  });
  document.getElementById("assignment-reveal").addEventListener("click", (event) => {
    const answer = document.getElementById("assignment-answer");
    answer.hidden = !answer.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!answer.hidden));
    event.currentTarget.textContent = answer.hidden ? "看看探索提示" : "收起探索提示";
  });
  motionPreference.addEventListener("change", updateAnimation);
  document.addEventListener("visibilitychange", updateAnimation);
  new ResizeObserver(measure).observe(viewport);
  measure();
  updateAnimation();

  function openLinkedMoonMission() {
    if (["#sample-mission", "#power-mission", "#lunar-missions"].includes(location.hash)) {
      const moon = destinations.find((planet) => planet.id === "moon");
      selectPlanet(moon, moon.button, true);
      requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: "instant", block: "start" }));
    }
  }
  window.addEventListener("hashchange", openLinkedMoonMission);
  openLinkedMoonMission();
})();
