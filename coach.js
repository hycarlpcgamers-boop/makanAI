
/* MakanAI World V7 — AI Coach, 7-day planning, reminders and gamification */
if (typeof crypto !== "undefined" && !crypto.randomUUID) {
  crypto.randomUUID = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
}
const V7_BADGES = [
  {id:"first-meal",emoji:"🍽️",name:"First Bite",description:"Log your first meal",test:()=>state.meals.length>=1},
  {id:"hydrated",emoji:"💧",name:"Hydration Hero",description:"Reach today’s water goal",test:()=>state.water>=state.waterGoal},
  {id:"streak-3",emoji:"🔥",name:"Three-Day Fire",description:"Build a 3-day streak",test:()=>Number($("#streak")?.textContent||0)>=3},
  {id:"streak-7",emoji:"🏆",name:"Perfect Week",description:"Build a 7-day streak",test:()=>Number($("#streak")?.textContent||0)>=7},
  {id:"protein",emoji:"💪",name:"Protein Power",description:"Reach 80 g protein today",test:()=>totals().protein>=80},
  {id:"world",emoji:"🌍",name:"World Explorer",description:"Log foods from 5 countries",test:()=>new Set(state.meals.map(x=>x.country).filter(Boolean)).size>=5},
  {id:"planner",emoji:"🗓️",name:"Plan Master",description:"Generate a 7-day plan",test:()=>state.weeklyPlan?.length>=7},
  {id:"budget",emoji:"💰",name:"Budget Boss",description:"Create a plan within budget",test:()=>isWeekWithinBudget()},
  {id:"scanner",emoji:"📷",name:"Smart Scanner",description:"Save a scanned meal",test:()=>state.gamification?.scans>=1},
  {id:"level-5",emoji:"⭐",name:"Rising Star",description:"Reach level 5",test:()=>getLevelInfo().level>=5}
];

const V7_CHALLENGES = [
  {id:"water-week",title:"Reach your water goal 5 times",description:"Build a consistent hydration habit.",target:5,rewardXP:120,rewardCoins:25},
  {id:"colour-plate",title:"Eat colourful fruit or vegetables 10 times",description:"Add colour and variety across the week.",target:10,rewardXP:100,rewardCoins:20},
  {id:"global-tour",title:"Try foods from 5 countries",description:"Explore the world through your plate.",target:5,rewardXP:130,rewardCoins:30},
  {id:"home-cook",title:"Prepare 4 planned meals",description:"Use your plan and grocery list to stay organised.",target:4,rewardXP:100,rewardCoins:20},
  {id:"sugar-smart",title:"Choose water over a sweet drink 5 times",description:"A simple lower-sugar weekly challenge.",target:5,rewardXP:110,rewardCoins:25}
];

function normaliseV7State() {
  state.xp = Number(state.xp || 0);
  state.coins = Number(state.coins || 0);
  state.badges = Array.isArray(state.badges) ? state.badges : [];
  state.weeklyPlan = Array.isArray(state.weeklyPlan) ? state.weeklyPlan : [];
  state.coachMessages = Array.isArray(state.coachMessages) && state.coachMessages.length ? state.coachMessages : [
    {role:"assistant",text:"Hi! I’m your MakanAI Coach. I can suggest what to eat next, build a budget meal plan, review your day, or find a healthier food swap."}
  ];
  state.friends = Array.isArray(state.friends) ? state.friends : [
    {id:"demo-aina",name:"Aina",xp:1860},
    {id:"demo-daniel",name:"Daniel",xp:1420},
    {id:"demo-hafiz",name:"Hafiz",xp:980}
  ];
  state.gamification = Object.assign({scans:0,plannedMeals:0,waterAwards:{}}, state.gamification || {});
  state.reminders = Object.assign({
    enabled:false,breakfast:"08:00",lunch:"13:00",dinner:"19:00",water:true,lastSent:{}
  }, state.reminders || {});
  if (!state.challenge || !state.challenge.id) {
    state.challenge = {...V7_CHALLENGES[0],progress:0,rewarded:false};
  }
  state.profile = Object.assign({
    country:"Malaysia",dailyBudget:30,preferredCuisine:"Malaysian",
    dislikedFoods:"",healthFocus:"general",healthNotes:""
  }, state.profile || {});
}
normaliseV7State();

