"use strict";

(() => {
  const form = document.getElementById("resource-filters");
  const search = document.getElementById("search");
  const age = document.getElementById("age");
  const topics = document.getElementById("resource-topics");
  const buttons = [...topics.querySelectorAll("button[data-topic]")];
  const count = document.getElementById("resource-count");
  const empty = document.getElementById("resource-empty");
  const resetRow = document.getElementById("resource-reset-row");
  const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase();
  const resources = [...document.querySelectorAll("#resources > article")].map((element) => ({
    element,
    age: element.dataset.age,
    topics: (element.dataset.topics || "").split(/\s+/),
    text: normalize(element.textContent),
  }));
  let selectedTopic = "all";

  function filterResources() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const resource of resources) {
      const matchesTopic = selectedTopic === "all" || resource.topics.includes(selectedTopic);
      const matchesAge = age.value === "" || resource.age === age.value;
      resource.element.hidden = !matchesTopic || !matchesAge || !terms.every((term) => resource.text.includes(term));
      if (!resource.element.hidden) visible += 1;
    }
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.topic === selectedTopic));
    }
    const filtering = terms.length > 0 || age.value !== "" || selectedTopic !== "all";
    count.textContent = filtering
      ? `找到 ${visible} 份教材（共 ${resources.length} 份）`
      : `共 ${resources.length} 份教材`;
    resetRow.hidden = !filtering;
    empty.hidden = visible !== 0;
  }

  function clearFilters() {
    search.value = "";
    age.value = "";
    selectedTopic = "all";
    filterResources();
    search.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterResources();
  });
  search.addEventListener("input", (event) => {
    if (!event.isComposing) filterResources();
  });
  search.addEventListener("compositionend", filterResources);
  age.addEventListener("change", filterResources);
  topics.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-topic]");
    if (!button) return;
    selectedTopic = button.dataset.topic;
    filterResources();
  });
  document.getElementById("resource-reset").addEventListener("click", clearFilters);
  document.getElementById("resource-empty-reset").addEventListener("click", clearFilters);

  form.hidden = false;
  filterResources();
})();
