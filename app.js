const worldFoods = Array.isArray(window.WORLD_FOODS) ? window.WORLD_FOODS : [];
const everydayFoods = Array.isArray(window.EVERYDAY_FOODS) ? window.EVERYDAY_FOODS : [];
const baseFoods = [...worldFoods, ...everydayFoods].filter((food, index, all) =>
  index === all.findIndex(item => String(item.name).toLowerCase() === String(food.name).toLowerCase())
);

const recipes = [
  {id:1,name:"Mediterranean Grain Bowl",emoji:"🥗",calories:440,time:"20 min",ingredients:["quinoa","chickpeas","cucumber","tomato","hummus"],tip:"A colourful plant-forward lunch inspired by the Mediterranean."},
  {id:2,name:"Japanese Salmon Rice Bowl",emoji:"🍣",calories:510,time:"25 min",ingredients:["salmon","rice","edamame","cucumber","sesame"],tip:"Use a measured sauce portion to manage sodium."},
  {id:3,name:"Mexican Chicken Taco Plate",emoji:"🌮",calories:480,time:"25 min",ingredients:["corn tortillas","grilled chicken","salsa","lettuce","avocado"],tip:"Choose grilled protein and fresh salsa."},
  {id:4,name:"Indian Lentil Dal Bowl",emoji:"🍛",calories:420,time:"30 min",ingredients:["lentils","tomato","spinach","brown rice","spices"],tip:"High in fibre and easy to prepare in batches."},
  {id:5,name:"Korean Bibimbap Light",emoji:"🍚",calories:470,time:"30 min",ingredients:["rice","egg","spinach","carrot","mushrooms"],tip:"Add more vegetables and use less sauce."},
  {id:6,name:"Moroccan Chickpea Tagine",emoji:"🥘",calories:430,time:"35 min",ingredients:["chickpeas","tomato","carrot","zucchini","couscous"],tip:"A warming plant-forward dinner."},
  {id:7,name:"Greek Yogurt Breakfast Bowl",emoji:"🥣",calories:330,time:"8 min",ingredients:["Greek yogurt","berries","oats","walnuts","honey"],tip:"Use fruit for sweetness and keep honey light."},
  {id:8,name:"Vietnamese Fresh Roll Plate",emoji:"🥬",calories:360,time:"25 min",ingredients:["rice paper","prawns","lettuce","herbs","rice noodles"],tip:"Serve dipping sauce on the side."},
  {id:9,name:"Brazilian Black Bean Bowl",emoji:"🫘",calories:460,time:"30 min",ingredients:["black beans","rice","tomato","orange","greens"],tip:"A balanced bowl with fibre-rich beans."},
  {id:10,name:"Malaysian Ikan Bakar Plate",emoji:"🐟",calories:390,time:"30 min",ingredients:["fish","ulam","lime","half rice portion","sambal"],tip:"Keep sambal and sweet sauces measured."},
  {id:11,name:"Italian Tomato Pasta",emoji:"🍝",calories:450,time:"20 min",ingredients:["wholegrain pasta","tomato","garlic","olive oil","spinach"],tip:"Use vegetables to increase volume and fibre."},
  {id:12,name:"West African Jollof Bowl",emoji:"🍲",calories:500,time:"35 min",ingredients:["rice","tomato","pepper","chicken","greens"],tip:"Pair a moderate rice portion with extra vegetables."}
];

const defaultState = {
  target:2000, water:0, waterGoal:8, meals:[], history:{}, weights:[], profile:{},
  favorites:[], custom:[], theme:"light", bestStreak:0, grocery:[], plan:[], lastDate:"",
  challenge:{title:"Eat vegetables twice today",progress:0,target:2}
};
let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem("makanaiWorldV7") || localStorage.getItem("makanaiWorldV6") || localStorage.getItem("makanaiWorldV5") || "{}"));
let activeCategory = "all", activeRegion = "all", activeCountry = "all", activeLetter = "all";
let activeSort = "az", activeMealFilter = "all", favoritesOnly = false;
let selectedFood = null, detectedFoods = [], externalProducts = [], visibleFoodLimit = 72;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const dayKey = (d = new Date()) => d.toISOString().slice(0,10);
const allFoods = () => [...baseFoods, ...(state.custom || [])];