persist = function persistV7() {
  localStorage.setItem("makanaiWorldV7", JSON.stringify(state));
};

function getLevelInfo() {
  const level = Math.floor(state.xp / 250) + 1;
  const start = (level - 1) * 250;
  const next = level * 250;
  return {level,start,next,progress:Math.min(100,((state.xp-start)/(next-start))*100)};
}

function awardXP(amount, reason="", showMessage=false) {
  const oldLevel = getLevelInfo().level;
  state.xp += Math.max(0, Number(amount)||0);
  state.coins += Math.max(1, Math.floor((Number(amount)||0)/5));
  const newLevel = getLevelInfo().level;
  unlockBadges(true);
  persist();
  renderGamification();
  if (newLevel > oldLevel) toast(`Level up! You reached Level ${newLevel} ⭐`);
  else if (showMessage && reason) toast(`+${amount} XP · ${reason}`);
}

function unlockBadges(announce=false) {
  const newlyUnlocked = [];
  V7_BADGES.forEach(badge => {
    if (!state.badges.includes(badge.id) && badge.test()) {
      state.badges.push(badge.id);
      newlyUnlocked.push(badge);
    }
  });
  if (newlyUnlocked.length) {
    persist();
    if (announce) toast(`Badge unlocked: ${newlyUnlocked[0].name} ${newlyUnlocked[0].emoji}`);
  }
}

function renderGamification() {
  unlockBadges(false);
  const info = getLevelInfo();
  if ($("#userLevel")) $("#userLevel").textContent = info.level;
  if ($("#userXP")) $("#userXP").textContent = state.xp.toLocaleString();
  if ($("#userCoins")) $("#userCoins").textContent = state.coins.toLocaleString();
  if ($("#xpBar")) $("#xpBar").style.width = `${info.progress}%`;
  if ($("#xpNext")) $("#xpNext").textContent = `${Math.max(0,info.next-state.xp)} XP to Level ${info.level+1}`;
  if ($("#homeBadges")) {
    const unlocked = V7_BADGES.filter(b=>state.badges.includes(b.id)).slice(-4);
    $("#homeBadges").innerHTML = unlocked.length ? unlocked.map(b=>`<span title="${b.name}">${b.emoji}</span>`).join("") : "<small>No badges yet</small>";
  }
  if ($("#coachTodayText")) {
    const left = Math.max(0,Math.round(state.target-totals().calories));
    $("#coachTodayText").textContent = `${left} kcal remaining`;
  }
  renderBadges();
  renderLeaderboard();
}

function renderBadges() {
  if (!$("#badgeGrid")) return;
  $("#badgeCount").textContent = `${state.badges.length} unlocked`;
  $("#badgeGrid").innerHTML = V7_BADGES.map(b=>{
    const unlocked=state.badges.includes(b.id);
    return `<article class="badge-item ${unlocked?"unlocked":"locked"}"><span>${unlocked?b.emoji:"🔒"}</span><b>${b.name}</b><small>${b.description}</small></article>`;
  }).join("");
}

function renderLeaderboard() {
  if (!$("#leaderboard")) return;
  const profileName = state.profile.name || "You";
  const people = [...state.friends,{id:"you",name:profileName,xp:state.xp,you:true}]
    .sort((a,b)=>b.xp-a.xp).slice(0,8);
  $("#leaderboard").innerHTML = people.map((person,index)=>`
    <div class="leader-row ${person.you?"is-you":""}">
      <span class="rank">${index<3?["🥇","🥈","🥉"][index]:index+1}</span>
      <div class="leader-avatar">${person.name.slice(0,1).toUpperCase()}</div>
      <div><b>${person.name}${person.you?" (You)":""}</b><small>Level ${Math.floor(person.xp/250)+1}</small></div>
      <strong>${Number(person.xp).toLocaleString()} XP</strong>
    </div>`).join("");
}

const legacyRenderHomeV6 = renderHome;
renderHome = function renderHomeV7() {
  legacyRenderHomeV6();
  renderGamification();
};

