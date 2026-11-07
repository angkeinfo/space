"use strict";

const get = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function animateFeedback(element, emphasis = false) {
  if (reducedMotion.matches) return;
  element.getAnimations().forEach((animation) => animation.cancel());
  const frames = emphasis
    ? [{ opacity: 0.3, transform: "translateY(10px) scale(.985)" }, { opacity: 1, transform: "translateY(0) scale(1)" }]
    : [{ opacity: 0.55 }, { opacity: 1 }];
  element.animate(frames, { duration: emphasis ? 280 : 180, easing: "cubic-bezier(.23,1,.32,1)" });
}

document.querySelectorAll(".activity-dialog").forEach((dialog) => {
  const heading = get(dialog.getAttribute("aria-labelledby"));
  let opener;

  document.querySelectorAll(`[data-open-activity="${dialog.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      opener = button;
      dialog.showModal();
      dialog.scrollTop = 0;
      heading.focus({ preventScroll: true });
    });
  });

  dialog.querySelector("[data-close-activity]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener.focus({ preventScroll: true }));
});

document.querySelectorAll("[data-quiz]").forEach((quiz) => {
  const feedback = quiz.querySelector(".quiz-feedback");
  const dialog = quiz.closest(".activity-dialog");
  const confirmation = document.createElement("p");
  confirmation.className = "choice-confirmation";
  confirmation.setAttribute("role", "status");
  quiz.querySelector("fieldset").after(confirmation);

  quiz.addEventListener("change", () => {
    const choice = quiz.querySelector("input:checked");
    feedback.textContent = "";
    feedback.removeAttribute("data-state");
    quiz.dataset.state = "selected";
    dialog.dataset.scene = "selected";
    confirmation.textContent = "已選擇「" + choice.closest("label").textContent.trim() + "」。按下方按鈕查看結果。";
    const status = dialog.querySelector(".scene-status");
    if (status) status.textContent = "選擇已記錄";
    animateFeedback(confirmation);
  });
  quiz.addEventListener("submit", (event) => {
    event.preventDefault();
    const choice = quiz.querySelector("input:checked");
    if (!choice) return;
    const correct = choice.hasAttribute("data-correct");
    confirmation.textContent = "你的選擇「" + choice.closest("label").textContent.trim() + "」。";
    feedback.dataset.state = correct ? "correct" : "retry";
    quiz.dataset.state = feedback.dataset.state;
    dialog.dataset.scene = feedback.dataset.state;
    const status = dialog.querySelector(".scene-status");
    if (status) status.textContent = correct ? "睡袋已固定，可以休息了" : "睡袋仍會漂移，再想一想";
    feedback.textContent = (correct ? "答對了。 " : "再想一想。 ") + choice.dataset.feedback;
    animateFeedback(feedback, true);
  });
});
