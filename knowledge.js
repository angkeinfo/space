"use strict";

(() => {
  const form = document.getElementById("knowledge-filters");
  const search = document.getElementById("knowledge-search");
  const categories = document.getElementById("knowledge-categories");
  const buttons = [...categories.querySelectorAll("button[data-category]")];
  const reset = document.getElementById("knowledge-reset");
  const empty = document.getElementById("knowledge-empty");
  const count = document.getElementById("knowledge-count");
  const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase();
  const articles = [...document.querySelectorAll("#knowledge-articles > article")].map((element) => ({
    element,
    category: element.dataset.category,
    text: normalize([
      element.querySelector("h2").textContent,
      element.querySelector(".article-summary").textContent,
      element.querySelector(".article-category").textContent,
      element.dataset.keywords || "",
    ].join(" ")),
  }));
  let selectedCategory = "all";

  function filterArticles() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const article of articles) {
      const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
      article.element.hidden = !matchesCategory || !terms.every((term) => article.text.includes(term));
      if (!article.element.hidden) visible += 1;
    }
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.category === selectedCategory));
    }
    const filtering = terms.length > 0 || selectedCategory !== "all";
    count.textContent = filtering
      ? `找到 ${visible} 篇文章（共 ${articles.length} 篇）`
      : `共 ${articles.length} 篇文章`;
    empty.hidden = visible !== 0;
    reset.hidden = !filtering;
  }

  function clearFilters() {
    search.value = "";
    selectedCategory = "all";
    filterArticles();
    search.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterArticles();
  });
  search.addEventListener("input", (event) => {
    if (!event.isComposing) filterArticles();
  });
  search.addEventListener("compositionend", filterArticles);
  categories.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    filterArticles();
  });
  reset.addEventListener("click", clearFilters);
  document.getElementById("knowledge-empty-reset").addEventListener("click", clearFilters);

  form.hidden = false;
  filterArticles();
})();