const legacyDrawReportsV6 = drawReports;
drawReports = function drawReportsV7() {
  legacyDrawReportsV6();
  renderGamification();
};

function splitTerms(value="") {
  return String(value).toLowerCase().split(/[,;/]/).map(x=>x.trim()).filter(Boolean);
}
function foodSearchText(food) {
  return [food.name,food.country,food.category,...(food.tags||[])].join(" ").toLowerCase();
}
function isHalalFriendly(food) {
  const text=foodSearchText(food);
  return !["pork","bacon","ham","lard","wine","beer","rum","alcohol","prosciutto","salami"].some(x=>text.includes(x));
}
function isVeganFriendly(food) {
  if (!food.vegetarian) return false;
  const text=foodSearchText(food);
  return !["egg","milk","cheese","yogurt","butter","cream","honey","fish","chicken","beef","lamb","prawn","shrimp","seafood"].some(x=>text.includes(x));
}
function isFoodCompatible(food) {
  const profile=state.profile||{}, text=foodSearchText(food), style=profile.dietStyle||"balanced";
  const blocked=[...splitTerms(profile.allergy),...splitTerms(profile.dislikedFoods)];
  if (blocked.some(term=>text.includes(term))) return false;
  if (style==="vegetarian" && !food.vegetarian) return false;
  if (style==="vegan" && !isVeganFriendly(food)) return false;
  if (style==="halal" && !isHalalFriendly(food)) return false;
  if (profile.healthFocus==="lower-sugar" && Number(food.sugar||0)>15) return false;
  if (profile.healthFocus==="lower-sodium" && Number(food.sodium||0)>800) return false;
  return Number(food.calories)>0;
}
function estimatePrice(food) {
  if (Number(food.price)>0) return Number(food.price);
  const c=String(food.category||"");
  let price=8;
  if (/Water|Fruits|Vegetables|Everyday|Coffee|Tea/.test(c)) price=3.5;
  if (/Snacks|Chocolate|Candy|Biscuits|Cereals/.test(c)) price=5;
  if (/Seafood|Fast Food|Meat/.test(c)) price=14;
  if (food.country && !["Malaysia","Worldwide","Custom"].includes(food.country)) price+=3;
  return Math.round((price + Math.min(5,Number(food.calories||0)/250))*2)/2;
}
function preferredCuisineScore(food) {
  const prefs=splitTerms(state.profile.preferredCuisine);
  if (!prefs.length) return 0;
  const text=foodSearchText(food);
  return prefs.some(x=>text.includes(x)) ? -140 : 0;
}
function getEligibleFoods() {
  let list=allFoods().filter(isFoodCompatible);
  if (state.profile.healthFocus==="higher-protein" || state.profile.dietStyle==="high-protein") {
    list=[...list].sort((a,b)=>b.protein-a.protein);
  }
  if (state.profile.dietStyle==="lower-carb") list=[...list].sort((a,b)=>a.carbs-b.carbs);
  return list;
}
function mealCategories(meal) {
  if (meal==="Breakfast") return ["Breakfast","Cereals & Granola","Bread & Bakery","Dairy & Alternatives","Fruits & Berries","Dairy & Eggs"];
  if (meal==="Snack") return ["Fruits & Berries","Nuts & Seeds","Snacks & Street Food","Chips & Savoury Snacks","Biscuits & Packaged Bakery","Chocolate & Candy"];
  return ["Rice & Grains","Noodles & Pasta","Meat & Poultry","Seafood","Soups & Stews","Vegetables & Salads","Vegetables & Legumes","Fast Food","Everyday Staples"];
}
function chooseMealFood(meal,targetCalories,budget,usedNames=[]) {
  let pool=getEligibleFoods().filter(f=>mealCategories(meal).includes(f.category));
  if (!pool.length) pool=getEligibleFoods();
  const ranked=pool.map(food=>{
    const portion=Math.max(.5,Math.min(1.5,Math.round((targetCalories/Math.max(1,food.calories))*2)/2));
    const calories=food.calories*portion, cost=estimatePrice(food)*portion;
    let score=Math.abs(calories-targetCalories)+preferredCuisineScore(food);
    if (cost>budget) score+=(cost-budget)*70;
    if (usedNames.includes(food.name)) score+=180;
    if (meal==="Snack" && calories>350) score+=250;
    return {food,portion,cost,calories,score};
  }).sort((a,b)=>a.score-b.score);
  const shortlist=ranked.slice(0,Math.min(10,ranked.length));
  return shortlist[Math.floor(Math.random()*Math.max(1,shortlist.length))] || ranked[0];
}