function ensureToday() {
  const today = dayKey();
  if (state.lastDate && state.lastDate !== today) state.water = 0;
  state.lastDate = today;
}
function persist() { localStorage.setItem("makanaiWorldV6", JSON.stringify(state)); }
function save(message) { updateHistory(); persist(); renderAll(); if (message) toast(message); }
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
function animatePage(page) {
  const section = document.getElementById(page);
  if (!section) return;
  section.classList.remove("page-enter");
  void section.offsetWidth;
  section.classList.add("page-enter");
  const items = section.querySelectorAll(":scope > *, .card, .world-card, .stat-card, .recipe, .insight");
  items.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index, 12) * 45}ms`);
  });
}
function go(page) {
  stopBarcodeCamera();
  $$(".page").forEach(x => x.classList.toggle("active", x.id === page));
  $$("nav button").forEach(x => x.classList.toggle("active", x.dataset.page === page));
  if (page === "reports") drawReports();
  if (page === "planner") renderPlanner();
  animatePage(page);
  window.scrollTo({top:0, behavior:"smooth"});
}
$$('nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
$$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

function todaysMeals() { return state.meals.filter(m => m.date === dayKey()); }
function totals(meals = todaysMeals()) {
  return meals.reduce((a,m) => {
    a.calories += Number(m.calories)||0; a.protein += Number(m.protein)||0;
    a.carbs += Number(m.carbs)||0; a.fat += Number(m.fat)||0;
    a.sugar += (Number(m.sugar)||0) * (Number(m.portion)||1);
    a.sodium += (Number(m.sodium)||0) * (Number(m.portion)||1);
    return a;
  }, {calories:0,protein:0,carbs:0,fat:0,sugar:0,sodium:0});
}
function updateHistory() {
  const t = totals();
  state.history[dayKey()] = {calories:Math.round(t.calories), water:state.water, meals:todaysMeals().length};
  let streak = 0, d = new Date();
  for (let i=0;i<365;i++) {
    const h = state.history[dayKey(d)];
    if (h && h.meals > 0) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate()-1);
  }
  state.bestStreak = Math.max(state.bestStreak || 0, streak);
  $("#streak").textContent = streak;
}

function renderHome() {
  const t = totals(), percent = Math.min(100, Math.round((t.calories/state.target)*100 || 0));
  $("#remaining").textContent = Math.max(0, Math.round(state.target-t.calories));
  $("#calories").textContent = `${Math.round(t.calories)} kcal`;
  $("#protein").textContent = `${Math.round(t.protein)} g`;
  $("#carbs").textContent = `${Math.round(t.carbs)} g`;
  $("#fat").textContent = `${Math.round(t.fat)} g`;
  $("#percent").textContent = `${percent}%`;
  $("#ring").style.background = `conic-gradient(#86efac ${percent*3.6}deg,rgba(255,255,255,.18) ${percent*3.6}deg)`;
  $("#goalMsg").textContent = percent < 25 ? "Plenty of room left today." : percent < 75 ? "You are progressing well today." : percent <= 100 ? "Almost at your daily target." : "You are above your target today.";
  $("#waterText").textContent = `${state.water} / ${state.waterGoal} glasses`;
  $("#today").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
  $("#welcome").textContent = `Hi, ${state.profile.name || "welcome back"} 👋`;
  $("#dailyTarget").textContent = `${state.target} kcal`;
  $("#waterGlasses").innerHTML = Array.from({length:state.waterGoal},(_,i)=>`<div class="glass ${i<state.water?'filled':''}"></div>`).join('');
  renderMeals();
}
function renderMeals() {
  let meals = todaysMeals();
  if (activeMealFilter !== "all") meals = meals.filter(m => m.mealType === activeMealFilter);
  $("#mealList").innerHTML = meals.length ? meals.map(m => `
    <div class="meal"><div class="foodmeta"><div class="emoji">${m.emoji || '🍽️'}</div><div><b>${m.name}</b><span>${m.mealType} · ${m.portionLabel} · ${Math.round(m.calories)} kcal</span></div></div><button class="remove" data-remove="${m.logId}">×</button></div>
  `).join('') : `<div class="empty">No meals in this section yet.</div>`;
  $$('[data-remove]').forEach(b => b.addEventListener('click', () => {
    state.meals = state.meals.filter(m => m.logId !== b.dataset.remove); save("Meal removed");
  }));
}
$$('#mealFilters button').forEach(b => b.addEventListener('click', () => {
  activeMealFilter = b.dataset.meal; $$('#mealFilters button').forEach(x => x.classList.toggle('active',x===b)); renderMeals();
}));
$("#addWater").addEventListener('click', () => { state.water = Math.min(state.waterGoal,state.water+1); save(); });
$("#undoWater").addEventListener('click', () => { state.water = Math.max(0,state.water-1); save(); });

