const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Theme: saved choice, else system preference */
const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
const setTheme = (t) => {
  root.dataset.theme = t;
  $("theme").textContent = t === "dark" ? "☀" : "☾";
  try { localStorage.setItem("theme", t); } catch {}
};
setTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
$("theme").addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

const chips = (a, cls = "") => `<div class="chips ${cls}">${a.map((s) => `<span class="chip">${s}</span>`).join("")}</div>`;
const LABELS = { repo: "Git repo", demo: "Live demo", site: "Published site" };

fetch("profile.json").then((r) => r.json()).then((p) => {
  document.title = `${p.name} | Software Developer`;
  $("logo").textContent = p.name.split(" ").map((w) => w[0]).join("");
  $("status").textContent = p.status;
  $("tagline").textContent = p.tagline;
  $("bio").textContent = p.bio;
  const e = p.education;
  if (e) {
    $("now").textContent = `${e.status} ${e.degree}, ${e.college}`;
    $("edu").innerHTML = `<p class="live"><span class="dot"></span>${e.status}</p>
      <h3>${e.degree}</h3><p>${e.branch}</p><p class="muted">${e.college}</p><p class="muted">${e.period}</p>`;
  }

  /* Hero name: every letter reacts to the cursor by changing font weight */
  let n = 0;
  $("name").setAttribute("aria-label", p.name);
  $("name").innerHTML = `<span aria-hidden="true">${p.name.split(" ").map((w) =>
    `<span class="word">${[...w].map((c) => `<span class="ch" style="--i:${n++}">${c}</span>`).join("")}</span>`).join(" ")}</span>`;
  const chars = [...document.querySelectorAll(".ch")], hero = $("hero");
  hero.addEventListener("pointermove", (ev) => {
    const hb = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", ev.clientX - hb.left + "px");
    hero.style.setProperty("--my", ev.clientY - hb.top + "px");
    if (still) return;
    chars.forEach((c) => {
      const b = c.getBoundingClientRect();
      const d = Math.hypot(ev.clientX - (b.left + b.width / 2), ev.clientY - (b.top + b.height / 2));
      c.style.fontVariationSettings = `"wght" ${Math.round(800 - Math.min(d, 320) / 320 * 620)}`;
    });
  });
  hero.addEventListener("pointerleave", () => chars.forEach((c) => (c.style.fontVariationSettings = "")));

  $("skillGrid").innerHTML = p.skills.map((g) => `<div class="card"><h3>${g.group}</h3>${chips(g.items)}</div>`).join("");

  $("projectList").innerHTML = p.projects.map((x, i) => {
    const links = Object.entries(x.links || {}).filter(([, v]) => v)
      .map(([k, v]) => `<a class="btn" href="${v}" target="_blank" rel="noopener">${LABELS[k] || k}</a>`).join("");
    return `<article class="card proj" style="--i:${i}">
      <div class="proj-side"><span class="type">${x.type}</span><h3>${x.title}</h3>
        <div class="proj-links">${links || '<span class="muted">Links coming soon</span>'}</div></div>
      <div class="proj-main"><p>${x.summary}</p>
        <h4>Skills gained</h4>${chips(x.learned || [], "gain")}
        <h4>Built with</h4>${chips(x.tech || [])}</div></article>`;
  }).join("");

  if (p.experience && p.experience.length) {
    $("expList").innerHTML = p.experience.map((x) => `<article><span class="muted">${x.period}</span>
      <h3>${x.role}</h3><p class="org">${x.org}</p><p>${x.detail}</p></article>`).join("");
  } else { $("experience").hidden = true; $("navExp").hidden = true; }

  $("links").innerHTML = p.links.map((l) => `<a class="btn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");

  document.querySelectorAll(".card").forEach((c) => c.addEventListener("pointermove", (ev) => {
    const b = c.getBoundingClientRect();
    c.style.setProperty("--mx", ev.clientX - b.left + "px");
    c.style.setProperty("--my", ev.clientY - b.top + "px");
  }));
}).catch(() => { $("name").textContent = "Could not load profile.json"; });