function generateWeeklyPlan(award=true) {
  const ratios={Breakfast:.25,Lunch:.34,Dinner:.31,Snack:.10};
  const dailyBudget=Math.max(8,Number(state.profile.dailyBudget||30));
  const used=[];
  state.weeklyPlan=Array.from({length:7},(_,dayIndex)=>{
    const date=new Date(); date.setDate(date.getDate()+dayIndex);
    const meals=Object.entries(ratios).map(([meal,ratio])=>{
      const chosen=chooseMealFood(meal,state.target*ratio,dailyBudget*ratio,used);
      if (!chosen) return null;
      used.push(chosen.food.name);
      return {meal,food:chosen.food,portion:chosen.portion,cost:chosen.cost};
    }).filter(Boolean);
    return {
      id:crypto.randomUUID(),date:dayKey(date),
      label:date.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"}),
      meals,logged:false
    };
  });
  if (award) awardXP(25,"7-day plan generated");
  persist();
  renderPlanner();
  if (award) toast("Personalised 7-day plan generated");
}

function planDayTotals(day) {
  return day.meals.reduce((a,x)=>{
    a.calories+=x.food.calories*x.portion;
    a.cost+=x.cost;
    return a;
  },{calories:0,cost:0});
}
function isWeekWithinBudget() {
  if (!state.weeklyPlan?.length) return false;
  const budget=Math.max(0,Number(state.profile.dailyBudget||0));
  return budget>0 && state.weeklyPlan.every(day=>planDayTotals(day).cost<=budget*1.08);
}
function renderCoachSummary() {
  if (!$("#coachProfileSummary")) return;
  const p=state.profile, left=Math.max(0,Math.round(state.target-totals().calories));
  $("#coachProfileSummary").innerHTML=`
    <div class="summary-icon">🎯</div><small>COACH PROFILE</small><h3>${String(p.dietStyle||"balanced").replaceAll("-"," ")} plan</h3>
    <div class="summary-list">
      <div><span>Calories left</span><b>${left} kcal</b></div>
      <div><span>Daily budget</span><b>RM ${Number(p.dailyBudget||30).toFixed(2)}</b></div>
      <div><span>Preferred cuisine</span><b>${p.preferredCuisine||"Any"}</b></div>
      <div><span>Health focus</span><b>${String(p.healthFocus||"general").replaceAll("-"," ")}</b></div>
    </div>
    ${p.allergy?`<p class="warning-box">⚠ Avoid: ${escapeHTML(p.allergy)}</p>`:""}
    ${p.dietStyle==="halal"?`<p class="medical-note">Halal-friendly filtering excludes obvious pork and alcohol terms but does not certify products or restaurants.</p>`:""}`;
}
function renderWeeklyPlan() {
  if (!state.weeklyPlan.length) generateWeeklyPlan(false);
  const budget=Number(state.profile.dailyBudget||30);
  const avg=state.weeklyPlan.reduce((a,d)=>a+planDayTotals(d).calories,0)/Math.max(1,state.weeklyPlan.length);
  $("#planCalories").textContent=`${Math.round(avg)} kcal/day`;
  const within=isWeekWithinBudget();
  $("#weekBudgetStatus").textContent=within?`✓ Within RM ${budget.toFixed(2)}/day budget`:`Some days exceed RM ${budget.toFixed(2)}`;
  $("#weekBudgetStatus").className=`budget-status ${within?"good":"warn"}`;
  $("#mealPlan").innerHTML=state.weeklyPlan.map((day,di)=>{
    const total=planDayTotals(day);
    return `<article class="day-plan-card ${di===0?"today-plan":""}">
      <div class="day-plan-head"><div><small>${di===0?"TODAY":"DAY "+(di+1)}</small><h4>${day.label}</h4></div><div><b>${Math.round(total.calories)} kcal</b><span>RM ${total.cost.toFixed(2)}</span></div></div>
      <div class="day-meals">${day.meals.map((item,mi)=>`
        <div class="plan-meal-row">
          <div class="emoji">${item.food.emoji||"🍽️"}</div>
          <div><small>${item.meal}</small><b>${item.food.name}</b><span>${item.food.flag||"🌐"} ${item.food.country||""} · ${Math.round(item.food.calories*item.portion)} kcal · RM ${item.cost.toFixed(2)}</span></div>
          <button class="swap-button" data-swap-day="${di}" data-swap-meal="${mi}" title="Swap food">⇄</button>
        </div>`).join("")}</div>
      <div class="day-plan-actions"><button class="soft" data-log-day="${di}" ${day.logged?"disabled":""}>${day.logged?"Logged ✓":"Log this day"}</button><button class="link" data-grocery-day="${di}">Add groceries</button></div>
    </article>`;
  }).join("");
  $$("[data-swap-day]").forEach(button=>button.addEventListener("click",()=>swapPlanMeal(Number(button.dataset.swapDay),Number(button.dataset.swapMeal))));
  $$("[data-log-day]").forEach(button=>button.addEventListener("click",()=>logPlanDay(Number(button.dataset.logDay))));
  $$("[data-grocery-day]").forEach(button=>button.addEventListener("click",()=>addPlanToGrocery([state.weeklyPlan[Number(button.dataset.groceryDay)]])));
}
function swapPlanMeal(dayIndex,mealIndex) {
  const item=state.weeklyPlan[dayIndex]?.meals[mealIndex];
  if (!item) return;
  const dailyBudget=Number(state.profile.dailyBudget||30);
  const picked=chooseMealFood(item.meal,item.food.calories*item.portion,dailyBudget*.35,[item.food.name]);
  if (!picked) return toast("No suitable swap found");
  state.weeklyPlan[dayIndex].meals[mealIndex]={meal:item.meal,food:picked.food,portion:picked.portion,cost:picked.cost};
  awardXP(5,"Healthy swap");
  save(`Swapped to ${picked.food.name}`);
}
function logPlanDay(index) {
  const day=state.weeklyPlan[index];
  if (!day || day.logged) return;
  day.meals.forEach(item=>state.meals.push({
    ...item.food,logId:crypto.randomUUID(),date:day.date,mealType:item.meal,
    portion:item.portion,portionLabel:`${item.portion} portion`,
    calories:item.food.calories*item.portion,protein:item.food.protein*item.portion,
    carbs:item.food.carbs*item.portion,fat:item.food.fat*item.portion,
    sugar:item.food.sugar,sodium:item.food.sodium
  }));
  day.logged=true;
  state.gamification.plannedMeals+=day.meals.length;
  awardXP(30,"Planned day logged");
  save(`${day.label} added to diary`);
}
function addPlanToGrocery(days) {
  days.forEach(day=>day.meals.forEach(item=>{
    const name=`${item.food.name} — ${item.portion} portion`;
    if (!state.grocery.some(g=>g.name===name)) state.grocery.push({id:crypto.randomUUID(),name,done:false});
  }));
  awardXP(8,"Grocery list prepared");
  save("Plan added to grocery list");
}