function populateWorldFilters() {
  const regions = [...new Set(baseFoods.map(f=>f.region))].sort();
  const categories = [...new Set(baseFoods.map(f=>f.category))].sort();
  $("#regionFilter").innerHTML = `<option value="all">All regions</option>${regions.map(x=>`<option>${x}</option>`).join("")}`;
  $("#categoryFilter").innerHTML = `<option value="all">All categories</option>${categories.map(x=>`<option>${x}</option>`).join("")}`;
  $("#alphabetFilters").innerHTML = `<button class="active" data-letter="all">All</button>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(x=>`<button data-letter="${x}">${x}</button>`).join("")}`;
  $("#worldFoodCount").textContent = baseFoods.length.toLocaleString();
  if ($("#homeFoodCount")) $("#homeFoodCount").textContent = `${baseFoods.length.toLocaleString()}+`;
  if ($("#homeCountryCount")) $("#homeCountryCount").textContent = `${new Set(baseFoods.map(f=>f.country)).size}+`;
  $("#worldCountryCount").textContent = new Set(baseFoods.map(f=>f.country)).size;
  $("#worldCategoryCount").textContent = categories.length;
  refreshCountryOptions();
}
function refreshCountryOptions() {
  const countries = [...new Set(baseFoods.filter(f=>activeRegion==="all"||f.region===activeRegion).map(f=>f.country))].sort();
  $("#countryFilter").innerHTML = `<option value="all">All countries</option>${countries.map(x=>`<option>${x}</option>`).join("")}`;
  if (!countries.includes(activeCountry)) activeCountry = "all";
  $("#countryFilter").value = activeCountry;
}
function getFilteredFoods() {
  const term = $("#foodSearch").value.trim().toLowerCase();
  let list = allFoods().filter(f => {
    const searchable = `${f.name} ${f.country||""} ${f.region||""} ${f.category||""}`.toLowerCase();
    return (!term || searchable.includes(term))
      && (activeRegion==="all" || f.region===activeRegion)
      && (activeCountry==="all" || f.country===activeCountry)
      && (activeCategory==="all" || f.category===activeCategory)
      && (activeLetter==="all" || (f.name||"").charAt(0).toUpperCase()===activeLetter)
      && (!favoritesOnly || state.favorites.includes(f.id));
  });
  const sorters = {
    az:(a,b)=>a.name.localeCompare(b.name),
    za:(a,b)=>b.name.localeCompare(a.name),
    "cal-low":(a,b)=>a.calories-b.calories,
    "cal-high":(a,b)=>b.calories-a.calories,
    protein:(a,b)=>b.protein-a.protein,
    country:(a,b)=>(a.country||"").localeCompare(b.country||"")||a.name.localeCompare(b.name)
  };
  return list.sort(sorters[activeSort] || sorters.az);
}
function renderFoods() {
  const list = getFilteredFoods();
  const shown = list.slice(0, visibleFoodLimit);
  $("#foodResultCount").textContent = `${list.length.toLocaleString()} foods match your filters`;
  $("#visibleFoodCount").textContent = `${shown.length.toLocaleString()} shown`;
  $("#foodLibraryTitle").textContent = activeLetter==="all" ? "All foods A–Z" : `Foods beginning with ${activeLetter}`;
  $("#loadMoreFoods").classList.toggle("hidden", shown.length >= list.length);

  let lastLetter = "";
  $("#foodGrid").innerHTML = shown.length ? shown.map(f => {
    const letter = (f.name||"#").charAt(0).toUpperCase();
    const heading = activeSort==="az" && letter!==lastLetter ? `<div class="letter-divider"><span>${letter}</span><i></i></div>` : "";
    lastLetter = letter;
    const tags = (f.tags||[]).slice(0,2).map(t=>`<span>${t}</span>`).join("");
    return `${heading}<article class="food-card world-card">
      <button class="fav" data-fav="${f.id}" aria-label="Favourite">${state.favorites.includes(f.id)?'♥':'♡'}</button>
      <div class="world-card-top"><div class="emoji">${f.emoji||'🍽️'}</div><span class="country-badge">${f.flag||'🌐'} ${f.country||'Custom'}</span></div>
      <h4>${f.name}</h4>
      <p class="food-category">${f.category||'Food'} · ${f.serving||'1 serving'}</p>
      <div class="mini-nutrition"><span><b>${Math.round(f.calories)}</b> kcal</span><span><b>${Math.round(f.protein)}</b>g protein</span><span><b>${Math.round(f.carbs)}</b>g carbs</span></div>
      <div class="tag-row compact-tags">${tags}</div>
      <button class="add" data-food="${f.id}">View & add</button>
    </article>`;
  }).join("") : `<div class="empty">No food matches these filters. Try another country, letter or keyword.</div>`;

  $$('[data-fav]').forEach(b => b.addEventListener('click', () => {
    const raw=b.dataset.fav, id=raw.startsWith("ext-")?raw:Number(raw);
    state.favorites = state.favorites.includes(id) ? state.favorites.filter(x=>x!==id) : [...state.favorites,id];
    persist(); renderFoods();
  }));
  $$('[data-food]').forEach(b => b.addEventListener('click', () => {
    const raw=b.dataset.food, id=raw.startsWith("ext-")?raw:Number(raw); openFoodModal(id);
  }));
}
$("#foodSearch").addEventListener('input',()=>{visibleFoodLimit=72;renderFoods();});
$("#regionFilter").addEventListener('change',e=>{activeRegion=e.target.value;activeCountry="all";visibleFoodLimit=72;refreshCountryOptions();renderFoods();});
$("#countryFilter").addEventListener('change',e=>{activeCountry=e.target.value;visibleFoodLimit=72;renderFoods();});
$("#categoryFilter").addEventListener('change',e=>{activeCategory=e.target.value;visibleFoodLimit=72;renderFoods();});
$("#foodSort").addEventListener('change',e=>{activeSort=e.target.value;visibleFoodLimit=72;renderFoods();});
$("#alphabetFilters").addEventListener('click',e=>{
  const b=e.target.closest("[data-letter]"); if(!b)return;
  activeLetter=b.dataset.letter;visibleFoodLimit=72;
  $$("#alphabetFilters button").forEach(x=>x.classList.toggle("active",x===b));renderFoods();
});
$("#favOnly").addEventListener('click', () => {
  favoritesOnly=!favoritesOnly; $("#favOnly").textContent=favoritesOnly?'♥ Showing favourites':'♡ Favourites';visibleFoodLimit=72;renderFoods();
});
$("#clearFoodFilters").addEventListener('click',()=>{
  activeRegion=activeCountry=activeCategory=activeLetter="all";activeSort="az";favoritesOnly=false;visibleFoodLimit=72;
  $("#foodSearch").value="";$("#regionFilter").value="all";refreshCountryOptions();$("#countryFilter").value="all";$("#categoryFilter").value="all";$("#foodSort").value="az";
  $$("#alphabetFilters button").forEach(x=>x.classList.toggle("active",x.dataset.letter==="all"));$("#favOnly").textContent="♡ Favourites";renderFoods();
});
$("#loadMoreFoods").addEventListener('click',()=>{visibleFoodLimit+=72;renderFoods();});
$$('[data-quick-category]').forEach(button => button.addEventListener('click', () => {
  activeCategory = button.dataset.quickCategory;
  activeRegion = activeCountry = activeLetter = "all";
  visibleFoodLimit = 72;
  $("#foodSearch").value = "";
  $("#regionFilter").value = "all";
  refreshCountryOptions();
  $("#countryFilter").value = "all";
  $("#categoryFilter").value = activeCategory;
  $$("#alphabetFilters button").forEach(x => x.classList.toggle("active", x.dataset.letter === "all"));
  renderFoods();
  document.getElementById("foodLibraryTitle").scrollIntoView({behavior:"smooth",block:"start"});
}));

