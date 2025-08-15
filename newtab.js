
const DEFAULTS = {
  name: "",
  dailyMode: true,
  mode: "auto", // "auto" | "online" | "offline"
  quoteTags: ["inspirational","life","wisdom"],
  imageTags: ["nature","landscape","sky"]
};

const OFFLINE_QUOTES = [
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", tags:["inspirational","success"] },
  { content: "Do one thing every day that scares you.", author: "Eleanor Roosevelt", tags:["courage","life"] },
  { content: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", tags:["life","success"] },
  { content: "Happiness depends upon ourselves.", author: "Aristotle", tags:["wisdom","happiness"] },
  { content: "It always seems impossible until it’s done.", author: "Nelson Mandela", tags:["inspirational","courage"] },
  { content: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", tags:["wisdom","success"] },
  { content: "Don’t count the days, make the days count.", author: "Muhammad Ali", tags:["inspirational","life"] },
  { content: "Dream big. Start small. Act now.", author: "Robin Sharma", tags:["success","inspirational"] },
  { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", tags:["wisdom","life"] },
  { content: "Action is the foundational key to all success.", author: "Pablo Picasso", tags:["success"] },
  { content: "Well done is better than well said.", author: "Benjamin Franklin", tags:["wisdom","success"] },
  { content: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", tags:["friendship","life"] },
  { content: "What we think, we become.", author: "Buddha", tags:["wisdom","inspirational"] },
  { content: "Everything you’ve ever wanted is on the other side of fear.", author: "George Addair", tags:["courage","inspirational"] },
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs", tags:["success","life"] },
];

const QUOTE_TAG_OPTIONS = ["inspirational","life","wisdom","success","happiness","courage","friendship","famous-quotes","literature","love"];
const IMAGE_TAG_OPTIONS = ["nature","landscape","mountains","ocean","forest","city","architecture","abstract","minimal","sky"];
const MODE_OPTIONS = ["auto","online","offline"];

const $ = (id) => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0,10);

function setClockAndGreeting(name){
  function tick(){
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,"0");
    const mm = String(now.getMinutes()).padStart(2,"0");
    $("clock").textContent = `${hh}:${mm}`;
    let greet = "Hello";
    const h = now.getHours();
    if (h < 5) greet = "Still up?";
    else if (h < 12) greet = "Good morning";
    else if (h < 17) greet = "Good afternoon";
    else if (h < 22) greet = "Good evening";
    else greet = "Good night";
    $("greeting").textContent = name ? `${greet}, ${name}.` : `${greet}.`;
  }
  tick(); setInterval(tick, 10_000);
}

function buildChips(container, options, selected){
  container.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "chip" + (selected.includes(opt) ? " active" : "");
    btn.textContent = opt; btn.dataset.value = opt;
    btn.addEventListener("click", () => btn.classList.toggle("active"));
    container.appendChild(btn);
  });
}
function selectedFrom(container){ return Array.from(container.querySelectorAll(".chip.active")).map(n=>n.dataset.value); }

function setBackground(imageTags){
  // Try online (Unsplash) then fallback to local gradients (data URI)
  const q = encodeURIComponent(imageTags.join(","));
  const onlineUrl = `https://source.unsplash.com/random/1920x1080/?${q}&_=${Date.now()}`;
  const bg = $("bg");
  const img = new Image();
  img.onload = () => { bg.style.backgroundImage = `url('${onlineUrl}')`; };
  img.onerror = () => { // fallback: procedurally generated gradient
    const gradients = [
      ["#0ea5e9","#7c3aed"],["#22c55e","#0ea5e9"],["#ef4444","#f59e0b"],
      ["#8b5cf6","#ec4899"],["#14b8a6","#6366f1"],["#f97316","#22d3ee"]
    ];
    const [a,b] = gradients[Math.floor(Math.random()*gradients.length)];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
      </linearGradient></defs>
      <rect width='1920' height='1080' fill='url(#g)'/>
      <g opacity='0.2'>
        <circle cx='300' cy='200' r='180' fill='white'/>
        <circle cx='1600' cy='850' r='240' fill='white'/>
        <circle cx='1200' cy='400' r='120' fill='white'/>
      </g></svg>`;
    const uri = `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
    bg.style.backgroundImage = uri;
  };
  img.src = onlineUrl;
}