function renderCoachMessages() {
  if (!$("#coachMessages")) return;
  $("#coachMessages").innerHTML=state.coachMessages.slice(-10).map(message=>
    `<div class="coach-bubble ${message.role}"><span>${message.role==="assistant"?"✨":"☺"}</span><p>${escapeHTML(message.text).replace(/\n/g,"<br>")}</p></div>`
  ).join("");
  $("#coachMessages").scrollTop=$("#coachMessages").scrollHeight;
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function recommendedFoods(limit=3,mode="balanced") {
  const left=Math.max(180,state.target-totals().calories);
  let list=getEligibleFoods().filter(f=>f.calories<=left*1.1 && !["Water & Hydration","Drinks","Soft Drinks","Coffee & Tea","Juices & Smoothies"].includes(f.category));
  if (mode==="cheap") list=list.sort((a,b)=>estimatePrice(a)-estimatePrice(b)||b.protein-a.protein);
  else if (mode==="swap") list=list.sort((a,b)=>(a.calories+a.sodium/20)-(b.calories+b.sodium/20));
  else list=list.sort((a,b)=>Math.abs(a.protein-25)-Math.abs(b.protein-25));
  return list.slice(0,limit);
}
function localCoachReply(message) {
  const text=message.toLowerCase(), t=totals(), left=Math.max(0,Math.round(state.target-t.calories));
  const budget=Number(state.profile.dailyBudget||30);
  if (/what can i eat|eat now|makan apa|cadang.*makan/.test(text)) {
    const picks=recommendedFoods(3);
    return picks.length?`You have about ${left} kcal left. Good options: ${picks.map(f=>`${f.name} (${f.calories} kcal, about RM ${estimatePrice(f).toFixed(2)})`).join("; ")}. Confirm the real portion before logging.`:"I could not find a suitable match. Check your allergy and diet filters in Profile.";
  }
  if (/cheap|budget|murah/.test(text)) {
    const picks=recommendedFoods(3,"cheap");
    return `Your daily budget is RM ${budget.toFixed(2)}. Lower-cost choices include ${picks.map(f=>`${f.name} (~RM ${estimatePrice(f).toFixed(2)})`).join(", ")}. Water is the cheapest drink choice and avoids extra sugar.`;
  }
  if (/swap|healthier|tukar/.test(text)) {
    const last=todaysMeals().at(-1);
    const swaps=recommendedFoods(3,"swap").filter(f=>!last||f.name!==last.name);
    return last?`For ${last.name}, consider ${swaps.map(f=>`${f.name} (${f.calories} kcal)`).join(", ")}. These are general alternatives; ingredients and preparation still matter.`:`Log a meal first, then I can suggest a healthier swap.`;
  }
  if (/how am i|doing today|daily check|progress|macam mana/.test(text)) {
    return `Today you logged ${Math.round(t.calories)} of ${state.target} kcal, ${Math.round(t.protein)} g protein and ${state.water}/${state.waterGoal} glasses of water. ${left>0?`${left} kcal remain.`:"You have reached or exceeded your calorie target."} ${t.sugar>50?"Your logged sugar is relatively high, so choose water and less-sweet foods next.":""}`;
  }
  if (/protein/.test(text)) {
    const picks=getEligibleFoods().sort((a,b)=>b.protein-a.protein).slice(0,3);
    return `Your logged protein is ${Math.round(t.protein)} g. Higher-protein options include ${picks.map(f=>`${f.name} (${f.protein} g per ${f.serving})`).join(", ")}.`;
  }
  if (/sugar|sweet|gula/.test(text)) {
    return `Your logged sugar estimate is ${Math.round(t.sugar)} g. Choose water, unsweetened drinks, whole fruit, and check packaged-food labels. Recipe and brand differences can be large.`;
  }
  return `I can help with what to eat next, cheaper meals, healthier swaps, protein, sugar, hydration, or your 7-day plan. You currently have about ${left} kcal remaining.`;
}
async function askCoach(message) {
  const clean=String(message||"").trim();
  if (!clean) return;
  state.coachMessages.push({role:"user",text:clean});
  renderCoachMessages();
  const typing={role:"assistant",text:"Thinking…",typing:true};
  state.coachMessages.push(typing); renderCoachMessages();
  let reply="";
  try {
    const options=recommendedFoods(8).map(f=>({name:f.name,calories:f.calories,protein:f.protein,country:f.country,price:estimatePrice(f)}));
    const response=await fetch("/api/coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      message:clean,profile:state.profile,summary:{...totals(),target:state.target,water:state.water,waterGoal:state.waterGoal},options
    })});
    if (!response.ok) throw new Error();
    const data=await response.json();
    reply=String(data.reply||"").trim();
    if (!reply) throw new Error();
  } catch {
    reply=localCoachReply(clean);
  }
  state.coachMessages=state.coachMessages.filter(x=>!x.typing);
  state.coachMessages.push({role:"assistant",text:reply});
  awardXP(2,"Coach conversation");
  persist();renderCoachMessages();
}

