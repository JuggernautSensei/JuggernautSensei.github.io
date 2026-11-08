document.documentElement.classList.add("js");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const sidebar = document.getElementById("primary-nav");
const toggle = document.querySelector(".navtoggle");

function setMenu(open) {
  sidebar.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  if (open) sidebar.querySelector("a").focus();
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
sidebar.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});

const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      reveal.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll(".reveal").forEach(element => reveal.observe(element));

const links = [...sidebar.querySelectorAll('.nav a[href^="#"]')];
const sections = links.map(link => document.getElementById(link.hash.slice(1)));
const hero = document.getElementById("home");
const heroBackdrop = document.querySelector(".hero-backgrounds");
let ticking = false;

function updateScroll() {
  let current = 0;
  const readingLine = window.innerHeight * 0.42;
  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= readingLine) current = index;
    const progress = Math.max(0, Math.min(1, (readingLine - rect.top) / rect.height));
    links[index].style.setProperty("--p", `${(progress * 100).toFixed(1)}%`);
  });
  links.forEach((link, index) => {
    if (index === current && !(hero && window.scrollY < hero.offsetHeight * 0.65)) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  if (heroBackdrop && !reduce.matches && window.innerWidth > 900) {
    heroBackdrop.style.transform = `translateY(${Math.min(window.scrollY, window.innerHeight) * 0.10}px)`;
  }
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener("resize", updateScroll);
updateScroll();

reduce.addEventListener("change", () => {
  if (reduce.matches && heroBackdrop) heroBackdrop.style.transform = "none";
  updateScroll();
});

if (heroBackdrop) {
  const images = [...heroBackdrop.querySelectorAll("img")];
  let active = 0;
  window.setInterval(() => {
    if (reduce.matches || document.hidden) return;
    active = (active + 1) % images.length;
    images.forEach((image, index) => image.classList.toggle("is-active", index === active));
  }, Number(heroBackdrop.dataset.interval));
}

function filterArchive(archive, category) {
  archive.querySelectorAll("[data-filter]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === category));
  });
  archive.querySelectorAll("[data-project-categories]").forEach(card => {
    card.hidden = category !== "all" && !card.dataset.projectCategories.split(" ").includes(category);
  });
}
document.querySelectorAll("[data-project-archive]").forEach(archive => {
  archive.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => filterArchive(archive, button.dataset.filter));
  });
});
