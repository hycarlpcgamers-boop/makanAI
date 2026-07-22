const baseFoods = [
  [1,"Nasi Lemak","Rice","1 packet",520,13,70,22,8,780,"🍛"],
  [2,"Nasi Ayam","Rice","1 plate",600,28,74,20,5,960,"🍗"],
  [3,"Nasi Kerabu","Rice","1 plate",560,24,72,18,6,820,"🍚"],
  [4,"Nasi Kandar","Rice","1 plate",760,30,88,31,9,1250,"🍛"],
  [5,"Nasi Goreng Kampung","Rice","1 plate",640,22,82,25,5,1100,"🍳"],
  [6,"Bubur Ayam","Rice","1 bowl",370,20,50,10,3,790,"🥣"],
  [7,"Mee Goreng Mamak","Noodles","1 plate",610,18,84,23,10,1180,"🍜"],
  [8,"Char Kuey Teow","Noodles","1 plate",740,23,86,34,8,1300,"🥢"],
  [9,"Laksa","Noodles","1 bowl",520,17,65,21,7,1200,"🍲"],
  [10,"Mee Rebus","Noodles","1 bowl",510,16,78,15,12,1050,"🍜"],
  [11,"Curry Mee","Noodles","1 bowl",590,20,68,26,7,1260,"🍜"],
  [12,"Kuey Teow Soup","Noodles","1 bowl",390,19,57,10,4,880,"🍲"],
  [13,"Ayam Goreng","Protein","1 piece",290,24,8,18,1,530,"🍗"],
  [14,"Ayam Percik","Protein","1 piece",330,28,12,19,7,600,"🍗"],
  [15,"Ikan Bakar","Protein","1 medium fish",280,34,5,13,2,420,"🐟"],
  [16,"Satay Ayam","Protein","10 sticks",390,31,22,19,11,670,"🍢"],
  [17,"Daging Rendang","Protein","1 serving",460,30,15,31,6,720,"🥩"],
  [18,"Telur Dadar","Protein","1 serving",220,14,4,17,1,410,"🍳"],
  [19,"Roti Canai","Snacks","1 piece",300,6,45,11,3,510,"🫓"],
  [20,"Karipap","Snacks","1 piece",180,4,23,8,2,260,"🥟"],
  [21,"Pisang Goreng","Snacks","3 pieces",290,3,46,11,17,90,"🍌"],
  [22,"Cucur Udang","Snacks","3 pieces",320,10,38,14,3,470,"🍤"],
  [23,"Popiah Basah","Snacks","2 rolls",240,8,38,7,8,430,"🌯"],
  [24,"Pulut Panggang","Snacks","2 pieces",260,7,42,8,4,300,"🍙"],
  [25,"Teh Tarik","Drinks","1 glass",190,5,33,5,27,110,"🥤"],
  [26,"Milo Ais","Drinks","1 glass",250,7,43,6,31,140,"🧋"],
  [27,"Kopi O Kosong","Drinks","1 cup",8,0,2,0,0,5,"☕"],
  [28,"Air Sirap","Drinks","1 glass",140,0,36,0,35,15,"🥤"],
  [29,"Lime Juice Less Sugar","Drinks","1 glass",85,1,22,0,17,10,"🍋"],
  [30,"Soy Milk","Drinks","1 glass",120,7,15,4,9,90,"🥛"],
  [31,"Cendol","Dessert","1 bowl",390,5,62,14,41,160,"🍧"],
  [32,"Ais Kacang","Dessert","1 bowl",430,6,76,11,48,220,"🍨"],
  [33,"Kuih Lapis","Dessert","2 pieces",210,2,39,5,18,120,"🍰"],
  [34,"Kuih Seri Muka","Dessert","2 pieces",260,4,44,8,21,150,"🍰"],
  [35,"Tau Fu Fah","Dessert","1 bowl",180,8,27,5,19,60,"🥣"],
  [36,"Fresh Papaya","Dessert","1 cup",62,1,16,0,11,3,"🥭"]
].map(x => ({id:x[0],name:x[1],category:x[2],serving:x[3],calories:x[4],protein:x[5],carbs:x[6],fat:x[7],sugar:x[8],sodium:x[9],emoji:x[10]}));