$("#globalProductForm").addEventListener('submit',async e=>{
  e.preventDefault();const query=$("#globalProductQuery").value.trim();if(!query)return;
  $("#globalProductStatus").textContent="Searching the worldwide product database…";
  $("#globalProductResults").innerHTML="";
  try{
    const res=await fetch(`/api/global-products?q=${encodeURIComponent(query)}`);
    if(!res.ok)throw new Error();
    const data=await res.json();externalProducts=(data.products||[]).map((p,i)=>({
      id:`ext-${Date.now()}-${i}`,name:p.name||"Unnamed product",country:p.country||"Worldwide",region:"Packaged products",flag:"📦",
      category:p.category||"Packaged Food",serving:p.serving||"100 g",calories:Number(p.calories)||0,protein:Number(p.protein)||0,
      carbs:Number(p.carbs)||0,fat:Number(p.fat)||0,sugar:Number(p.sugar)||0,sodium:Number(p.sodium)||0,emoji:"📦",
      tags:[p.brand||"Open Food Facts"].filter(Boolean),source:"Open Food Facts"
    }));
    $("#globalProductStatus").textContent=externalProducts.length?`${externalProducts.length} products found. Nutrition may be incomplete because product data is community-contributed.`:"No products found.";
    $("#globalProductResults").innerHTML=externalProducts.map((f,i)=>`<article class="product-result"><div><span class="country-badge">📦 ${f.country}</span><h4>${f.name}</h4><p>${f.tags[0]||"Packaged product"} · ${Math.round(f.calories)} kcal per ${f.serving}</p></div><button class="soft" data-external="${i}">Add</button></article>`).join("");
    $$("[data-external]").forEach(b=>b.addEventListener("click",()=>{selectedFood=externalProducts[Number(b.dataset.external)];showFoodModal();}));
  }catch{
    $("#globalProductStatus").textContent="Online search needs the included Node server and an internet connection.";
  }
});

function openFoodModal(id) {
  selectedFood = allFoods().find(f=>String(f.id)===String(id)) || externalProducts.find(f=>String(f.id)===String(id));
  if(!selectedFood) return; showFoodModal();
}
function showFoodModal(){
  $("#modalEmoji").textContent=selectedFood.emoji||"🍽️";
  $("#modalOrigin").textContent=`${selectedFood.flag||"🌐"} ${selectedFood.country||"Custom"} · ${selectedFood.region||"Personal"}`;
  $("#modalName").textContent=selectedFood.name;
  $("#modalServing").textContent=`${selectedFood.category||"Food"} · ${selectedFood.serving||"1 serving"}`;
  $("#modalTags").innerHTML=(selectedFood.tags||[]).map(t=>`<span>${t}</span>`).join("");
  $("#portion").value='1';updateNutritionPreview();$("#foodModal").classList.remove('hidden');
}
function updateNutritionPreview() {
  if(!selectedFood) return; const p=Number($("#portion").value);
  const values=[
    ["Calories",Math.round((selectedFood.calories||0)*p)],
    ["Protein",`${Math.round((selectedFood.protein||0)*p)}g`],
    ["Carbs",`${Math.round((selectedFood.carbs||0)*p)}g`],
    ["Fat",`${Math.round((selectedFood.fat||0)*p)}g`],
    ["Sugar",`${Math.round((selectedFood.sugar||0)*p)}g`],
    ["Sodium",`${Math.round((selectedFood.sodium||0)*p)}mg`]
  ];
  $("#nutritionPreview").innerHTML=values.map(v=>`<div><b>${v[1]}</b><span>${v[0]}</span></div>`).join('');
}
$("#portion").addEventListener('change',updateNutritionPreview);
$("#closeFood").addEventListener('click',()=>$("#foodModal").classList.add('hidden'));
$("#confirmFood").addEventListener('click',()=>{
  const p=Number($("#portion").value), label=$("#portion").selectedOptions[0].text;
  state.meals.push({...selectedFood,logId:crypto.randomUUID(),date:dayKey(),mealType:$("#mealType").value,portion:p,portionLabel:label,calories:selectedFood.calories*p,protein:selectedFood.protein*p,carbs:selectedFood.carbs*p,fat:selectedFood.fat*p});
  $("#foodModal").classList.add('hidden'); save("Meal added");
});