function renderChallengeV7() {
  const c=state.challenge;
  const pct=Math.min(100,(c.progress/c.target)*100);
  $("#challengeCard").innerHTML=`
    <div class="challenge-top"><div class="challenge-icon">🎯</div><div><b>${c.title}</b><p>${c.description||""}</p></div><span>+${c.rewardXP||100} XP</span></div>
    <div class="challenge-progress"><i style="width:${pct}%"></i></div>
    <div class="challenge-bottom"><span>${c.progress} / ${c.target} completed</span><button id="challengePlus" class="soft" ${c.progress>=c.target?"disabled":""}>${c.progress>=c.target?"Completed ✓":"Mark progress"}</button></div>`;
  $("#challengePlus")?.addEventListener("click",()=>{
    c.progress=Math.min(c.target,c.progress+1);
    if (c.progress>=c.target && !c.rewarded) {
      c.rewarded=true;
      state.xp+=c.rewardXP||100;state.coins+=c.rewardCoins||20;
      toast(`Challenge complete! +${c.rewardXP||100} XP`);
    }
    save();
  });
}
renderChallenge = renderChallengeV7;

renderPlanner = function renderPlannerV7() {
  renderCoachSummary();
  renderCoachMessages();
  renderWeeklyPlan();
  renderRecipes();
  renderGrocery();
  renderChallengeV7();
};

