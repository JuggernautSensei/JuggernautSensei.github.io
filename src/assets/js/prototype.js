document.documentElement.classList.add("js");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
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
const accents = ["#79d6c3", "#79a7ff", "#b39afa"];
let accentIndex = 0;
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
  const onHero = hero && window.scrollY < hero.offsetHeight * 0.65;
  const activeAccent = onHero ? accents[accentIndex] : sections[current]?.dataset.accent;
  if (activeAccent) root.style.setProperty("--pop", activeAccent);
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

function makeRoll(id, words) {
  const element = document.getElementById(id);
  if (!element) return null;
  const track = element.querySelector(".roll__track");
  let index = 0;
  function fitWord(item) {
    const range = document.createRange();
    range.selectNodeContents(item);
    const fontSize = parseFloat(getComputedStyle(element).fontSize);
    element.style.width = `${range.getBoundingClientRect().width / fontSize}em`;
  }
  function paint() {
    track.children[0].textContent = words[index];
    track.children[1].textContent = words[(index + 1) % words.length];
    fitWord(track.children[0]);
  }
  paint();
  document.fonts.ready.then(() => fitWord(track.children[0]));
  return () => {
    fitWord(track.children[1]);
    track.style.transition = "transform .42s cubic-bezier(.16,.86,.26,1)";
    track.style.transform = "translateY(-50%)";
    window.setTimeout(() => {
      index = (index + 1) % words.length;
      track.style.transition = "none";
      track.style.transform = "translateY(0)";
      paint();
    }, 460);
  };
}
const wordRoll = makeRoll("wordroll", ["구현하며", "검증하며", "디버깅하며", "소통하며 함께"]);
window.setInterval(() => {
  if (reduce.matches || document.hidden || sidebar.matches(":hover, :focus-within")) return;
  wordRoll?.();
  accentIndex = (accentIndex + 1) % accents.length;
  updateScroll();
}, 3800);
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