async function fetchOnlineQuote(tags){
  const tagParam = tags.length ? `?tags=${encodeURIComponent(tags.join("|"))}` : "";
  try{
    const res = await fetch(`https://api.quotable.io/random${tagParam}`, { cache:"no-store" });
    if (!res.ok) throw new Error("bad");
    const data = await res.json();
    if (!data?.content) throw new Error("empty");
    return { content: data.content, author: data.author || "Unknown" };
  }catch{
    return null;
  }
}

function pickOfflineQuote(tags){
  const pool = OFFLINE_QUOTES.filter(q => tags.length ? q.tags?.some(t=>tags.includes(t)) : true);
  const arr = pool.length ? pool : OFFLINE_QUOTES;
  return arr[Math.floor(Math.random()*arr.length)];
}

function renderQuote(q){ $("quote").textContent = `“${q.content}”`; $("author").textContent = `— ${q.author}`; }

function loadSettings(){
  return new Promise(resolve => {
    chrome.storage.sync.get(["name","dailyMode","mode","quoteTags","imageTags"], (r) => {
      resolve({
        name: r.name ?? DEFAULTS.name,
        dailyMode: typeof r.dailyMode==="boolean" ? r.dailyMode : DEFAULTS.dailyMode,
        mode: r.mode ?? DEFAULTS.mode,
        quoteTags: Array.isArray(r.quoteTags)&&r.quoteTags.length ? r.quoteTags : DEFAULTS.quoteTags,
        imageTags: Array.isArray(r.imageTags)&&r.imageTags.length ? r.imageTags : DEFAULTS.imageTags
      });
    });
  });
}
function saveSettings(s){ return new Promise(res=>chrome.storage.sync.set(s,res)); }

function loadDaily(){
  try{ const o = JSON.parse(localStorage.getItem("hybridDaily")||"{}"); return o[todayKey()]||null; }catch{ return null; }
}
function saveDaily(data){
  const k = todayKey(); let o={}; try{o=JSON.parse(localStorage.getItem("hybridDaily")||"{}");}catch{}
  o[k]=data; localStorage.setItem("hybridDaily", JSON.stringify(o));
}

function addFavorite(q){
  try{
    const f = JSON.parse(localStorage.getItem("hybridFavs")||"[]");
    f.unshift({ ...q, ts: Date.now() });
    localStorage.setItem("hybridFavs", JSON.stringify(f.slice(0,200)));
  }catch{}
}
function getFavorites(){ try{return JSON.parse(localStorage.getItem("hybridFavs")||"[]");}catch{return [];} }
function removeFavorite(i){ const f=getFavorites(); f.splice(i,1); localStorage.setItem("hybridFavs", JSON.stringify(f)); }

function openPanel(id){ $(id).classList.remove("hidden"); }
function closePanel(id){ $(id).classList.add("hidden"); }

function renderFavorites(){
  const list = $("favList"); const favs = getFavorites();
  if (!favs.length){ list.innerHTML = `<p class="author">No favorites yet.</p>`; return; }
  list.innerHTML = "";
  favs.forEach((f,i)=>{
    const div = document.createElement("div");
    div.className="fav-item";
    div.innerHTML = `
      <div class="quote">“${f.content}”</div>
      <div class="author">— ${f.author}</div>
      <div class="fav-meta">${new Date(f.ts).toLocaleString()}</div>
      <div class="fav-actions">
        <button class="btn" data-copy>Copy</button>
        <button class="btn ghost" data-del>Remove</button>
      </div>`;
    div.querySelector("[data-copy]").addEventListener("click",()=>navigator.clipboard.writeText(`"${f.content}" — ${f.author}`));
    div.querySelector("[data-del]").addEventListener("click",()=>{ removeFavorite(i); renderFavorites(); });
    list.appendChild(div);
  });
}

