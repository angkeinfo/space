"use strict";

// Browser-only demo state. No credentials or file contents are stored.
(() => {
  const key = "space-teacher-demo-v1";
  const statuses = { pending: "待審核", approved: "審核通過", revision: "需修改" };
  const seeds = () => [
    { id: "demo-rover", title: "月球車路線比較學習單", age: "國小高年級", tags: "月球、探究活動、學習單", summary: "先預測，再操作兩條月球車路線，記錄電量與樣本，練習用觀察支持選擇。", license: "授權站內展示與下載", cover: { name: "月球車封面.png", size: 512000 }, image: "assets/mission-rover.png", files: [{ name: "月球車路線比較學習單.pptx", size: 2621440 }], status: "pending", reviewNote: "", updatedAt: "2026-11-07T08:00:00+08:00" },
    { id: "demo-flashes", title: "太空人看見閃光的線索卡", age: "國中", tags: "太空人、科學推理", summary: "從閉眼看見亮點的現象提出猜測，整理觀察與探測資料，再練習用證據說明原因。", license: "授權站內展示與下載", cover: { name: "太空人封面.png", size: 640000 }, image: "assets/story.png", files: [{ name: "太空人閃光線索卡.pdf", size: 1572864 }], status: "approved", reviewNote: "教材內容與授權資訊已確認，審核通過。", updatedAt: "2026-11-06T09:00:00+08:00" },
    { id: "demo-moon", title: "月相觀察紀錄活動", age: "國小高年級", tags: "月相、觀察紀錄", summary: "連續觀察月亮的形狀與出現時間，製作班級月相紀錄。", license: "依附件授權條款", cover: null, image: "", files: [{ name: "月相觀察紀錄.docx", size: 786432 }], status: "revision", reviewNote: "請補充建議觀察天數，並於附件註明圖片來源與授權方式。", updatedAt: "2026-11-05T10:00:00+08:00" }
  ];
  const validFile = (file) => file && typeof file.name === "string" && Number.isFinite(file.size) && file.size > 0;
  const validRecord = (item) => item && typeof item.id === "string"
    && ["title", "age", "tags", "summary", "license", "reviewNote", "updatedAt"].every((field) => typeof item[field] === "string")
    && Object.hasOwn(statuses, item.status) && Number.isFinite(Date.parse(item.updatedAt))
    && Array.isArray(item.files) && item.files.length > 0 && item.files.every(validFile)
    && (item.cover === null || validFile(item.cover));
  let state = { signedIn: false, materials: seeds() };
  let persistent = true;
  let stored = null;
  try { stored = sessionStorage.getItem(key); }
  catch { persistent = false; }
  try {
    const saved = JSON.parse(stored);
    if (saved && typeof saved.signedIn === "boolean" && Array.isArray(saved.materials)
      && saved.materials.every(validRecord) && new Set(saved.materials.map((item) => item.id)).size === saved.materials.length) {
      state = saved;
    }
  } catch { /* Invalid demo data starts a fresh session. */ }
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const persist = () => {
    try { sessionStorage.setItem(key, JSON.stringify(state)); }
    catch { persistent = false; }
  };
  window.TeacherMaterials = {
    statuses,
    isSignedIn: () => state.signedIn,
    isPersistent: () => persistent,
    login: (email, password) => {
      if (email.trim().toLowerCase() !== "teacher@example.com" || password !== "space-demo") return false;
      state.signedIn = true;
      persist();
      return true;
    },
    logout: () => { state.signedIn = false; persist(); },
    list: () => state.signedIn ? copy(state.materials) : [],
    find: (id) => state.signedIn ? copy(state.materials.find((item) => item.id === id) || null) : null,
    save: (content, id = null) => {
      if (!state.signedIn) throw new Error("請先登入教師帳號。");
      const previous = id ? state.materials.find((item) => item.id === id) : null;
      if (id && !previous) throw new Error("找不到這份教材，請返回我的教材。");
      const record = {
        ...copy(content), id: previous?.id || "material-" + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)),
        status: "pending", reviewNote: "", updatedAt: new Date().toISOString()
      };
      if (!validRecord(record) || !record.title.trim() || !record.summary.trim()) throw new Error("教材資料不完整，請重新確認。");
      state.materials = [record, ...state.materials.filter((item) => item.id !== record.id)];
      persist();
      return copy(record);
    }
  };
})();
