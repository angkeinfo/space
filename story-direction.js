"use strict";

// Shots stay within the established cabin and character references.
function directStoryScene(filmKey, sceneId, scene, history) {
  const visited = new Set(history.slice(0, -1).map(step => step.id));
  const shot = (speaker, text, image, framing = "wide", extra = {}) => ({ speaker, text, image, framing, ...extra });
  const lines = scene.dialogue.map((line, index) => ({
    ...line, image: scene.image,
    framing: line.speaker === "米亞" && filmKey === "flash" ? "face" : index === 0 ? "wide" : "detail"
  }));
  if (filmKey === "flash") {
    if (sceneId === "departure") {
      lines[0].sound = "launch";
      lines[0].ambience = "launch";
      lines[1].image = "mentor";
      lines[1].sound = "comms";
      lines[1].ambience = "cruise";
    }
    if (sceneId === "flash") {
      lines[0].framing = "face";
      lines[1].image = "instrument";
      lines[1].framing = "detail";
      lines[1].sound = "data";
    }
    if (sceneId === "lights") return [
      shot("旁白", "你伸手轉動調光旋鈕。艙燈緩緩暗下，米亞安靜地等待。", "lamp", "detail", { sound: "switch", action: "艙燈已調暗", dim: true }),
      shot("米亞", "我再閉上眼睛。你幫我記下來：剛才的亮點很短暫，我還不能確定原因。", "cabin", "face", { sound: "comms", dim: true }),
      shot("米亞", "阿波羅任務也記錄過：太空人在暗處、甚至閉眼時，仍會察覺亮點。你想接著怎麼觀察？", "cabin", "face", { dim: true })
    ];
    if (sceneId === "records") return [
      shot("旁白", "你按下紀錄器的開關。紙帶開始展開，一份是粒子探測紀錄，另一份是亮點回報。", "instrument", "detail", { evidence: "records", sound: "data", action: "紀錄器已開啟" }),
      shot("米亞", "你選擇先找紀錄，我記下了。接下來，可以把兩份資料放在一起，或先補問當時的觀察。", "mentor", "face", { sound: "comms" })
    ];
    if (sceneId === "eyes") {
      const memory = visited.has("lights")
        ? "你剛才先把艙燈調暗了。現在，我會再閉上眼，讓你補上這次觀察。"
        : "你剛才先打開了紀錄器。現在，我再閉上眼，讓你把觀察和紀錄一起留下。";
      return [
        shot("米亞", memory, "cabin", "face", { sound: "comms", action: "補記閉眼時的觀察" }),
        shot("米亞", "閉上眼仍能察覺亮點，這是需要解釋的線索。我們還能用什麼方法檢查它？", "cabin", "face"),
        shot("旁白", "你在筆記旁畫上一個問號。現在，可以把觀察帶回資料裡，或先記下還不知道的事。", "instrument", "detail", { sound: "write" })
      ];
    }
    if (sceneId === "lampGuess") {
      lines[0].text = "你把艙燈列為可能原因，我先替你記著。接下來，看看這個想法能不能解釋暗處、閉眼時的觀察。";
      lines[0].sound = "write";
    }
    if (sceneId === "compareLights" || sceneId === "compareRecords") {
      const memory = sceneId === "compareRecords"
        ? "你先選擇了紀錄器。現在，我會把兩份資料放在同一個時間軸上，陪你一起看。"
        : visited.has("lampGuess")
          ? "你願意重新檢查艙燈的假設。我們把它和紀錄放在一起看。"
          : visited.has("lights")
            ? "你已調暗艙燈，也問過閉眼的觀察。現在，把這些線索帶回紀錄裡。"
            : "你查過紀錄，又補問了閉眼的觀察。現在，讓我們回來比對這兩份資料。";
      return [
        shot("米亞", memory, "instrument", "detail", { evidence: "compare", sound: "compare", action: "兩份紀錄已並排 · 教學示意" }),
        shot("旁白", "你沿著同一時段查看兩份紀錄，留下可以比較的問題。這裡的圖樣是劇情示意，不是實際研究量測。", "instrument", "detail", { evidence: "compare" }),
        shot("米亞", "探測事件和目擊回報需要一起檢查。結合剛才的線索，你想怎麼安排下一步？", "mentor", "face", { sound: "comms" })
      ];
    }
    if (sceneId === "lightEnding") lines[0].text = visited.has("lights")
      ? "我記得，你先調暗了艙燈，又把觀察帶回資料裡。這一路上，你也願意跟著證據調整想法。"
      : "我記得，你先開啟了紀錄器，接著補問閉眼時的觀察，再回來比對資料。線索就這樣連了起來。";
    if (sceneId === "recordEnding") lines[0].text = "我記得，你先找紀錄，再把兩份資料放在一起檢查。現在，讓我們翻開這個現象背後的研究。";
    if (sceneId === "openQuestion") {
      lines[0].sound = "write";
      lines[0].image = "instrument";
      lines[0].framing = "detail";
      lines[1].image = "mentor";
      lines[1].text = visited.has("lights")
        ? "你從調暗艙燈開始，現在選擇把還不知道的事記下來。分清楚觀察與猜測，就是下一次調查的起點。"
        : "你從紀錄器開始，現在選擇把還不知道的事記下來。分清楚觀察與猜測，就是下一次調查的起點。";
    }
  } else {
    if (sceneId === "firstNight") {
      lines[0].sound = "cloth";
      lines[1].text = "這裡是米亞，我會透過通訊陪你完成第一夜的準備。先看看睡袋和那本漂著的筆記，你想從哪裡開始？";
      lines[1].sound = "comms";
    }
    if (sceneId === "bagFirst") return [
      shot("旁白", "你拉近睡袋的固定帶，將扣具扣在艙壁上。喀噠一聲，睡袋有了固定的位置。", "buckle", "detail", { sound: "buckle", action: "睡袋固定帶已扣上" }),
      shot("米亞", "我記下了，你先固定了睡袋。身旁那本筆記還在漂，接下來想怎麼安排它？", "buckle", "detail", { sound: "comms" })
    ];
    if (sceneId === "bookFirst") return [
      shot("旁白", "你把漂浮的筆記本收進物品袋，再壓好束帶。它終於留在原位。", "notebook", "detail", { sound: "stow", action: "筆記本已收妥" }),
      shot("米亞", "我記下了，你先照顧了小物品。睡袋還需要自己的固定方式，接著要怎麼做？", "notebook", "detail", { sound: "comms" })
    ];
    if (sceneId === "readyBag") return [
      shot("旁白", "睡袋已固定。你接著把筆記本收進物品袋，壓好束帶。", "notebook", "detail", { sound: "stow", action: "筆記本已收妥" }),
      shot("米亞", "你先固定睡袋，再整理筆記本，我都記著。兩樣都安頓好了，最後想怎麼安排艙燈？", "sleep", "wide", { sound: "comms" })
    ];
    if (sceneId === "readyBook") return [
      shot("旁白", "筆記本已收好。你接著拉好睡袋的固定帶，把扣具扣上。", "buckle", "detail", { sound: "buckle", action: "睡袋固定帶已扣上" }),
      shot("米亞", "你先整理筆記本，再固定睡袋，我都記著。兩樣都安頓好了，最後想怎麼安排艙燈？", "sleep", "wide", { sound: "comms" })
    ];
    if (sceneId === "dimEnding") {
      lines[0].sound = "switch";
      lines[0].action = "艙燈已調暗";
      lines[1].text = visited.has("readyBag")
        ? "晚安，見習航員。我記得你先固定睡袋、再收好筆記，最後調暗艙燈。這是屬於你的第一夜。"
        : "晚安，見習航員。我記得你先收好筆記、再固定睡袋，最後調暗艙燈。這是屬於你的第一夜。";
    }
    if (sceneId === "lightEnding") {
      lines[0].sound = "cloth";
      lines[1].text = visited.has("readyBag")
      ? "你先固定睡袋，再收好筆記，現在選擇暫時留燈。我記得這個順序。等準備休息時，再依需要調整光線。"
      : "你先收好筆記，再固定睡袋，現在選擇暫時留燈。我記得這個順序。等準備休息時，再依需要調整光線。";
    }
    if (sceneId === "notebookEnding") {
      lines[0].sound = "cloth";
      lines.forEach(line => { line.image = "buckle"; line.framing = "detail"; });
      lines[0].action = "睡袋已固定 · 筆記本仍待收好";
      lines[1].text = "我記得你先扣好了睡袋。現在，把筆記也收妥，就能少一件漂來漂去的小物。";
    }
    if (sceneId === "bagEnding") {
      lines[0].sound = "cloth";
      lines.forEach(line => { line.image = "notebook"; line.framing = "detail"; });
      lines[0].action = "筆記本已收妥 · 睡袋仍待固定";
      lines[1].text = "我記得你先收好了筆記。現在，別忘了睡袋也需要自己的固定方式。";
    }
    if (sceneId === "driftEnding") {
      lines[0].sound = "cloth";
      lines[0].action = "休息前，還有兩項準備";
      lines[1].text = "你先試著休息，讓我們注意到還沒完成的準備。先替睡袋和小物找到固定的位置吧。";
    }
  }
  return lines;
}

