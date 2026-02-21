const DOC_BASE = "https://foodlay-complete-solution-doc.vercel.app";
const CORS_PROXY = (url)=>"https://r.jina.ai/http://"+url.replace(/^https?:\/\//,"");
const state = {
  links: {
    admin: DOC_BASE,
    store: DOC_BASE,
    customerApk: DOC_BASE,
    deliveryApk: DOC_BASE
  },
  docsText: ""
};

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(()=>{ t.style.display = "none"; }, 2500);
}

async function fetchText(url){
  try{
    const res = await fetch(url,{mode:"cors"});
    if(!res.ok) throw new Error("status "+res.status);
    const ct = res.headers.get("content-type")||"";
    if(ct.includes("text")||ct.includes("xml")||ct.includes("html")) return await res.text();
    throw new Error("unsupported content-type");
  }catch(e){
    try{
      const res2 = await fetch(CORS_PROXY(url));
      if(!res2.ok) throw new Error("proxy status "+res2.status);
      return await res2.text();
    }catch(err){
      return "";
    }
  }
}

function pickLink(urls, keys){
  const lower = urls.map(u=>({u, l: u.toLowerCase()}));
  for(const k of keys){
    const m = lower.find(x=>x.l.includes(k));
    if(m) return m.u;
  }
  return DOC_BASE;
}

function sanitizeText(t){
  return t.replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}

async function loadSitemap(){
  const xml = await fetchText(DOC_BASE+"/sitemap.xml");
  if(!xml){ return []; }
  const urls=[];
  const re=/<loc>([^<]+)<\/loc>/g;
  let m;
  while((m = re.exec(xml))){ urls.push(m[1]); }
  return urls;
}

function renderAbout(items){
  const ul = document.getElementById("about-list");
  if(!ul) return;
  ul.innerHTML = "";
  items.slice(0,6).forEach(txt=>{
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    const span = document.createElement("span");
    span.textContent = txt;
    li.appendChild(dot);
    li.appendChild(span);
    ul.appendChild(li);
  });
}

async function loadAbout(){
  const ul = document.getElementById("about-list");
  if(!ul) return;
  if(ul && ul.querySelectorAll("li").length > 1 && !/Loading/i.test(ul.textContent)) return;
  const txt = await fetchText(DOC_BASE);
  if(!txt){
    renderAbout(["Admin Panel","Web Storefront","Customer App","Deliveryman App","Real-time tracking","Scalable architecture"]);
    return;
  }
  if(/^\s*</.test(txt)){
    try{
      const parser = new DOMParser();
      const doc = parser.parseFromString(txt,"text/html");
      const hs = Array.from(doc.querySelectorAll("h1,h2,h3")).map(h=>h.textContent.trim()).filter(Boolean);
      const unique = [];
      for(const h of hs){
        if(!unique.includes(h)) unique.push(h);
      }
      if(unique.length){
        renderAbout(unique.slice(0,8));
        return;
      }
    }catch(e){}
  }
  const lines = sanitizeText(txt).split("\n");
  const picks = [];
  for(const l of lines){
    const t = l.trim();
    if(!t) continue;
    if(/[•\-\*]\s+/.test(t) || /^[A-Z][^\.\!]{4,}$/.test(t)){
      picks.push(t.replace(/^[•\-\*]\s+/,""));
    }
    if(picks.length>=8) break;
  }
  if(picks.length){
    renderAbout(picks);
  }else{
    renderAbout(["Admin Panel","Web Storefront","Customer App","Deliveryman App","Real-time tracking","Scalable architecture"]);
  }
}

function renderFeatures(items){
  const ul = document.getElementById("feature-list");
  if(!ul) return;
  ul.innerHTML = "";
  items.slice(0,6).forEach(txt=>{
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    const span = document.createElement("span");
    span.textContent = txt;
    li.appendChild(dot);
    li.appendChild(span);
    ul.appendChild(li);
  });
}

async function loadFeatures(){
  const ul = document.getElementById("feature-list");
  if(!ul) return;
  if(ul && ul.querySelectorAll("li").length > 1 && !/Loading/i.test(ul.textContent)) return;
  const txt = await fetchText(DOC_BASE);
  if(!txt){
    renderFeatures(["Multi-restaurant support","Zone-based delivery","Cart and checkout","Payment integrations","Order tracking","Analytics"]);
    return;
  }
  const plain = /^\s*</.test(txt)
    ? txt.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g,"\n")
    : txt;
  const lines = sanitizeText(plain).split("\n");
  const feats = [];
  for(const l of lines){
    const t = l.trim();
    if(!t) continue;
    if(/[•\-\*]\s+/.test(t) || /feature/i.test(t)){
      feats.push(t.replace(/^[•\-\*]\s+/,""));
    }
    if(feats.length>=8) break;
  }
  if(feats.length){
    renderFeatures(feats);
  }else{
    renderFeatures(["Multi-restaurant support","Zone-based delivery","Cart and checkout","Payment integrations","Order tracking","Analytics"]);
  }
}

function renderBadges(id, items){
  const c = document.getElementById(id);
  if(!c) return;
  c.innerHTML = "";
  items.slice(0,10).forEach(txt=>{
    const span = document.createElement("span");
    span.className = "badge";
    span.textContent = txt;
    c.appendChild(span);
  });
}

async function loadStack(){
  if(!document.getElementById("stack-badges")) return;
  const txt = await fetchText(DOC_BASE);
  const base = ["React","Next.js","Laravel","Node.js","Flutter","Android","iOS","Stripe","Firebase"];
  if(!txt){
    renderBadges("stack-badges", base);
    return;
  }
  const corpus = txt.toLowerCase();
  const map = ["react","next","laravel","node","flutter","android","ios","stripe","firebase","postgres","mysql","redis"];
  const found = [];
  for(const k of map){
    if(corpus.includes(k)){ found.push(k.charAt(0).toUpperCase()+k.slice(1)); }
  }
  renderBadges("stack-badges", found.length ? found : base);
}
async function bootstrap(){
  const urls = await loadSitemap();
  if(urls.length){
    state.links.admin = pickLink(urls, ["admin","dashboard"]);
    state.links.store = pickLink(urls, ["storefront","store","web"]);
    state.links.customerApk = pickLink(urls, ["customer","apk","android"]);
    state.links.deliveryApk = pickLink(urls, ["delivery","courier","apk"]);
  }

  document.getElementById("admin-open").href = state.links.admin;
  document.getElementById("admin-docs").href = state.links.admin;
  document.getElementById("store-open").href = state.links.store;
  document.getElementById("store-docs").href = state.links.store;
  document.getElementById("customer-open").href = state.links.customerApk;
  document.getElementById("customer-docs").href = state.links.customerApk;
  document.getElementById("delivery-open").href = state.links.deliveryApk;
  document.getElementById("delivery-docs").href = state.links.deliveryApk;

  loadAbout().then(()=>{}).catch(()=>{});
  loadFeatures().then(()=>{}).catch(()=>{});
  loadStack().then(()=>{}).catch(()=>{});
}

bootstrap().then(()=>{}).catch(()=>{});