(async function init(){
  const s = await loadSettings();
  setClockAndGreeting(s.name);

  // Build settings chips
  buildChips($("modeChips"), MODE_OPTIONS, [s.mode]);
  buildChips($("quoteTags"), QUOTE_TAG_OPTIONS, s.quoteTags);
  buildChips($("imageTags"), IMAGE_TAG_OPTIONS, s.imageTags);

  $("openSettings").addEventListener("click",()=>openPanel("settings"));
  $("closeSettings").addEventListener("click",()=>closePanel("settings"));
  $("saveSettings").addEventListener("click", async ()=>{
    const modeSel = selectedFrom($("modeChips"))[0] || "auto";
    const updated = {
      name: $("nameInput").value.trim(),
      dailyMode: $("dailyToggle").checked,
      mode: modeSel,
      quoteTags: selectedFrom($("quoteTags")),
      imageTags: selectedFrom($("imageTags"))
    };
    await saveSettings(updated); closePanel("settings"); await refresh(updated, true);
  });
  $("resetDefaults").addEventListener("click", async ()=>{
    await saveSettings(DEFAULTS);
    buildChips($("modeChips"), MODE_OPTIONS, [DEFAULTS.mode]);
    buildChips($("quoteTags"), QUOTE_TAG_OPTIONS, DEFAULTS.quoteTags);
    buildChips($("imageTags"), IMAGE_TAG_OPTIONS, DEFAULTS.imageTags);
    $("nameInput").value = DEFAULTS.name; $("dailyToggle").checked = DEFAULTS.dailyMode;
  });

  $("seeFavs").addEventListener("click",()=>{ renderFavorites(); openPanel("favorites"); });
  $("closeFavs").addEventListener("click",()=>closePanel("favorites"));

  $("copy").addEventListener("click",async()=>{
    const t = `${$("quote").textContent} ${$("author").textContent}`;
    await navigator.clipboard.writeText(t);
  });
  $("share").addEventListener("click",async()=>{
    const text = `${$("quote").textContent} ${$("author").textContent}`;
    if (navigator.share){ try{ await navigator.share({text}); }catch{} }
    else { await navigator.clipboard.writeText(text); alert("Copied to clipboard!"); }
  });
  $("fav").addEventListener("click",()=>{
    const content = $("quote").textContent.replace(/[“”]/g,"").trim();
    const author = $("author").textContent.replace(/^—\s*/,"").trim();
    addFavorite({content,author}); $("fav").textContent="♥"; setTimeout(()=>$("fav").textContent="♡",800);
  });
  $("refresh").addEventListener("click",async()=>{
    const cur = await loadSettings();
    await refresh({ ...cur, dailyMode:false }, true); // force new
  });

  $("nameInput").value = s.name; $("dailyToggle").checked = s.dailyMode;

  await refresh(s, false);
})();

async function refresh(s, force){
  const k = todayKey();
  if (s.dailyMode && !force){
    const cached = loadDaily();
    if (cached?.key===k){ renderQuote(cached.quote); setBackground(s.imageTags); return; }
  }

  let quote = null;

  if (s.mode === "offline"){
    const q = pickOfflineQuote(s.quoteTags);
    quote = { content: q.content, author: q.author };
    setBackground(s.imageTags); // still try online bg with gradient fallback
  } else if (s.mode === "online"){
    quote = await fetchOnlineQuote(s.quoteTags) || pickOfflineQuote(s.quoteTags);
    setBackground(s.imageTags);
  } else {
    // auto
    quote = await fetchOnlineQuote(s.quoteTags) || pickOfflineQuote(s.quoteTags);
    setBackground(s.imageTags);
  }

  renderQuote(quote);
  if (s.dailyMode){ saveDaily({ key: k, quote }); }
}