function storySoundtrack(key, sceneId, line) {
  const profile = line.ambience || (key === "sleep" ? (sceneId === "dimEnding" ? "sleep" : "station")
    : ["records", "compareRecords", "compareLights"].includes(sceneId) || line.image === "instrument" ? "equipment" : "cruise");
  return { profile, cue: line.sound || "cut" };
}

function storyRouteRecap(key, history) {
  const visited = new Set(history.map(step => step.id));
  const ending = history[history.length - 1].id;
  if (key === "flash") {
    const fromLights = visited.has("lights");
    const start = fromLights ? "你先調暗艙燈" : "你先打開紀錄器";
    const observations = visited.has("eyes") ? "，接著補問閉眼時的觀察" : "";
    const revision = visited.has("lampGuess") ? "。你曾把艙燈列為假設" + (visited.has("compareLights") ? "，後來選擇重新比對紀錄" : "，並把它留下來等待檢驗") : "";
    const conclusion = ending === "openQuestion"
      ? "。最後，你保留了還想知道的問題，讓它成為下次調查的起點。"
      : "。最後，你把兩份紀錄放在一起，將高能粒子列為值得進一步檢查的方向。";
    return {
      title: ending === "lightEnding" && !fromLights ? "把紀錄與觀察連起來" : null,
      copy: ending === "lightEnding" && !fromLights ? "你從紀錄出發，補上閉眼觀察，再把線索帶回資料比對。" : null,
      recap: start + observations + revision + conclusion,
      reflection: ending === "openQuestion" ? "米亞留下的提醒：分清楚觀察和猜測，再想想下一次要補上哪一項資料。" : "米亞留下的提醒：讓解釋跟著證據調整，也替還沒釐清的地方保留問題。"
    };
  }
  const bagFirst = visited.has("bagFirst");
  const complete = visited.has("readyBag") || visited.has("readyBook");
  let recap;
  if (complete) recap = bagFirst ? "你先扣好睡袋的固定帶，再把筆記本收進物品袋。" : "你先收好漂浮的筆記本，再扣好睡袋的固定帶。";
  else if (ending === "notebookEnding") recap = "你先固定睡袋，接著試著休息；漂回來的筆記本提醒你，小物也需要收好。";
  else if (ending === "bagEnding") recap = "你先收好筆記本，接著試著休息；還沒扣上的固定帶提醒你，睡袋也需要固定。";
  else recap = "你直接試著休息，從漂移的小物與鬆著的固定帶，發現太空生活需要不同的準備。";
  if (complete) recap += ending === "dimEnding" ? "最後，你調暗艙燈，安頓好自己的第一夜。" : "最後，你暫時保留燈光，再看一眼地球。";
  return { recap, reflection: "米亞留下的提醒：整理的順序可以不同，睡袋與小物都需要各自的固定方式。" };
}