const recipes = [
  {id:1,name:"Lighter Nasi Lemak",emoji:"🍛",calories:430,time:"25 min",ingredients:["brown rice","egg","cucumber","anchovies","light sambal"],tip:"Use less coconut milk and a measured sambal portion."},
  {id:2,name:"Air-Fried Ayam Percik",emoji:"🍗",calories:360,time:"35 min",ingredients:["chicken breast","lemongrass","turmeric","light coconut milk"],tip:"Air-fry instead of deep-frying."},
  {id:3,name:"High-Protein Mee Soup",emoji:"🍜",calories:420,time:"20 min",ingredients:["rice noodles","chicken","bok choy","egg","clear broth"],tip:"Choose clear broth and add vegetables."},
  {id:4,name:"Tempeh Nasi Kerabu Bowl",emoji:"🥗",calories:470,time:"30 min",ingredients:["blue rice","tempeh","herbs","cucumber","lime"],tip:"A fibre-rich vegetarian option."},
  {id:5,name:"Ikan Bakar Salad Plate",emoji:"🐟",calories:380,time:"30 min",ingredients:["fish","ulam","tomato","lime","half rice portion"],tip:"Keep sauces on the side."},
  {id:6,name:"Low-Sugar Cendol Cup",emoji:"🍧",calories:210,time:"15 min",ingredients:["cendol","light coconut milk","kidney beans","small gula melaka portion"],tip:"Use half the usual syrup."}
];

const defaultState = {
  target:2000, water:0, waterGoal:8, meals:[], history:{}, weights:[], profile:{},
  favorites:[], custom:[], theme:"light", bestStreak:0, grocery:[], plan:[], lastDate:"",
  challenge:{title:"Eat vegetables twice today",progress:0,target:2}
};
let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem("makanaiV2") || "{}"));
let activeCategory = "all", activeMealFilter = "all", favoritesOnly = false, selectedFood = null, detectedFoods = [];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const dayKey = (d = new Date()) => d.toISOString().slice(0,10);
const allFoods = () => [...baseFoods, ...(state.custom || [])];

