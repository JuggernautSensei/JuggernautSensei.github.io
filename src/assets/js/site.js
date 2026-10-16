document.documentElement.classList.add("js");

const toggle = document.querySelector(".navtoggle");
const sidebar = document.getElementById("primary-nav");

function setMenu(open) {
  sidebar.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  if (open) sidebar.querySelector("a").focus();
}

toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});