const profileForm = $("#profileForm");
if (profileForm) {
  const cleanForm=profileForm.cloneNode(true);
  profileForm.replaceWith(cleanForm);
}
loadProfile = function loadProfileV7() {
  normaliseV7State();
  const p=state.profile||{};
  $("#name").value=p.name||"";
  $("#age").value=p.age||22;$("#height").value=p.height||170;$("#weight").value=p.weight||70;
  $("#gender").value=p.gender||"male";$("#activity").value=p.activity||"1.55";$("#goal").value=p.goal??"0";
  $("#dietStyle").value=p.dietStyle||"balanced";$("#allergy").value=p.allergy||"";
  $("#waterGoal").value=state.waterGoal||8;
  $("#profileCountry").value=p.country||"Malaysia";$("#dailyBudget").value=p.dailyBudget||30;
  $("#preferredCuisine").value=p.preferredCuisine||"Malaysian";$("#dislikedFoods").value=p.dislikedFoods||"";
  $("#healthFocus").value=p.healthFocus||"general";$("#healthNotes").value=p.healthNotes||"";
  $("#breakfastReminder").value=state.reminders.breakfast||"08:00";
  $("#lunchReminder").value=state.reminders.lunch||"13:00";
  $("#dinnerReminder").value=state.reminders.dinner||"19:00";
  $("#waterReminder").checked=state.reminders.water!==false;
  updateReminderStatus();
};
loadProfile();
$("#profileForm").addEventListener("submit",event=>{
  event.preventDefault();
  const age=+$("#age").value,height=+$("#height").value,weight=+$("#weight").value,gender=$("#gender").value,activity=+$("#activity").value,goal=+$("#goal").value;
  const bmr=gender==="male"?10*weight+6.25*height-5*age+5:10*weight+6.25*height-5*age-161;
  state.target=Math.max(1200,Math.round((bmr*activity+goal)/10)*10);
  state.waterGoal=+$("#waterGoal").value;
  state.profile={
    ...state.profile,name:$("#name").value,age,height,weight,gender,activity,goal,
    dietStyle:$("#dietStyle").value,allergy:$("#allergy").value,
    country:$("#profileCountry").value||"Malaysia",dailyBudget:+$("#dailyBudget").value||30,
    preferredCuisine:$("#preferredCuisine").value,dislikedFoods:$("#dislikedFoods").value,
    healthFocus:$("#healthFocus").value,healthNotes:$("#healthNotes").value
  };
  state.reminders.breakfast=$("#breakfastReminder").value;
  state.reminders.lunch=$("#lunchReminder").value;
  state.reminders.dinner=$("#dinnerReminder").value;
  state.reminders.water=$("#waterReminder").checked;
  state.weeklyPlan=[];
  awardXP(10,"Profile completed");
  save("Profile and coach preferences updated");
});