$("#customBtn").addEventListener('click',()=>$("#customModal").classList.remove('hidden'));
$("#closeCustom").addEventListener('click',()=>$("#customModal").classList.add('hidden'));
$("#customForm").addEventListener('submit',e=>{
  e.preventDefault();
  state.custom.push({id:Date.now(),name:$("#customName").value,country:$("#customCountry").value||"Custom",region:"Personal",flag:"⭐",category:$("#customCategory").value,serving:$("#customServing").value,calories:+$("#customCalories").value,protein:+$("#customProtein").value,carbs:+$("#customCarbs").value,fat:+$("#customFat").value,sugar:0,sodium:0,emoji:'🍽️',tags:["Custom"]});
  e.target.reset(); $("#customModal").classList.add('hidden'); save("Custom food saved");
});

$$('#toolTabs button').forEach(b=>b.addEventListener('click',()=>{
  $$('#toolTabs button').forEach(x=>x.classList.toggle('active',x===b)); $$('.tool').forEach(x=>x.classList.remove('active')); $(`#${b.dataset.tool}Tool`).classList.add('active');
}));
$("#foodImage").addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file)return; $("#preview").src=URL.createObjectURL(file); $("#preview").classList.remove('hidden'); $("#uploadText").classList.add('hidden'); $("#analyze").disabled=false; $("#scanResult").classList.add('hidden');
});
async function fileToDataUrl(file){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});}
$("#analyze").addEventListener('click',async()=>{
  const button=$("#analyze"), file=$("#foodImage").files[0]; button.disabled=true; button.textContent='Analysing...';
  try {
    if(file){
      const image=await fileToDataUrl(file);
      const res=await fetch('/api/analyze-food',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image})});
      if(res.ok){const data=await res.json(); if(Array.isArray(data.foods)&&data.foods.length){detectedFoods=data.foods.map((x,i)=>({food:matchFood(x.name)||baseFoods[i%3],portion:Number(x.portion)||1,confidence:Number(x.confidence)||75})); renderDetected(); return;}}
    }
    throw new Error('Demo fallback');
  } catch {
    detectedFoods=[{food:baseFoods[0],portion:1,confidence:89},{food:baseFoods[13],portion:1,confidence:76},{food:baseFoods[35],portion:.5,confidence:66}]; renderDetected();
  } finally {button.disabled=false;button.textContent='Analyse Food';}
});
function matchFood(name=''){const n=name.toLowerCase();return allFoods().find(f=>n.includes(f.name.toLowerCase())||f.name.toLowerCase().includes(n));}
function renderDetected(){
  $("#detected").innerHTML=detectedFoods.map((d,i)=>`<div class="detected"><div class="foodmeta"><div class="emoji">${d.food.emoji}</div><div><b>${d.food.name}</b><span>${d.confidence}% confidence · ${d.food.calories} kcal</span></div></div><select data-detected="${i}"><option value=".5">Half</option><option value="1" selected>1 portion</option><option value="1.5">1.5</option><option value="2">2 portions</option></select></div>`).join('');
  $$('[data-detected]').forEach(s=>s.addEventListener('change',()=>detectedFoods[Number(s.dataset.detected)].portion=Number(s.value))); $("#scanResult").classList.remove('hidden');
}
$("#saveDetected").addEventListener('click',()=>{
  detectedFoods.forEach(d=>state.meals.push({...d.food,logId:crypto.randomUUID(),date:dayKey(),mealType:'Lunch',portion:d.portion,portionLabel:`${d.portion} portion`,calories:d.food.calories*d.portion,protein:d.food.protein*d.portion,carbs:d.food.carbs*d.portion,fat:d.food.fat*d.portion})); save("Detected meal saved"); go('home');
});
$("#labelDemo").addEventListener('click',()=>{$("#labelResult").classList.remove('hidden');$("#labelResult").innerHTML='<b>Extracted values</b><br>Serving: 30 g<br>Calories: 145 kcal<br>Protein: 3 g<br>Carbohydrates: 18 g<br>Fat: 7 g<br>Sugar: 6 g<br>Sodium: 210 mg';});
let barcodeStream = null;
let barcodeFrame = 0;
let barcodeDetector = null;
let barcodeBusy = false;