function ensureToday() {
  const today = dayKey();
  if (state.lastDate && state.lastDate !== today) state.water = 0;
  state.lastDate = today;
}
function persist() { localStorage.setItem("makanaiV2", JSON.stringify(state)); }
function save(message) { updateHistory(); persist(); renderAll(); if (message) toast(message); }
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
function go(page) {
  $$(".page").forEach(x => x.classList.toggle("active", x.id === page));
  $$("nav button").forEach(x => x.classList.toggle("active", x.dataset.page === page));
  if (page === "reports") drawReports();
  if (page === "planner") renderPlanner();
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

function renderFoods() {
  const term = $("#foodSearch").value.toLowerCase();
  const list = allFoods().filter(f => (activeCategory==='all'||f.category===activeCategory) && f.name.toLowerCase().includes(term) && (!favoritesOnly || state.favorites.includes(f.id)));
  $("#foodGrid").innerHTML = list.length ? list.map(f => `
    <article class="food-card"><button class="fav" data-fav="${f.id}">${state.favorites.includes(f.id)?'♥':'♡'}</button><div class="emoji">${f.emoji||'🍽️'}</div><h4>${f.name}</h4><p>${f.serving} · ${f.calories} kcal<br>${f.protein}g protein · ${f.carbs}g carbs · ${f.fat}g fat<br>${f.sugar||0}g sugar · ${f.sodium||0}mg sodium</p><button class="add" data-food="${f.id}">Add to diary</button></article>
  `).join('') : `<div class="empty">No matching food found.</div>`;
  $$('[data-fav]').forEach(b => b.addEventListener('click', () => {
    const id=Number(b.dataset.fav); state.favorites = state.favorites.includes(id) ? state.favorites.filter(x=>x!==id) : [...state.favorites,id]; save();
  }));
  $$('[data-food]').forEach(b => b.addEventListener('click', () => openFoodModal(Number(b.dataset.food))));
}
$("#foodSearch").addEventListener('input', renderFoods);
$$('#categoryFilters button').forEach(b => b.addEventListener('click', () => {
  activeCategory=b.dataset.category; $$('#categoryFilters button').forEach(x=>x.classList.toggle('active',x===b)); renderFoods();
}));
$("#favOnly").addEventListener('click', () => { favoritesOnly=!favoritesOnly; $("#favOnly").textContent=favoritesOnly?'♥ Showing favourites':'♡ Favourites'; renderFoods(); });

function openFoodModal(id) {
  selectedFood = allFoods().find(f=>f.id===id); if(!selectedFood) return;
  $("#modalName").textContent=selectedFood.name; $("#modalServing").textContent=selectedFood.serving; $("#portion").value='1'; updateNutritionPreview(); $("#foodModal").classList.remove('hidden');
}
function updateNutritionPreview() {
  if(!selectedFood) return; const p=Number($("#portion").value);
  const values=[["Calories",Math.round(selectedFood.calories*p)],["Protein",`${Math.round(selectedFood.protein*p)}g`],["Carbs",`${Math.round(selectedFood.carbs*p)}g`],["Fat",`${Math.round(selectedFood.fat*p)}g`]];
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
  state.custom.push({id:Date.now(),name:$("#customName").value,category:$("#customCategory").value,serving:$("#customServing").value,calories:+$("#customCalories").value,protein:+$("#customProtein").value,carbs:+$("#customCarbs").value,fat:+$("#customFat").value,sugar:0,sodium:0,emoji:'🍽️'});
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
$("#barcodeSearch").addEventListener('click',()=>{const code=$("#barcodeInput").value.trim();$("#barcodeResult").classList.remove('hidden');$("#barcodeResult").innerHTML=code?`<b>Demo result for ${code}</b><br>Malaysian chocolate malt drink<br>160 kcal · 18 g sugar per packet`:'Please enter a barcode number.';});

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
    if(t.protein<60) insights.push(['💪','Protein could be higher','Try ikan bakar, eggs, tempeh or grilled chicken.']);
    if(t.sugar>50) insights.push(['🍬','Sugar is high','Sweet drinks and desserts are the main items to review.']);
    if(t.sodium>2300) insights.push(['🧂','Sodium is high','Choose less gravy, soup and processed sauces tomorrow.']);
    if(state.water<state.waterGoal/2) insights.push(['💧','Hydration is behind','Add a few glasses before the end of the day.']);
    if(!insights.length) insights.push(['✅','Balanced day','Your logged meals are currently within the main targets.']);
  }
  $("#insights").innerHTML=insights.map(x=>`<div class="insight"><div class="badge">${x[0]}</div><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join('');
}
$("#weightForm").addEventListener('submit',e=>{e.preventDefault();state.weights.unshift({date:dayKey(),weight:+$("#weightEntry").value});state.weights=state.weights.slice(0,30);$("#weightEntry").value='';save("Weight saved");drawReports();});

function generatePlan(){
  const style=state.profile.dietStyle||'balanced', target=state.target;
  let candidates=baseFoods.filter(f=>f.category!=='Dessert'&&f.category!=='Drinks');
  if(style==='high-protein') candidates=candidates.sort((a,b)=>b.protein-a.protein);
  if(style==='lower-carb') candidates=candidates.sort((a,b)=>a.carbs-b.carbs);
  if(style==='vegetarian') candidates=baseFoods.filter(f=>['Rice','Noodles','Snacks','Dessert'].includes(f.category)&&!/(ayam|ikan|daging|satay|udang)/i.test(f.name));
  const breakfast=candidates.find(f=>f.calories<400)||baseFoods[18], lunch=candidates.find(f=>f.calories>400&&f.calories<650)||baseFoods[2], dinner=[...candidates].reverse().find(f=>f.calories<500)||baseFoods[14], snack=baseFoods[35];
  state.plan=[{meal:'Breakfast',food:breakfast,portion:1},{meal:'Lunch',food:lunch,portion:1},{meal:'Dinner',food:dinner,portion:1},{meal:'Snack',food:snack,portion:1}];
  const total=state.plan.reduce((a,x)=>a+x.food.calories*x.portion,0); if(total<target*.7) state.plan[1].portion=1.5; save("Meal plan generated");
}
function renderPlanner(){
  if(!state.plan.length) generatePlan();
  const total=state.plan.reduce((a,x)=>a+x.food.calories*x.portion,0);$("#planCalories").textContent=`${Math.round(total)} kcal`;
  $("#mealPlan").innerHTML=state.plan.map((x,i)=>`<div class="meal"><div class="foodmeta"><div class="emoji">${x.food.emoji}</div><div><b>${x.meal}: ${x.food.name}</b><span>${x.food.serving} · ${Math.round(x.food.calories*x.portion)} kcal</span></div></div><button class="soft" data-plan-add="${i}">Log</button></div>`).join('');
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
ensureToday();loadProfile();updateHistory();persist();renderAll();
