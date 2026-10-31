const $ = (id) => document.getElementById(id);
const root = document.documentElement;

/* ---------- Theme: saved choice, else system preference ---------- */
const saved = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
const setTheme = (t) => {
  root.dataset.theme = t;
  $("theme").textContent = t === "dark" ? "☀" : "☾";
  try { localStorage.setItem("theme", t); } catch {}
};
setTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
$("theme").addEventListener("click", () => { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); drawGraph(); });

/* ---------- Profile loader ---------- */
const chips = (a) => `<div class="chips">${a.map((s) => `<span class="chip">${s}</span>`).join("")}</div>`;

fetch("profile.json").then((r) => r.json()).then((p) => {
  document.title = `${p.name} | Software Developer`;
  $("logo").textContent = p.name.split(" ").map((w) => w[0]).join("");
  $("name").textContent = p.name;
  $("tagline").textContent = p.tagline;
  $("bio").textContent = p.bio;
  $("status").textContent = p.status;
  $("links").innerHTML = p.links.map((l) => `<a class="btn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");

  const skills = `<article class="card span-12"><h2>Skills</h2><div class="skill-groups">${
    p.skills.map((g) => `<div><h3>${g.group}</h3>${chips(g.items)}</div>`).join("")}</div></article>`;
  const projects = p.projects.map((x) => `
    <article class="card proj ${x.featured ? "span-8" : "span-4"}">
      <span class="type">${x.type || ""}</span><h3>${x.title}</h3><p>${x.description}</p>${chips(x.tech || [])}
      ${x.url ? `<a href="${x.url}" target="_blank" rel="noopener">${x.linkLabel || "View project"}</a>` : ""}
    </article>`).join("");
  $("bento").innerHTML = skills + projects;

  document.querySelectorAll(".card").forEach((c) =>
    c.addEventListener("pointermove", (e) => {
      const b = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - b.left + "px");
      c.style.setProperty("--my", e.clientY - b.top + "px");
    }));
}).catch(() => { $("name").textContent = "Could not load profile.json"; });

/* ---------- Hero: Dijkstra routing graph (the idea behind the C project) ---------- */
const cv = $("net"), ctx = cv.getContext("2d");
const P = [[.07,.5],[.24,.2],[.27,.8],[.48,.46],[.52,.12],[.55,.9],[.76,.28],[.78,.72],[.94,.5]];
const L = ["you","B","C","D","E","F","G","H","team"];
const E = [[0,1],[0,2],[1,3],[2,3],[1,4],[3,4],[3,5],[2,5],[4,6],[3,6],[3,7],[5,7],[6,8],[7,8],[6,7]]
  .map(([a,b]) => ({ a, b, w: Math.round(Math.hypot(P[a][0]-P[b][0], P[a][1]-P[b][1]) * 40) }));
let target = 8, path = [], cost = 0, t = 0;

function dijkstra(goal) {
  const d = P.map(() => Infinity), prev = P.map(() => -1), done = new Set();
  d[0] = 0;
  while (done.size < P.length) {
    let u = -1;
    d.forEach((v, i) => { if (!done.has(i) && (u < 0 || v < d[u])) u = i; });
    done.add(u);
    E.forEach(({ a, b, w }) => {
      const [x, y] = u === a ? [a, b] : u === b ? [b, a] : [];
      if (y !== undefined && d[x] + w < d[y]) { d[y] = d[x] + w; prev[y] = x; }
    });
  }
  const out = []; for (let n = goal; n >= 0; n = prev[n]) out.unshift(n);
  return { out, cost: d[goal] };
}

function setTarget(n) {
  target = n; ({ out: path, cost } = dijkstra(n));
  $("route").textContent = `Shortest path: ${path.map((i) => L[i]).join(" › ")} · total cost ${cost}`;
}

function drawGraph() {
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const css = getComputedStyle(root), accent = css.getPropertyValue("--accent"), warm = css.getPropertyValue("--warm"),
        line = css.getPropertyValue("--line"), ink = css.getPropertyValue("--ink"), muted = css.getPropertyValue("--muted");
  const pos = (i) => [P[i][0] * w, P[i][1] * h];
  const onPath = (e) => path.some((n, i) => i && ((path[i-1] === e.a && n === e.b) || (path[i-1] === e.b && n === e.a)));
  ctx.font = "12px Instrument Sans, sans-serif"; ctx.textAlign = "center";
  E.forEach((e) => {
    const [x1, y1] = pos(e.a), [x2, y2] = pos(e.b), hot = onPath(e);
    ctx.strokeStyle = hot ? accent : line; ctx.lineWidth = hot ? 3 : 1.2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = hot ? ink : muted; ctx.fillText(e.w, (x1 + x2) / 2, (y1 + y2) / 2 - 6);
  });
  P.forEach((_, i) => {
    const [x, y] = pos(i), end = i === 0 || i === target;
    ctx.beginPath(); ctx.arc(x, y, end ? 9 : 6, 0, 7);
    ctx.fillStyle = end ? warm : path.includes(i) ? accent : line; ctx.fill();
    ctx.fillStyle = ink; ctx.fillText(L[i], x, y + 24);
  });
  if (path.length > 1) {                       // packet travelling along the route
    const seg = Math.min(Math.floor(t * (path.length - 1)), path.length - 2), f = t * (path.length - 1) - seg;
    const [ax, ay] = pos(path[seg]), [bx, by] = pos(path[seg + 1]);
    ctx.beginPath(); ctx.arc(ax + (bx - ax) * f, ay + (by - ay) * f, 5, 0, 7); ctx.fillStyle = ink; ctx.fill();
  }
}

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
(function loop() { t = still ? 1 : (t + 0.004) % 1; drawGraph(); if (!still) requestAnimationFrame(loop); })();

const pick = (e) => {
  const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
  const n = P.findIndex(([px, py], i) => i && Math.hypot(px * b.width - x, py * b.height - y) < 26);
  if (n > 0 && n !== target) { setTarget(n); if (still) drawGraph(); }
};
cv.addEventListener("pointermove", pick);
cv.addEventListener("pointerdown", pick);
addEventListener("resize", drawGraph);
setTarget(8);