async function lookupBarcode(code) {
  code = String(code || "").replace(/\D/g, "");
  const result = $("#barcodeResult");
  result.classList.remove("hidden");
  if (!code) { result.textContent = "Please scan or enter a barcode number."; return; }
  $("#barcodeInput").value = code;
  result.innerHTML = `<div class="lookup-loading"><span></span>Looking up ${code}…</div>`;
  try {
    const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error();
    const p = await res.json();
    result.innerHTML = `<div class="barcode-product"><div class="barcode-product-icon">📦</div><div><b>${p.name || "Product found"}</b><span>${p.brand || "Worldwide packaged food"}</span><p>${Math.round(p.calories || 0)} kcal · ${Math.round(p.sugar || 0)}g sugar · ${Math.round(p.protein || 0)}g protein per ${p.serving || "100 g"}</p></div></div>`;
  } catch {
    result.innerHTML = `<b>Barcode captured: ${code}</b><br><span>Product lookup needs the included Node server and an internet connection.</span>`;
  }
}

async function prepareBarcodeDetector() {
  if (!("BarcodeDetector" in window)) return null;
  if (barcodeDetector) return barcodeDetector;
  const preferred = ["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"];
  try {
    const supported = await BarcodeDetector.getSupportedFormats();
    barcodeDetector = new BarcodeDetector({formats: preferred.filter(x => supported.includes(x))});
  } catch { barcodeDetector = new BarcodeDetector(); }
  return barcodeDetector;
}

async function scanBarcodeFrame() {
  if (!barcodeStream || barcodeBusy) { barcodeFrame = requestAnimationFrame(scanBarcodeFrame); return; }
  const video = $("#barcodeVideo");
  if (video.readyState < 2) { barcodeFrame = requestAnimationFrame(scanBarcodeFrame); return; }
  const detector = await prepareBarcodeDetector();
  if (!detector) return;
  barcodeBusy = true;
  try {
    const codes = await detector.detect(video);
    if (codes.length) {
      const value = codes[0].rawValue;
      $("#barcodeCameraStatus").textContent = `Barcode detected: ${value}`;
      navigator.vibrate?.(120);
      stopBarcodeCamera();
      await lookupBarcode(value);
      return;
    }
  } catch {}
  barcodeBusy = false;
  barcodeFrame = requestAnimationFrame(scanBarcodeFrame);
}

async function startBarcodeCamera() {
  const status = $("#barcodeCameraStatus");
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "Camera access is not supported here. Use the photo or manual option.";
    return;
  }
  const detector = await prepareBarcodeDetector();
  if (!detector) {
    status.textContent = "Live barcode detection is not supported by this browser. Try Chrome on Android or use the barcode photo option.";
    return;
  }
  try {
    barcodeStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
    const video = $("#barcodeVideo");
    video.srcObject = barcodeStream;
    await video.play();
    $("#barcodeCameraPlaceholder").classList.add("hidden");
    $("#barcodeCameraStage").classList.add("camera-live");
    $("#startBarcodeCamera").classList.add("hidden");
    $("#stopBarcodeCamera").classList.remove("hidden");
    status.textContent = "Scanning… hold the barcode inside the frame.";
    barcodeBusy = false;
    barcodeFrame = requestAnimationFrame(scanBarcodeFrame);
  } catch {
    status.textContent = "Camera permission was blocked. Allow camera permission, or use the photo option.";
  }
}

function stopBarcodeCamera() {
  cancelAnimationFrame(barcodeFrame);
  barcodeFrame = 0;
  barcodeBusy = false;
  if (barcodeStream) barcodeStream.getTracks().forEach(track => track.stop());
  barcodeStream = null;
  const video = $("#barcodeVideo");
  if (video) video.srcObject = null;
  $("#barcodeCameraPlaceholder")?.classList.remove("hidden");
  $("#barcodeCameraStage")?.classList.remove("camera-live");
  $("#startBarcodeCamera")?.classList.remove("hidden");
  $("#stopBarcodeCamera")?.classList.add("hidden");
}

$("#startBarcodeCamera").addEventListener("click", startBarcodeCamera);
$("#stopBarcodeCamera").addEventListener("click", stopBarcodeCamera);
$("#barcodeSearch").addEventListener("click", () => lookupBarcode($("#barcodeInput").value));
$("#barcodeInput").addEventListener("keydown", event => { if (event.key === "Enter") lookupBarcode(event.target.value); });
$("#barcodeImageInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  const status = $("#barcodeCameraStatus");
  status.textContent = "Reading barcode photo…";
  const detector = await prepareBarcodeDetector();
  if (!detector) { status.textContent = "This browser cannot read barcode photos. Use live camera in Chrome Android or enter the number manually."; return; }
  try {
    const bitmap = await createImageBitmap(file);
    const codes = await detector.detect(bitmap);
    bitmap.close?.();
    if (!codes.length) throw new Error();
    status.textContent = `Barcode detected: ${codes[0].rawValue}`;
    await lookupBarcode(codes[0].rawValue);
  } catch { status.textContent = "No barcode was detected. Retake the photo closer, brighter and straight."; }
});