function updateReminderStatus() {
  if (!$("#reminderStatus")) return;
  $("#reminderStatus").textContent=state.reminders.enabled?"Enabled":"Off";
  $("#reminderStatus").className=state.reminders.enabled?"status-on":"";
}
async function enableNotifications() {
  if (!("Notification" in window)) return toast("Notifications are not supported in this browser");
  const permission=await Notification.requestPermission();
  state.reminders.enabled=permission==="granted";
  persist();updateReminderStatus();
  toast(state.reminders.enabled?"Notifications enabled":"Notification permission was not granted");
}
function sendReminder(title,body) {
  if (state.reminders.enabled && Notification.permission==="granted") {
    new Notification(title,{body,icon:"icon-192.png",badge:"icon-192.png"});
  } else toast(`${title}: ${body}`);
}
function checkReminders() {
  if (!state.reminders.enabled) return;
  const now=new Date(), time=now.toTimeString().slice(0,5), date=dayKey();
  const reminders=[
    ["breakfast",state.reminders.breakfast,"Breakfast reminder","Log breakfast or ask MakanAI Coach for a suggestion."],
    ["lunch",state.reminders.lunch,"Lunch reminder","Check your remaining calories and budget before choosing lunch."],
    ["dinner",state.reminders.dinner,"Dinner reminder","Review today’s nutrition and choose a balanced dinner."]
  ];
  reminders.forEach(([key,target,title,body])=>{
    const stamp=`${date}-${key}`;
    if (target===time && !state.reminders.lastSent[stamp]) {
      state.reminders.lastSent[stamp]=true;persist();sendReminder(title,body);
    }
  });
  if (state.reminders.water && now.getMinutes()===0 && now.getHours()>=9 && now.getHours()<=21 && now.getHours()%2===1) {
    const stamp=`${date}-water-${now.getHours()}`;
    if (!state.reminders.lastSent[stamp] && state.water<state.waterGoal) {
      state.reminders.lastSent[stamp]=true;persist();sendReminder("Water check","Take a water break and update your hydration tracker.");
    }
  }
}
$("#enableReminders")?.addEventListener("click",enableNotifications);
$("#testReminder")?.addEventListener("click",()=>sendReminder("MakanAI reminder","Your smart meal and hydration reminders are working."));
setInterval(checkReminders,30000);

$("#generateWeekPlan")?.addEventListener("click",()=>generateWeeklyPlan(true));
$("#logTodayPlan")?.addEventListener("click",()=>logPlanDay(0));
$("#addWeekGrocery")?.addEventListener("click",()=>addPlanToGrocery(state.weeklyPlan));
$("#newChallenge")?.addEventListener("click",()=>{
  const current=state.challenge?.id;
  const choices=V7_CHALLENGES.filter(c=>c.id!==current);
  state.challenge={...choices[Math.floor(Math.random()*choices.length)],progress:0,rewarded:false};
  save("New weekly challenge selected");
});
$("#coachForm")?.addEventListener("submit",event=>{
  event.preventDefault();const input=$("#coachInput");askCoach(input.value);input.value="";
});
$$("[data-coach-prompt]").forEach(button=>button.addEventListener("click",()=>askCoach(button.dataset.coachPrompt)));
$("#friendForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  state.friends.push({id:crypto.randomUUID(),name:$("#friendName").value.trim(),xp:+$("#friendXP").value||0});
  $("#friendName").value="";$("#friendXP").value="";persist();renderLeaderboard();toast("Friend added to demo leaderboard");
});

$("#addWater")?.addEventListener("click",()=>{
  const date=dayKey();if (!state.gamification.waterAwards[date]) state.gamification.waterAwards[date]=0;
  if (state.water>state.gamification.waterAwards[date]) {
    state.gamification.waterAwards[date]=state.water;awardXP(3,"Water logged");
  }
});
$("#confirmFood")?.addEventListener("click",()=>awardXP(15,"Meal logged"));
$("#saveDetected")?.addEventListener("click",()=>{state.gamification.scans+=1;awardXP(25,"Scanned meal saved");});
$("#customForm")?.addEventListener("submit",()=>awardXP(10,"Custom food created"));
$("#weightForm")?.addEventListener("submit",()=>awardXP(8,"Weight updated"));

normaliseV7State();
persist();
renderAll();
animatePage("home");
