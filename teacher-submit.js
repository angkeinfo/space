"use strict";

// Static teacher portal: hash routes share one tab's demonstration state.
(() => {
  const store = window.TeacherMaterials;
  const login = get("teacher-login");
  const form = get("teacher-submission");
  const fields = form.elements;
  const mb = 1024 * 1024;
  let editing = null;
  let submitted = false;
  const fileInfo = (file) => ({ name: file.name, size: file.size });
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const showMessage = (id, message, field) => {
    get(id).textContent = message;
    field?.focus();
  };
  const updateStorageNote = () => {
    if (!store.isPersistent()) get("storage-note").textContent = "流程原型：瀏覽器未開放分頁暫存，資料僅在本頁有效；重新整理後會清除。未驗證真實身分，也未上傳檔案內容。";
  };
  const listFiles = (id, files) => {
    get(id).replaceChildren();
    for (const file of files) get(id).append(element("li", file.name + "（" + (file.size / mb).toFixed(2) + " MB）"));
  };
  const resetEditor = () => {
    form.reset();
    editing = null;
    submitted = false;
    get("selected-files").replaceChildren();
    get("existing-files").replaceChildren();
    get("existing-files-panel").hidden = true;
    get("existing-cover").hidden = true;
    get("editing-notice").hidden = true;
    get("upload-message").textContent = "";
    get("submission-fields").disabled = !store.isSignedIn();
    fields.namedItem("files").required = true;
  };
  const renderMaterials = () => {
    const all = store.list();
    const status = get("material-status-filter").value;
    const shown = all.filter((item) => !status || item.status === status);
    get("my-materials-list").replaceChildren();
    get("my-materials-count").textContent = "共 " + all.length + " 份教材，目前顯示 " + shown.length + " 份";
    get("my-materials-empty").hidden = shown.length > 0;
    for (const item of shown) {
      const card = element("article", "", "my-material-card");
      const cover = element("div", "", "my-material-cover");
      // Only use bundled covers; uploaded image content is not retained in this prototype.
      if (["assets/mission-rover.png", "assets/story.png"].includes(item.image)) {
        const image = element("img");
        image.src = item.image;
        image.alt = "";
        cover.append(image);
      } else {
        cover.append(element("span", "教材", "material-cover-label"));
      }
      cover.setAttribute("aria-hidden", "true");
      const content = element("div", "", "my-material-content");
      const top = element("div", "", "my-material-top");
      const badge = element("span", store.statuses[item.status], "review-status");
      badge.dataset.status = item.status;
      const time = element("time", "更新於 " + new Date(item.updatedAt).toLocaleDateString("zh-TW"));
      time.dateTime = item.updatedAt;
      top.append(badge, time);
      const heading = element("h3", item.title);
      const tags = element("ul", "", "material-tags");
      tags.setAttribute("aria-label", "教材標籤");
      for (const tag of [item.age, ...item.tags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean)]) tags.append(element("li", tag));
      content.append(top, heading, tags, element("p", item.summary, "article-summary"));
      content.append(element("p", "附件：" + item.files.map((file) => file.name).join("、"), "my-material-files"));
      if (item.reviewNote) content.append(element("p", "審核回覆：" + item.reviewNote, "review-note"));
      const actions = element("div", "", "actions");
      const edit = element("a", item.status === "revision" ? "修改並重新送審" : "編輯教材", "button");
      edit.href = "#edit/" + encodeURIComponent(item.id);
      edit.setAttribute("aria-label", "編輯教材：" + item.title);
      actions.append(edit);
      content.append(actions);
      card.append(cover, content);
      get("my-materials-list").append(card);
    }
  };
  const showEditor = (record) => {
    resetEditor();
    editing = record;
    get("upload-title").textContent = record ? "編輯教材" : "新增教材";
    get("save-material").textContent = record ? "儲存修改並送審" : "送交審核";
    get("editing-notice").hidden = !record;
    if (record) {
      for (const name of ["title", "age", "tags", "summary", "license"]) fields.namedItem(name).value = record[name];
      fields.namedItem("files").required = false;
      get("existing-files-panel").hidden = false;
      listFiles("existing-files", record.files);
      get("existing-cover").textContent = "原有封面：" + (record.cover?.name || "未設定");
      get("existing-cover").hidden = false;
    }
  };
  const receipt = (record) => {
    get("receipt-material").textContent = record.title;
    get("receipt-age").textContent = record.age;
    listFiles("receipt-files", record.files);
    get("receipt-edit").href = "#edit/" + encodeURIComponent(record.id);
  };
  const route = () => {
    get("portal-message").textContent = "";
    updateStorageNote();
    const signedIn = store.isSignedIn();
    get("login-panel").hidden = signedIn;
    get("upload-panel").hidden = !signedIn;
    get("submission-fields").disabled = !signedIn;
    for (const id of ["my-materials-panel", "submission-editor", "submission-receipt"]) get(id).hidden = true;
    get("my-materials-link").removeAttribute("aria-current");
    get("new-material-link").removeAttribute("aria-current");
    if (!signedIn) {
      resetEditor();
      get("submission-page-intro").textContent = "登入後，管理你分享的每一份教材。";
      document.title = "教師登入｜下一站，宇宙！";
      return;
    }
    let hash;
    try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { hash = "my-materials"; }
    if (hash === "new" || hash.startsWith("edit/")) {
      const record = hash.startsWith("edit/") ? store.find(hash.slice(5)) : null;
      if (hash.startsWith("edit/") && !record) { window.location.hash = "my-materials"; return; }
      showEditor(record);
      get("submission-editor").hidden = false;
      get("new-material-link").setAttribute("aria-current", "page");
      get("submission-page-intro").textContent = record ? "更新教材內容，讓下一次的課堂探索更完整。" : "讓你的課堂靈感，成為另一位老師的教學起點。";
      document.title = (record ? "編輯教材" : "新增教材") + "｜下一站，宇宙！";
      get("upload-title").focus();
    } else if (hash.startsWith("submitted/")) {
      const record = store.find(hash.slice(10));
      if (!record) { window.location.hash = "my-materials"; return; }
      resetEditor();
      receipt(record);
      get("submission-receipt").hidden = false;
      document.title = "投稿已送交審核｜下一站，宇宙！";
      get("receipt-title").focus();
    } else {
      resetEditor();
      renderMaterials();
      get("my-materials-panel").hidden = false;
      get("my-materials-link").setAttribute("aria-current", "page");
      get("submission-page-intro").textContent = "管理已投稿的教材，查看審核進度與回覆。";
      document.title = "我的教材｜下一站，宇宙！";
      get("my-materials-title").focus();
    }
  };
  get("fill-demo").addEventListener("click", () => {
    get("teacher-email").value = "teacher@example.com";
    get("teacher-password").value = "space-demo";
    get("login-message").textContent = "";
    login.querySelector('[type="submit"]').focus();
  });
  login.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!login.reportValidity()) return;
    if (!store.login(get("teacher-email").value, get("teacher-password").value)) {
      showMessage("login-message", "請使用頁面提供的示範帳密，或點選「填入示範帳密」。", get("teacher-email"));
      get("teacher-password").value = "";
      return;
    }
    login.reset();
    get("login-message").textContent = "";
    route();
  });
  get("teacher-logout").addEventListener("click", () => {
    store.logout();
    get("my-materials-list").replaceChildren();
    get("receipt-material").textContent = "";
    get("receipt-age").textContent = "";
    get("receipt-files").replaceChildren();
    window.location.hash = "my-materials";
    route();
    get("login-title").focus();
  });
  get("material-status-filter").addEventListener("change", renderMaterials);
  fields.namedItem("files").addEventListener("change", () => {
    listFiles("selected-files", fields.namedItem("files").files);
    get("upload-message").textContent = "";
  });
  fields.namedItem("cover").addEventListener("change", () => { get("upload-message").textContent = ""; });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!store.isSignedIn() || submitted) return;
    get("upload-message").textContent = "";
    if (!form.reportValidity()) return;
    for (const name of ["title", "summary"]) {
      if (!fields.namedItem(name).value.trim()) {
        showMessage("upload-message", "請填寫教材名稱與簡述，不能只輸入空白。", fields.namedItem(name));
        return;
      }
    }
    const cover = fields.namedItem("cover").files[0];
    if (cover && (!/\.(jpe?g|png|webp)$/i.test(cover.name) || !cover.size || cover.size > 5 * mb)) {
      showMessage("upload-message", "請選擇 5 MB 以內、非空白的 JPG、PNG 或 WebP 封面。", fields.namedItem("cover"));
      return;
    }
    const chosenFiles = [...fields.namedItem("files").files];
    const files = chosenFiles.length ? chosenFiles.map(fileInfo) : editing?.files || [];
    if (!files.length || files.some((file) => !/\.(pptx?|pdf|docx?|zip)$/i.test(file.name) || !file.size || file.size > 20 * mb)) {
      showMessage("upload-message", "請選擇支援的教材附件，每份須為 20 MB 以內且非空白的檔案。", fields.namedItem("files"));
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > 50 * mb) {
      showMessage("upload-message", "教材附件總計不可超過 50 MB，請減少檔案後再送出。", fields.namedItem("files"));
      return;
    }
    const content = {};
    for (const name of ["title", "age", "tags", "summary", "license"]) content[name] = fields.namedItem(name).value.trim();
    content.files = files;
    content.cover = cover ? fileInfo(cover) : editing?.cover || null;
    content.image = cover ? "" : editing?.image || "";
    try {
      const record = store.save(content, editing?.id);
      submitted = true;
      get("material-status-filter").value = "";
      get("submission-fields").disabled = true;
      window.location.hash = "submitted/" + encodeURIComponent(record.id);
    } catch (error) { showMessage("upload-message", error.message); }
    updateStorageNote();
  });
  window.addEventListener("hashchange", route);
  // Restored history must obey the latest demo login state.
  window.addEventListener("pageshow", route);
  route();
})();