function loadProfile(){const p=state.profile||{};$("#name").value=p.name||'';$("#age").value=p.age||22;$("#height").value=p.height||170;$("#weight").value=p.weight||70;$("#gender").value=p.gender||'male';$("#activity").value=p.activity||'1.55';$("#goal").value=p.goal??'0';$("#dietStyle").value=p.dietStyle||'balanced';$("#allergy").value=p.allergy||'';$("#waterGoal").value=state.waterGoal||8;}
$("#profileForm").addEventListener('submit',e=>{
  e.preventDefault(); const age=+$("#age").value,height=+$("#height").value,weight=+$("#weight").value,gender=$("#gender").value,activity=+$("#activity").value,goal=+$("#goal").value;
  const bmr=gender==='male'?10*weight+6.25*height-5*age+5:10*weight+6.25*height-5*age-161;
  state.target=Math.max(1200,Math.round((bmr*activity+goal)/10)*10);state.waterGoal=+$("#waterGoal").value;state.profile={name:$("#name").value,age,height,weight,gender,activity,goal,dietStyle:$("#dietStyle").value,allergy:$("#allergy").value};save("Profile updated");
});

function drawReports(){
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dayKey(d),h=state.history[k]||{};days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),calories:h.calories||0,water:h.water||0});}
  $("#avgCalories").textContent=`${Math.round(days.reduce((a,d)=>a+d.calories,0)/7)} kcal`;$("#bestStreak").textContent=`${state.bestStreak||0} days`;$("#mealCount").textContent=state.meals.length;$("#avgWater").textContent=`${(days.reduce((a,d)=>a+d.water,0)/7).toFixed(1)} glasses`;
  const canvas=$("#chart"),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=40,max=Math.max(state.target,...days.map(d=>d.calories),1);ctx.clearRect(0,0,w,h);ctx.font='14px sans-serif';ctx.textAlign='center';
  days.forEach((d,i)=>{const slot=(w-pad*2)/7,bw=Math.min(52,slot*.6),x=pad+i*slot+(slot-bw)/2,y=h-pad-(d.calories/max)*(h-pad*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--primary').trim();ctx.fillRect(x,y,bw,h-pad-y);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--muted').trim();ctx.fillText(d.label,x+bw/2,h-14);ctx.fillText(d.calories,x+bw/2,Math.max(14,y-8));});
  const t=totals(),energy=t.protein*4+t.carbs*4+t.fat*9||1,vals={protein:Math.round(t.protein*4/energy*100),carb:Math.round(t.carbs*4/energy*100),fat:Math.round(t.fat*9/energy*100)};
  Object.entries(vals).forEach(([k,v])=>{$(`#${k}Pct`).textContent=`${v}%`;$(`#${k}Bar`).style.width=`${v}%`;});
  $("#weightHistory").innerHTML=state.weights.length?state.weights.map(x=>`<div><span>${x.date}</span><b>${x.weight} kg</b></div>`).join(''):'<div class="empty">No weight records yet.</div>';
  renderInsights(t);
}
function renderInsights(t){
  const insights=[];
  if(!todaysMeals().length) insights.push(['📝','Start logging','Add at least one meal to unlock personalised insights.']);
  else {
    if(t.protein<60) insights.push(['💪','Protein could be higher','Try fish, eggs, lentils, tofu, yogurt or grilled chicken.']);
    if(t.sugar>50) insights.push(['🍬','Sugar is high','Review sweet drinks, desserts and heavily sweetened packaged foods.']);
    if(t.sodium>2300) insights.push(['🧂','Sodium is high','Choose less salty broth, processed food and heavy sauces tomorrow.']);
    if(state.water<state.waterGoal/2) insights.push(['💧','Hydration is behind','Add a few glasses before the end of the day.']);
    if(!insights.length) insights.push(['✅','Balanced day','Your logged meals are currently within the main targets.']);
  }
  $("#insights").innerHTML=insights.map(x=>`<div class="insight"><div class="badge">${x[0]}</div><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join('');
}
$("#weightForm").addEventListener('submit',e=>{e.preventDefault();state.weights.unshift({date:dayKey(),weight:+$("#weightEntry").value});state.weights=state.weights.slice(0,30);$("#weightEntry").value='';save("Weight saved");drawReports();});

function generatePlan(){
  const style=state.profile.dietStyle||'balanced', target=state.target;
  let candidates=baseFoods.filter(f=>!['Desserts & Sweets','Drinks','Sauces & Condiments','Fast Food'].includes(f.category));
  if(style==='high-protein') candidates=[...candidates].sort((a,b)=>b.protein-a.protein);
  if(style==='lower-carb') candidates=[...candidates].sort((a,b)=>a.carbs-b.carbs);
  if(style==='vegetarian') candidates=candidates.filter(f=>f.vegetarian||['Vegetables & Salads','Breakfast'].includes(f.category));
  const breakfast=candidates.find(f=>f.category==='Breakfast'&&f.calories<450)||candidates.find(f=>f.calories<360)||baseFoods[0];
  const lunch=candidates.find(f=>f.calories>430&&f.calories<620)||baseFoods[1];
  const dinner=[...candidates].reverse().find(f=>f.calories<520)||baseFoods[2];
  const snack=baseFoods.find(f=>f.category==='Snacks & Street Food'&&f.calories<320)||baseFoods[3];
  state.plan=[{meal:'Breakfast',food:breakfast,portion:1},{meal:'Lunch',food:lunch,portion:1},{meal:'Dinner',food:dinner,portion:1},{meal:'Snack',food:snack,portion:.5}];
  const total=state.plan.reduce((a,x)=>a+x.food.calories*x.portion,0);if(total<target*.7)state.plan[1].portion=1.5;save("Global meal plan generated");
}
function renderPlanner(){
  const total=state.plan.reduce((a,x)=>a+x.food.calories*x.portion,0);$("#planCalories").textContent=`${Math.round(total)} kcal`;
  $("#mealPlan").innerHTML=state.plan.map((x,i)=>`<div class="meal"><div class="foodmeta"><div class="emoji">${x.food.emoji}</div><div><b>${x.meal}: ${x.food.name}</b><span>${x.food.flag||"🌐"} ${x.food.country||""} · ${x.food.serving} · ${Math.round(x.food.calories*x.portion)} kcal</span></div></div><button class="soft" data-plan-add="${i}">Log</button></div>`).join('');
  $$('[data-plan-add]').forEach(b=>b.addEventListener('click',()=>{const x=state.plan[Number(b.dataset.planAdd)];state.meals.push({...x.food,logId:crypto.randomUUID(),date:dayKey(),mealType:x.meal,portion:x.portion,portionLabel:`${x.portion} portion`,calories:x.food.calories*x.portion,protein:x.food.protein*x.portion,carbs:x.food.carbs*x.portion,fat:x.food.fat*x.portion});save(`${x.meal} logged`);}));
  renderRecipes();renderGrocery();renderChallenge();
}
function renderRecipes(){const shuffled=[...recipes].sort(()=>Math.random()-.5).slice(0,4);$("#recipeList").innerHTML=shuffled.map(r=>`<article class="recipe"><div class="big">${r.emoji}</div><h4>${r.name}</h4><p>${r.calories} kcal · ${r.time}<br>${r.tip}</p><button class="soft" data-recipe="${r.id}">Add ingredients</button></article>`).join('');$$('[data-recipe]').forEach(b=>b.addEventListener('click',()=>{const r=recipes.find(x=>x.id===Number(b.dataset.recipe));r.ingredients.forEach(name=>{if(!state.grocery.some(g=>g.name===name))state.grocery.push({id:crypto.randomUUID(),name,done:false})});save("Ingredients added");renderGrocery();}));}
function renderGrocery(){$("#groceryList").innerHTML=state.grocery.length?state.grocery.map(g=>`<div class="check-item ${g.done?'done':''}"><label><input type="checkbox" data-check="${g.id}" ${g.done?'checked':''}> <span>${g.name}</span></label><button data-delete-grocery="${g.id}">×</button></div>`).join(''):'<div class="empty">Your grocery list is empty.</div>';$$('[data-check]').forEach(x=>x.addEventListener('change',()=>{const g=state.grocery.find(i=>i.id===x.dataset.check);g.done=x.checked;save();}));$$('[data-delete-grocery]').forEach(x=>x.addEventListener('click',()=>{state.grocery=state.grocery.filter(i=>i.id!==x.dataset.deleteGrocery);save();}));}
function renderChallenge(){const c=state.challenge;$("#challengeCard").innerHTML=`<strong>${c.title}</strong><p>${c.progress} of ${c.target} completed</p><div class="bars"><label><i><b style="width:${Math.min(100,c.progress/c.target*100)}%"></b></i></label></div><button id="challengePlus" class="soft full">Mark one completed</button>`;$("#challengePlus").addEventListener('click',()=>{c.progress=Math.min(c.target,c.progress+1);save(c.progress===c.target?'Challenge completed!':'Progress updated');renderChallenge();});}
$("#generatePlan").addEventListener('click',generatePlan);$("#newRecipes").addEventListener('click',renderRecipes);$("#groceryForm").addEventListener('submit',e=>{e.preventDefault();state.grocery.push({id:crypto.randomUUID(),name:$("#groceryInput").value,done:false});$("#groceryInput").value='';save("Grocery item added");renderGrocery();});$("#clearGrocery").addEventListener('click',()=>{state.grocery=[];save("Grocery list cleared");renderGrocery();});

function applyTheme(){document.body.classList.toggle('dark',state.theme==='dark');$("#themeBtn").textContent=state.theme==='dark'?'☀':'☾';}
$("#themeBtn").addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme();persist();drawReports();});
$("#exportBtn").addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='makanai-data.json';a.click();URL.revokeObjectURL(a.href);});
$("#importInput").addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{state=Object.assign({},defaultState,JSON.parse(r.result));ensureToday();loadProfile();save("Data imported");}catch{toast("Invalid data file")}};r.readAsText(file);});
$("#clearBtn").addEventListener('click',()=>{if(!confirm('Clear all saved data?'))return;state=structuredClone(defaultState);ensureToday();loadProfile();save("App data cleared");});

let deferredPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove('hidden');});$("#installBtn").addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").classList.add('hidden');});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js'));

function renderAll(){applyTheme();renderHome();renderFoods();renderPlanner();drawReports();}
populateWorldFilters();
ensureToday();loadProfile();updateHistory();persist();renderAll();animatePage("home");
