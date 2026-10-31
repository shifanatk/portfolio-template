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

const chips = (a, cls = "", btn = false) => `<div class="chips ${cls}">${a.map((s) =>
  btn ? `<button class="chip" data-skill="${s}">${s}</button>` : `<span class="chip" data-skill="${s}">${s}</span>`).join("")}</div>`;
const shot = (x) => {
  if (x.image) return `<div class="shot"><img src="${x.image}" alt="${x.title} screenshot" loading="lazy"></div>`;
  let h = 0; for (const c of x.title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const mono = x.title.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return `<div class="shot gen p${h % 3}" style="--r:${h % 360}deg" aria-hidden="true"><span class="mono">${mono}</span><span class="tag">${x.type}</span></div>`;
};
const LABELS = { repo: "Git repo", demo: "Live demo", site: "Published site" };

fetch("profile.json").then((r) => r.json()).then((p) => {
  document.title = `${p.name} | Software Developer`;
  $("logo").textContent = p.name.split(" ").map((w) => w[0]).join("");
  $("status").textContent = p.status;
  $("tagline").textContent = p.tagline;
  $("bio").textContent = p.bio;
  const ini = p.name.split(" ").map((w) => w[0]).join("");
  $("portrait").innerHTML = p.photo ? `<img src="${p.photo}" alt="Portrait of ${p.name}">` : `<span>${ini}</span>`;
  if (p.photo) { $("avatar").src = p.photo; $("avatar").hidden = false; }
  const e = p.education;
  if (e) {
    $("now").innerHTML = `<b>${e.status} ${e.degree}</b> ${e.branch}, ${e.college}`;
    $("edu").innerHTML = `<p class="live"><span class="dot"></span>${e.status}</p>
      <h3>${e.degree}</h3><p>${e.branch}</p><p class="muted">${e.college}</p><p class="muted">${e.period}</p>`;
  }

  /* Landing name: each letter swells as the cursor gets close */
  let n = 0;
  $("name").setAttribute("aria-label", p.name);
  $("name").innerHTML = `<span aria-hidden="true">${p.name.split(" ").map((w) =>
    `<span class="word">${[...w].map((c) => `<span class="ch" style="--i:${n++}">${c}</span>`).join("")}</span>`).join(" ")}</span>`;
  const chars = [...document.querySelectorAll(".ch")], hero = $("top");
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

  $("skillGrid").innerHTML = p.skills.map((g) => `<div class="card"><h3>${g.group}</h3>${chips(g.items, "", true)}</div>`).join("");

  $("projectList").innerHTML = p.projects.map((x) => {
    const links = Object.entries(x.links || {}).filter(([, v]) => v)
      .map(([k, v]) => `<a class="btn" href="${v}" target="_blank" rel="noopener">${LABELS[k] || k}</a>`).join("");
    const tags = [...(x.tech || []), ...(x.learned || [])].map((t) => t.toLowerCase()).join("|");
    return `<article class="card proj" data-tags="${tags}">
      ${shot(x)}
      <div class="proj-side"><span class="type">${x.type}</span><h3>${x.title}</h3>
        <div class="proj-links">${links || '<span class="muted">Links coming soon</span>'}</div></div>
      <div class="proj-main"><p>${x.summary}</p>
        <h4>Skills gained</h4>${chips(x.learned || [], "gain")}
        ${x.tech && x.tech.length ? `<h4>Built with</h4>${chips(x.tech)}` : ""}</div></article>`;
  }).join("");

  if (p.experience && p.experience.length) {
    $("expList").innerHTML = p.experience.map((x) => `<article><span class="muted">${x.period}</span>
      <h3>${x.role}</h3><p class="org">${x.org}</p><p>${x.detail}</p></article>`).join("");
  } else { $("experience").hidden = true; $("navExp").hidden = true; }

  /* Email is never shown: visitors get a "Copy email" button instead */
  const mail = p.emailB64 ? atob(p.emailB64) : p.email;
  const hasMail = mail && !mail.startsWith("yourname");
  const html = (p.resume ? `<a class="btn solid" href="${p.resume}" download>Download résumé</a>` : "") + p.links.map((l) => `<a class="btn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("")
    + (hasMail ? `<button class="btn copy" type="button">Copy email</button>` : "");
  $("links").innerHTML = html; $("heroLinks").innerHTML = html;
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(mail); }
    catch { const t = document.createElement("textarea"); t.value = mail; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); }
    b.textContent = "Email copied"; setTimeout(() => (b.textContent = "Copy email"), 1800);
  }));

  document.querySelectorAll(".card").forEach((c) => c.addEventListener("pointermove", (ev) => {
    const b = c.getBoundingClientRect();
    c.style.setProperty("--mx", ev.clientX - b.left + "px");
    c.style.setProperty("--my", ev.clientY - b.top + "px");
    if (c.classList.contains("proj") && !still)
      c.style.transform = `perspective(1000px) rotateY(${((ev.clientX - b.left) / b.width - .5) * 4}deg) rotateX(${-((ev.clientY - b.top) / b.height - .5) * 4}deg)`;
  }));
  document.querySelectorAll(".proj").forEach((c) => c.addEventListener("pointerleave", () => (c.style.transform = "")));

  /* Skills lead to projects: pick a skill, jump to the projects that used it */
  const track = $("projectList"), cards = [...track.children];
  let active = null;
  const offset = (c) => c.offsetLeft - cards[0].offsetLeft;
  document.querySelectorAll("button.chip").forEach((b) => b.addEventListener("click", () => {
    active = active === b.dataset.skill ? null : b.dataset.skill;
    const key = active && active.toLowerCase();
    const hits = cards.filter((c) => !key || c.dataset.tags.split("|").includes(key));
    cards.forEach((c) => { c.classList.toggle("dim", !hits.includes(c)); c.classList.toggle("hit", !!key && hits.includes(c)); });
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", !!key && c.dataset.skill.toLowerCase() === key));
    $("filterNote").textContent = !key ? "" : hits.length ? `${hits.length} project${hits.length > 1 ? "s" : ""} built with ${active}. Select it again to clear.`
      : `No project uses ${active} yet.`;
    if (key) { $("projects").scrollIntoView({ behavior: "smooth" }); if (hits[0]) track.scrollTo({ left: offset(hits[0]), behavior: "smooth" }); }
  }));

  /* Project gallery controls */
  const step = () => (cards[1] ? offset(cards[1]) : track.clientWidth * 0.8);
  const upd = () => { $("count").textContent = `${Math.min(Math.round(track.scrollLeft / step()) + 1, cards.length)}/${cards.length}`; };
  $("prev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  $("next").addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", upd, { passive: true }); upd();

  /* Side dots show which scene you are in */
  const scenes = [...document.querySelectorAll(".scene")].filter((s) => !s.hidden);
  $("dots").innerHTML = scenes.map((s) => `<button aria-label="${s.dataset.label}" title="${s.dataset.label}" data-t="${s.id}"></button>`).join("");
  const dots = [...$("dots").children];
  dots.forEach((d) => d.addEventListener("click", () => $(d.dataset.t).scrollIntoView({ behavior: "smooth" })));
  const io = new IntersectionObserver((en) => en.forEach((x) => {
    if (x.isIntersecting) dots.forEach((d) => d.classList.toggle("on", d.dataset.t === x.target.id));
  }), { rootMargin: "-45% 0px -45% 0px" });
  scenes.forEach((s) => io.observe(s));
}).catch(() => { $("name").textContent = "Could not load profile.json"; });

/* Scroll progress bar */
addEventListener("scroll", () => {
  const m = root.scrollHeight - innerHeight;
  $("progress").style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
}, { passive: true });