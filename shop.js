
/* MakanAI World V8 — Shop & Dine, Restaurant, Receipt, Pantry and Expiry modules */
(function () {
  const SHOP_DEMO_MENU = [
    {id:"menu-grilled-chicken",name:"Grilled Chicken Rice Bowl",emoji:"🍗",description:"Grilled chicken, rice, vegetables and light sauce",price:18.90,calories:520,protein:38,carbs:62,fat:12,sugar:6,sodium:690,vegetarian:false,halal:"Confirm with restaurant"},
    {id:"menu-salmon-bowl",name:"Salmon Poke Bowl",emoji:"🍣",description:"Salmon, rice, edamame, cucumber and sesame",price:25.90,calories:560,protein:32,carbs:68,fat:17,sugar:7,sodium:760,vegetarian:false,halal:"Confirm ingredients"},
    {id:"menu-veggie-wrap",name:"Grilled Vegetable Wrap",emoji:"🌯",description:"Mixed vegetables, hummus and wholemeal wrap",price:15.50,calories:410,protein:13,carbs:58,fat:14,sugar:8,sodium:610,vegetarian:true,halal:"Likely; confirm sauce"},
    {id:"menu-fried-burger",name:"Double Fried Chicken Burger",emoji:"🍔",description:"Fried chicken, cheese, mayonnaise and fries",price:24.90,calories:980,protein:42,carbs:92,fat:49,sugar:14,sodium:1680,vegetarian:false,halal:"Confirm with restaurant"},
    {id:"menu-creamy-pasta",name:"Creamy Carbonara Pasta",emoji:"🍝",description:"Cream sauce, cheese and smoked meat",price:22.00,calories:840,protein:28,carbs:91,fat:39,sugar:9,sodium:1420,vegetarian:false,halal:"Status not verified"},
    {id:"menu-fruit-yogurt",name:"Fruit Yogurt Bowl",emoji:"🥣",description:"Yogurt, fruit, oats and nuts",price:13.90,calories:340,protein:16,carbs:45,fat:10,sugar:22,sodium:130,vegetarian:true,halal:"Confirm yogurt certification"},
    {id:"menu-water",name:"Mineral Water",emoji:"💧",description:"Plain bottled water",price:3.00,calories:0,protein:0,carbs:0,fat:0,sugar:0,sodium:5,vegetarian:true,halal:"Generally suitable"},
    {id:"menu-sweet-tea",name:"Iced Lemon Tea",emoji:"🧋",description:"Sweetened iced tea",price:6.90,calories:180,protein:0,carbs:45,fat:0,sugar:42,sodium:35,vegetarian:true,halal:"Confirm ingredients"}
  ];

  const DEMO_RECEIPT_ITEMS = [
    {id:crypto.randomUUID(),name:"Fresh milk",category:"Dairy & Alternatives",price:8.90,selected:true},
    {id:crypto.randomUUID(),name:"Wholemeal bread",category:"Bread & Bakery",price:5.50,selected:true},
    {id:crypto.randomUUID(),name:"Chicken breast",category:"Meat & Poultry",price:16.40,selected:true},
    {id:crypto.randomUUID(),name:"Bananas",category:"Fruits & Berries",price:5.80,selected:true},
    {id:crypto.randomUUID(),name:"Chocolate bar",category:"Chocolate & Candy",price:4.50,selected:true},
    {id:crypto.randomUUID(),name:"Mineral water",category:"Water & Hydration",price:3.20,selected:true}
  ];

  const DEMO_PANTRY_ITEMS = [
    {name:"Eggs",emoji:"🥚",quantity:"6 pieces",days:6},
    {name:"Chicken breast",emoji:"🍗",quantity:"2 pieces",days:2},
    {name:"Tomatoes",emoji:"🍅",quantity:"4 pieces",days:4},
    {name:"Spinach",emoji:"🥬",quantity:"1 bag",days:2},
    {name:"Cooked rice",emoji:"🍚",quantity:"2 portions",days:1},
    {name:"Greek yogurt",emoji:"🥣",quantity:"1 cup",days:5}
  ];

  const PANTRY_RECIPES = [
    {name:"Chicken Spinach Rice Bowl",emoji:"🍚",ingredients:["chicken","spinach","rice"],calories:510,time:"25 min",tip:"Use a measured sauce portion."},
    {name:"Tomato Egg Rice",emoji:"🍳",ingredients:["egg","tomato","rice"],calories:430,time:"15 min",tip:"Add vegetables for more volume."},
    {name:"Greek Yogurt Fruit Bowl",emoji:"🥣",ingredients:["yogurt","banana","fruit"],calories:330,time:"5 min",tip:"Use whole fruit instead of extra syrup."},
    {name:"Chicken Vegetable Omelette",emoji:"🍳",ingredients:["egg","chicken","spinach","tomato"],calories:390,time:"20 min",tip:"Cook with a small amount of oil."},
    {name:"Quick Vegetable Fried Rice",emoji:"🥢",ingredients:["rice","egg","spinach","tomato"],calories:470,time:"15 min",tip:"Use less oil and choose a lower-sodium seasoning."},
    {name:"Pantry Protein Salad",emoji:"🥗",ingredients:["chicken","egg","spinach","tomato"],calories:410,time:"15 min",tip:"Choose a light dressing."}
  ];

  const FALLBACK_RESTAURANTS = [
    {name:"Green Bowl Kitchen",cuisine:"Healthy bowls",distance:0.8,price:18,rating:4.6,tags:["Vegetarian options","High protein"],emoji:"🥗",halal:"Not verified"},
    {name:"Nasi Campur Corner",cuisine:"Malaysian",distance:1.2,price:12,rating:4.4,tags:["Budget friendly","Custom portions"],emoji:"🍛",halal:"Confirm with restaurant"},
    {name:"Grill & Grain",cuisine:"Grilled meals",distance:1.6,price:24,rating:4.5,tags:["High protein","Lower-calorie options"],emoji:"🍗",halal:"Not verified"},
    {name:"Vegan Garden",cuisine:"Plant based",distance:2.1,price:22,rating:4.7,tags:["Vegan","Vegetarian"],emoji:"🌱",halal:"Ingredient-based; not certified"},
    {name:"Sushi Daily",cuisine:"Japanese",distance:2.7,price:28,rating:4.3,tags:["Seafood","Rice bowls"],emoji:"🍣",halal:"Not verified"},
    {name:"Fresh Wrap Express",cuisine:"Wraps & salads",distance:3.0,price:16,rating:4.2,tags:["Vegetarian options","Budget friendly"],emoji:"🌯",halal:"Confirm sauces"}
  ];

  function ensureShopState() {
    state.shop = Object.assign({
      menuResults:[],
      receipts:[],
      pantry:[],
      restaurantResults:[],
      restaurantLocation:"",
      lastCoordinates:null,
      expiryAlerted:{},
      weeklySpendTarget:0
    }, state.shop || {});
    state.shop.menuResults = Array.isArray(state.shop.menuResults) ? state.shop.menuResults : [];
    state.shop.receipts = Array.isArray(state.shop.receipts) ? state.shop.receipts : [];
    state.shop.pantry = Array.isArray(state.shop.pantry) ? state.shop.pantry : [];
    state.shop.restaurantResults = Array.isArray(state.shop.restaurantResults) ? state.shop.restaurantResults : [];
    state.shop.expiryAlerted = state.shop.expiryAlerted || {};
  }

  ensureShopState();

  const legacyPersistV7 = persist;
  persist = function persistV8() {
    localStorage.setItem("makanaiWorldV8", JSON.stringify(state));
    legacyPersistV7();
  };

  function awardShopXP(amount, reason) {
    if (typeof awardXP === "function") awardXP(amount, reason, false);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File could not be read."));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function setupUpload(inputId, previewId, promptId, actionId) {
    const input = $(inputId), preview = $(previewId), prompt = $(promptId), action = $(actionId);
    if (!input) return;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("hidden");
      prompt.classList.add("hidden");
      action.disabled = false;
    });
  }

  function activateShopPanel(panelName) {
    const name = ["menu","finder","receipt","pantry","expiry"].includes(panelName) ? panelName : "menu";
    $$(".shop-panel").forEach(panel => panel.classList.toggle("active", panel.id === `${name}ShopPanel`));
    $$("#shopToolTabs button").forEach(button => button.classList.toggle("active", button.dataset.shopPanel === name));
    renderShop();
    const panel = $(`#${name}ShopPanel`);
    if (panel) {
      panel.classList.remove("shop-panel-enter");
      void panel.offsetWidth;
      panel.classList.add("shop-panel-enter");
    }
  }

  $$("#shopToolTabs button").forEach(button => {
    button.addEventListener("click", () => activateShopPanel(button.dataset.shopPanel));
  });

  $$("[data-shop-tool]").forEach(button => {
    button.addEventListener("click", () => {
      go("shop");
      activateShopPanel(button.dataset.shopTool);
    });
  });

  const legacyGoV7 = go;
  go = function goV8(page) {
    legacyGoV7(page);
    if (page === "shop") renderShop();
    if (page === "more") renderMore();
  };

  function renderMore() {
    const pantryCount = state.shop.pantry.length;
    const expiring = getExpiryGroups().soon.length;
    const subtitle = $(".more-hero p");
    if (subtitle) subtitle.textContent = `${pantryCount} pantry items saved · ${expiring} expiring soon · ${state.shop.receipts.length} receipts stored`;
  }

  function menuChoiceStatus(item) {
    const profile = state.profile || {};
    let score = 100;
    score -= Math.max(0, item.calories - 550) / 7;
    score -= Math.max(0, item.sodium - 800) / 25;
    score -= Math.max(0, item.sugar - 20) * 1.3;
    score += Math.min(16, item.protein / 2.5);
    const text = `${item.name} ${item.description}`.toLowerCase();
    const allergyTerms = String(profile.allergy || "").toLowerCase().split(/[,;/]/).map(x=>x.trim()).filter(Boolean);
    const allergyMatch = allergyTerms.find(term => text.includes(term));
    if (profile.dietStyle === "vegetarian" && !item.vegetarian) score -= 60;
    if (profile.dietStyle === "vegan" && (!item.vegetarian || /yogurt|cheese|milk|egg|chicken|salmon/.test(text))) score -= 75;
    if (profile.dietStyle === "halal" && /carbonara|smoked meat|wine|pork|bacon|ham/.test(text)) score -= 85;
    if (profile.healthFocus === "lower-sugar" && item.sugar > 15) score -= 25;
    if (profile.healthFocus === "lower-sodium" && item.sodium > 800) score -= 25;
    if (profile.healthFocus === "higher-protein") score += item.protein / 2;
    const budget = Number(profile.dailyBudget || 30);
    if (item.price > budget) score -= (item.price - budget) * 2;
    const label = score >= 78 ? "Best Choice" : score >= 50 ? "Moderate" : "Higher Calorie";
    return {score, label, className:score>=78?"best":score>=50?"moderate":"high", allergyMatch};
  }

  function renderMenuProfile() {
    if (!$("#menuProfileSummary")) return;
    const p = state.profile || {};
    $("#menuProfileTitle").textContent = `Best choices for ${p.name || "your profile"}`;
    $("#menuProfileSummary").innerHTML = `
      <div><span>Daily budget</span><b>RM ${Number(p.dailyBudget || 30).toFixed(2)}</b></div>
      <div><span>Diet style</span><b>${String(p.dietStyle || "balanced").replaceAll("-"," ")}</b></div>
      <div><span>Health focus</span><b>${String(p.healthFocus || "general").replaceAll("-"," ")}</b></div>
      <div><span>Allergy warning</span><b>${p.allergy || "None entered"}</b></div>`;
  }

  async function analyseShopImage(mode, file) {
    if (!file) throw new Error("Image missing");
    try {
      const image = await fileToDataUrl(file);
      const response = await fetch("/api/analyze-shop-image", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode,image,profile:state.profile})
      });
      if (!response.ok) throw new Error("AI unavailable");
      return await response.json();
    } catch {
      return null;
    }
  }

  async function analyseMenu() {
    const button = $("#analyseMenuBtn");
    const file = $("#menuImageInput").files?.[0];
    if (!file) return;
    button.disabled = true;
    button.textContent = "Analysing menu…";
    const ai = await analyseShopImage("menu", file);
    const items = Array.isArray(ai?.items) && ai.items.length ? ai.items.map((item,index)=>({
      id:`ai-menu-${Date.now()}-${index}`,
      name:item.name || "Menu item",
      emoji:item.emoji || "🍽️",
      description:item.description || "Menu item detected from photo",
      price:Number(item.price)||0,
      calories:Number(item.calories)||450,
      protein:Number(item.protein)||15,
      carbs:Number(item.carbs)||45,
      fat:Number(item.fat)||16,
      sugar:Number(item.sugar)||6,
      sodium:Number(item.sodium)||650,
      vegetarian:Boolean(item.vegetarian),
      halal:item.halal || "Not verified"
    })) : SHOP_DEMO_MENU.map(item=>({...item}));
    state.shop.menuResults = items;
    persist();
    renderMenuResults();
    $("#menuScanResults").classList.remove("hidden");
    button.disabled = false;
    button.textContent = "Analyse Menu Choices";
    awardShopXP(20, "Menu scanned");
    toast(ai ? "Menu analysed with AI" : "Demo menu analysis ready");
  }

  function renderMenuResults() {
    const items = state.shop.menuResults || [];
    if (!$("#menuChoiceGrid")) return;
    if (items.length) $("#menuScanResults")?.classList.remove("hidden");
    const sorted = items.map(item=>({...item,status:menuChoiceStatus(item)})).sort((a,b)=>b.status.score-a.status.score);
    $("#menuChoiceGrid").innerHTML = sorted.length ? sorted.map(item=>`
      <article class="menu-choice-card ${item.status.className}">
        <div class="menu-choice-top">
          <div class="menu-choice-emoji">${item.emoji}</div>
          <div><span class="choice-label ${item.status.className}">${item.status.label}</span><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.description)}</p></div>
          <strong>RM ${Number(item.price).toFixed(2)}</strong>
        </div>
        <div class="menu-nutrition">
          <span><b>${Math.round(item.calories)}</b> kcal</span>
          <span><b>${Math.round(item.protein)}</b> protein</span>
          <span><b>${Math.round(item.sugar)}</b> sugar</span>
          <span><b>${Math.round(item.sodium)}</b> sodium</span>
        </div>
        <div class="menu-flags">
          <span>${item.vegetarian ? "🌱 Vegetarian" : "🍗 Contains animal protein"}</span>
          <span>🕌 ${escapeHTML(item.halal || "Not verified")}</span>
          ${item.status.allergyMatch ? `<span class="danger-flag">⚠ Possible ${escapeHTML(item.status.allergyMatch)}</span>` : ""}
        </div>
        <div class="menu-card-actions">
          <button class="soft" data-log-menu="${item.id}">Add to diary</button>
          <button class="link" data-swap-menu="${item.id}">Compare healthier</button>
        </div>
      </article>`).join("") : `<div class="empty">Scan a menu to compare restaurant choices.</div>`;
    $$("[data-log-menu]").forEach(button=>button.addEventListener("click",()=>logMenuItem(button.dataset.logMenu)));
    $$("[data-swap-menu]").forEach(button=>button.addEventListener("click",()=>showMenuSwap(button.dataset.swapMenu)));
  }

  function logMenuItem(id) {
    const item = state.shop.menuResults.find(x=>x.id===id);
    if (!item) return;
    state.meals.push({
      id:`restaurant-${id}`,name:item.name,category:"Restaurant Meal",country:"Restaurant",
      region:"Shop & Dine",emoji:item.emoji,serving:"1 menu serving",calories:item.calories,
      protein:item.protein,carbs:item.carbs,fat:item.fat,sugar:item.sugar,sodium:item.sodium,
      logId:crypto.randomUUID(),date:dayKey(),mealType:"Lunch",portion:1,portionLabel:"1 serving"
    });
    awardShopXP(15,"Restaurant meal logged");
    save(`${item.name} added to diary`);
  }

  function showMenuSwap(id) {
    const current = state.shop.menuResults.find(x=>x.id===id);
    if (!current) return;
    const alternatives = state.shop.menuResults
      .filter(x=>x.id!==id)
      .map(x=>({...x,status:menuChoiceStatus(x)}))
      .filter(x=>x.status.score > menuChoiceStatus(current).score)
      .sort((a,b)=>b.status.score-a.status.score);
    const best = alternatives[0];
    if (!best) return toast("This is already one of the better menu choices");
    const savedCalories = Math.max(0,current.calories-best.calories);
    const savedSugar = Math.max(0,current.sugar-best.sugar);
    toast(`${best.name}: save about ${savedCalories} kcal and ${savedSugar} g sugar`);
  }

  function getCoordinates() {
    return new Promise((resolve,reject)=>{
      if (!navigator.geolocation) return reject(new Error("Location not supported"));
      navigator.geolocation.getCurrentPosition(
        position=>resolve({lat:position.coords.latitude,lon:position.coords.longitude}),
        error=>reject(error),
        {enableHighAccuracy:true,timeout:12000,maximumAge:300000}
      );
    });
  }

  async function useRestaurantLocation() {
    const button=$("#useRestaurantLocation");
    button.disabled=true;button.textContent="Locating…";
    try {
      const coords=await getCoordinates();
      state.shop.lastCoordinates=coords;
      state.shop.restaurantLocation="Current location";
      $("#restaurantLocation").value="Current location";
      $("#restaurantLocationStatus").textContent=`Location ready: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}. Exact address is not stored.`;
      persist();
    } catch {
      toast("Location permission was not available. Enter a city manually.");
    } finally {
      button.disabled=false;button.textContent="Use my location";
    }
  }

  function filterFallbackRestaurants(items) {
    const budget=Number($("#restaurantBudget").value||25);
    const pref=$("#restaurantPreference").value;
    return items.filter(item=>item.price<=budget || budget>=80).filter(item=>{
      const text=`${item.cuisine} ${(item.tags||[]).join(" ")} ${item.halal||""}`.toLowerCase();
      if (pref==="halal") return text.includes("halal") || text.includes("malaysian");
      if (pref==="vegetarian") return text.includes("vegetarian") || text.includes("vegan");
      if (pref==="vegan") return text.includes("vegan");
      if (pref==="protein") return text.includes("protein") || text.includes("grill");
      if (pref==="lower-calorie") return text.includes("lower-calorie") || text.includes("salad") || text.includes("healthy");
      return true;
    });
  }

  async function findRestaurants() {
    const button=$("#findRestaurantsBtn");
    const location=$("#restaurantLocation").value.trim();
    const coords=state.shop.lastCoordinates;
    if (!location && !coords) return toast("Enter a city or use your phone location");
    button.disabled=true;button.textContent="Searching…";
    let results=[];
    try {
      const params=new URLSearchParams({
        radius:$("#restaurantRadius").value,
        query:location && location!=="Current location" ? location : "",
        preference:$("#restaurantPreference").value
      });
      if (coords) { params.set("lat",coords.lat);params.set("lon",coords.lon); }
      const response=await fetch(`/api/nearby-restaurants?${params}`);
      if (!response.ok) throw new Error();
      const data=await response.json();
      results=(data.restaurants||[]).map((item,index)=>({
        id:item.id||`restaurant-${index}`,name:item.name||"Nearby restaurant",
        cuisine:item.cuisine||"Restaurant",distance:Number(item.distance)||0,
        price:Number(item.price)||Number($("#restaurantBudget").value)*.7,
        rating:Number(item.rating)||4.2,tags:item.tags||[],emoji:item.emoji||"🍽️",
        halal:item.halal||"Not verified",address:item.address||""
      }));
    } catch {
      results=filterFallbackRestaurants(FALLBACK_RESTAURANTS).map(item=>({...item,id:crypto.randomUUID()}));
    }
    state.shop.restaurantResults=results;
    state.shop.restaurantLocation=location||"Current location";
    persist();renderRestaurantResults();
    button.disabled=false;button.textContent="Find Restaurants";
    awardShopXP(8,"Restaurant finder used");
    toast(results.length?"Restaurant suggestions ready":"No matching restaurants found");
  }

  function renderRestaurantResults() {
    if (!$("#restaurantResults")) return;
    const items=state.shop.restaurantResults||[];
    $("#restaurantResults").innerHTML=items.length?`
      <div class="title compact"><div><small>NEARBY MATCHES</small><h3>${items.length} restaurant suggestions</h3></div><span>${escapeHTML(state.shop.restaurantLocation||"")}</span></div>
      <div class="restaurant-grid">${items.map((item,index)=>`
        <article class="restaurant-card">
          <div class="restaurant-card-top"><div class="restaurant-emoji">${item.emoji}</div><div><span>#${index+1} match</span><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.cuisine)}${item.address?` · ${escapeHTML(item.address)}`:""}</p></div><strong>★ ${Number(item.rating||4.2).toFixed(1)}</strong></div>
          <div class="restaurant-meta"><span>📍 ${Number(item.distance||0).toFixed(1)} km</span><span>💰 ~RM ${Number(item.price||0).toFixed(0)}</span><span>🕌 ${escapeHTML(item.halal||"Not verified")}</span></div>
          <div class="tag-row">${(item.tags||[]).map(tag=>`<span>${escapeHTML(tag)}</span>`).join("")}</div>
          <button class="soft full" data-open-restaurant-menu="${item.id}">View healthy menu ideas</button>
        </article>`).join("")}</div>`:`<div class="empty">Search your area to find restaurant suggestions.</div>`;
    $$("[data-open-restaurant-menu]").forEach(button=>button.addEventListener("click",()=>{
      activateShopPanel("menu");
      state.shop.menuResults=SHOP_DEMO_MENU.map(x=>({...x}));
      persist();renderMenuResults();$("#menuScanResults").classList.remove("hidden");
      toast("Sample healthy menu choices opened");
    }));
  }

  function renderReceiptDraft(items) {
    state.shop.receiptDraft=items.map(item=>({...item}));
    $("#receiptResults").classList.remove("hidden");
    const total=items.reduce((sum,item)=>sum+Number(item.price||0),0);
    $("#receiptTotal").textContent=`RM ${total.toFixed(2)}`;
    $("#receiptItemList").innerHTML=items.map(item=>`
      <label class="receipt-row">
        <input type="checkbox" data-receipt-select="${item.id}" ${item.selected?"checked":""}>
        <span class="receipt-category-icon">${categoryEmoji(item.category)}</span>
        <div><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.category)}</small></div>
        <strong>RM ${Number(item.price).toFixed(2)}</strong>
      </label>`).join("");
    $$("[data-receipt-select]").forEach(input=>input.addEventListener("change",()=>{
      const item=state.shop.receiptDraft.find(x=>x.id===input.dataset.receiptSelect);
      if(item)item.selected=input.checked;
    }));
  }

  function categoryEmoji(category="") {
    if (/Fruit/.test(category)) return "🍎";
    if (/Dairy/.test(category)) return "🥛";
    if (/Meat|Poultry/.test(category)) return "🍗";
    if (/Chocolate|Candy/.test(category)) return "🍫";
    if (/Water|Drink/.test(category)) return "💧";
    if (/Bread|Bakery/.test(category)) return "🍞";
    return "🛒";
  }

  async function analyseReceipt() {
    const button=$("#analyseReceiptBtn"),file=$("#receiptImageInput").files?.[0];
    if(!file)return;
    button.disabled=true;button.textContent="Reading receipt…";
    const ai=await analyseShopImage("receipt",file);
    const items=Array.isArray(ai?.items)&&ai.items.length?ai.items.map((item,index)=>({
      id:crypto.randomUUID(),name:item.name||`Receipt item ${index+1}`,
      category:item.category||"Groceries",price:Number(item.price)||0,selected:true
    })):DEMO_RECEIPT_ITEMS.map(item=>({...item,id:crypto.randomUUID()}));
    renderReceiptDraft(items);
    button.disabled=false;button.textContent="Scan Receipt";
    awardShopXP(18,"Receipt scanned");
    toast(ai?"Receipt extracted with AI":"Demo receipt extraction ready");
  }

  function saveReceipt() {
    const items=(state.shop.receiptDraft||[]).filter(item=>item.selected);
    if(!items.length)return toast("Select at least one receipt item");
    const total=items.reduce((sum,item)=>sum+Number(item.price||0),0);
    state.shop.receipts.unshift({
      id:crypto.randomUUID(),date:new Date().toISOString(),store:"Scanned grocery receipt",items,total
    });
    state.shop.receipts=state.shop.receipts.slice(0,30);
    awardShopXP(12,"Receipt saved");
    save("Receipt saved");
  }

  function receiptToGrocery() {
    const items=(state.shop.receiptDraft||[]).filter(item=>item.selected);
    items.forEach(item=>{
      if(!state.grocery.some(g=>g.name.toLowerCase()===item.name.toLowerCase())){
        state.grocery.push({id:crypto.randomUUID(),name:item.name,done:false});
      }
    });
    awardShopXP(8,"Receipt organised");
    save("Receipt items added to grocery list");
  }

  function weeklyReceiptSpend() {
    const cutoff=Date.now()-7*86400000;
    return state.shop.receipts.filter(r=>new Date(r.date).getTime()>=cutoff).reduce((sum,r)=>sum+Number(r.total||0),0);
  }

  function renderReceiptHistory() {
    const receipts=state.shop.receipts||[];
    if($("#weeklySpendValue")){
      const spend=weeklyReceiptSpend(),weeklyBudget=Number(state.profile.dailyBudget||30)*7;
      $("#weeklySpendValue").textContent=`RM ${spend.toFixed(2)}`;
      $("#weeklySpendBar").style.width=`${Math.min(100,spend/Math.max(1,weeklyBudget)*100)}%`;
      $("#weeklySpendText").textContent=`Weekly budget estimate: RM ${weeklyBudget.toFixed(2)}`;
    }
    if(!$("#receiptHistory"))return;
    $("#receiptHistory").innerHTML=receipts.length?receipts.map(receipt=>`
      <article class="receipt-history-row"><div><span>🧾</span><div><b>${escapeHTML(receipt.store)}</b><small>${new Date(receipt.date).toLocaleDateString()} · ${receipt.items.length} items</small></div></div><strong>RM ${Number(receipt.total).toFixed(2)}</strong></article>`).join(""):`<div class="empty">No receipts saved yet.</div>`;
  }

  function expiryDateFromDays(days) {
    const date=new Date();date.setDate(date.getDate()+days);return dayKey(date);
  }

  async function analysePantry() {
    const button=$("#analysePantryBtn"),file=$("#pantryImageInput").files?.[0];
    if(!file)return;
    button.disabled=true;button.textContent="Recognising ingredients…";
    const ai=await analyseShopImage("pantry",file);
    const items=Array.isArray(ai?.items)&&ai.items.length?ai.items.map(item=>({
      id:crypto.randomUUID(),name:item.name||"Ingredient",emoji:item.emoji||"🥬",
      quantity:item.quantity||"1 item",expiry:item.expiry||expiryDateFromDays(5),addedAt:new Date().toISOString()
    })):DEMO_PANTRY_ITEMS.map(item=>({
      id:crypto.randomUUID(),name:item.name,emoji:item.emoji,quantity:item.quantity,
      expiry:expiryDateFromDays(item.days),addedAt:new Date().toISOString()
    }));
    items.forEach(item=>{
      const existing=state.shop.pantry.find(x=>x.name.toLowerCase()===item.name.toLowerCase());
      if(existing){existing.quantity=item.quantity;existing.expiry=item.expiry;}
      else state.shop.pantry.push(item);
    });
    button.disabled=false;button.textContent="Recognise Ingredients";
    awardShopXP(22,"Pantry scanned");
    save("Pantry ingredients recognised");
    activateShopPanel("pantry");
  }

  function addPantryManual(event) {
    event.preventDefault();
    const name=$("#pantryManualName").value.trim();
    if(!name)return;
    state.shop.pantry.push({
      id:crypto.randomUUID(),name,emoji:"🥫",
      quantity:$("#pantryManualQty").value.trim()||"1 item",
      expiry:$("#pantryManualExpiry").value||expiryDateFromDays(7),
      addedAt:new Date().toISOString()
    });
    event.target.reset();
    awardShopXP(5,"Pantry item added");
    save(`${name} added to pantry`);
  }

  function daysUntil(dateString) {
    if(!dateString)return 999;
    const todayDate=new Date(`${dayKey()}T00:00:00`);
    const target=new Date(`${dateString}T00:00:00`);
    return Math.round((target-todayDate)/86400000);
  }

  function getExpiryGroups() {
    const sorted=[...(state.shop.pantry||[])].sort((a,b)=>daysUntil(a.expiry)-daysUntil(b.expiry));
    return {
      expired:sorted.filter(item=>daysUntil(item.expiry)<0),
      soon:sorted.filter(item=>daysUntil(item.expiry)>=0&&daysUntil(item.expiry)<=3),
      fresh:sorted.filter(item=>daysUntil(item.expiry)>3)
    };
  }

  function expiryLabel(item) {
    const days=daysUntil(item.expiry);
    if(days<0)return {label:`Expired ${Math.abs(days)} day${Math.abs(days)===1?"":"s"} ago`,className:"expired"};
    if(days===0)return {label:"Expires today",className:"urgent"};
    if(days===1)return {label:"Expires tomorrow",className:"soon"};
    if(days<=3)return {label:`Expires in ${days} days`,className:"soon"};
    return {label:`Fresh for ${days} days`,className:"fresh"};
  }

  function renderPantry() {
    const items=state.shop.pantry||[];
    if($("#pantryCountHero"))$("#pantryCountHero").textContent=items.length;
    if(!$("#pantryInventory"))return;
    $("#pantryInventory").innerHTML=items.length?items.map(item=>{
      const expiry=expiryLabel(item);
      return `<article class="pantry-row ${expiry.className}">
        <div class="pantry-emoji">${item.emoji||"🥫"}</div>
        <div><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.quantity||"1 item")} · ${escapeHTML(expiry.label)}</small></div>
        <input type="date" data-pantry-expiry="${item.id}" value="${item.expiry||""}">
        <button class="remove" data-remove-pantry="${item.id}">×</button>
      </article>`;
    }).join(""):`<div class="empty">Your pantry is empty. Scan your fridge or add an item manually.</div>`;
    $$("[data-remove-pantry]").forEach(button=>button.addEventListener("click",()=>{
      state.shop.pantry=state.shop.pantry.filter(x=>x.id!==button.dataset.removePantry);
      save("Pantry item removed");
    }));
    $$("[data-pantry-expiry]").forEach(input=>input.addEventListener("change",()=>{
      const item=state.shop.pantry.find(x=>x.id===input.dataset.pantryExpiry);
      if(item){item.expiry=input.value;save("Expiry date updated");}
    }));
  }

  function pantryMatches(recipe) {
    const available=state.shop.pantry.map(item=>item.name.toLowerCase());
    const matches=recipe.ingredients.filter(ingredient=>available.some(item=>item.includes(ingredient)||ingredient.includes(item)));
    return {...recipe,matches,score:matches.length/recipe.ingredients.length};
  }

  function renderPantryRecipes() {
    if(!$("#pantryRecipeResults"))return;
    const recipes=PANTRY_RECIPES.map(pantryMatches).sort((a,b)=>b.score-a.score).slice(0,4);
    $("#pantryRecipeResults").innerHTML=state.shop.pantry.length?recipes.map(recipe=>`
      <article class="pantry-recipe">
        <div class="pantry-recipe-top"><span>${recipe.emoji}</span><div><b>${recipe.name}</b><small>${recipe.time} · ${recipe.calories} kcal</small></div><strong>${Math.round(recipe.score*100)}% match</strong></div>
        <div class="recipe-ingredient-tags">${recipe.ingredients.map(ingredient=>`<span class="${recipe.matches.includes(ingredient)?"have":"need"}">${recipe.matches.includes(ingredient)?"✓":"+"} ${ingredient}</span>`).join("")}</div>
        <p>${recipe.tip}</p>
        <button class="soft full" data-add-missing="${recipe.name}">Add missing ingredients</button>
      </article>`).join(""):`<div class="empty">Add pantry items to receive recipe suggestions.</div>`;
    $$("[data-add-missing]").forEach(button=>button.addEventListener("click",()=>{
      const recipe=recipes.find(x=>x.name===button.dataset.addMissing);
      const missing=recipe.ingredients.filter(x=>!recipe.matches.includes(x));
      missing.forEach(name=>{
        if(!state.grocery.some(g=>g.name.toLowerCase()===name.toLowerCase()))state.grocery.push({id:crypto.randomUUID(),name,done:false});
      });
      save("Missing ingredients added to grocery list");
    }));
  }

  function renderExpiry() {
    const groups=getExpiryGroups();
    if($("#expiringSoonCount"))$("#expiringSoonCount").textContent=groups.soon.length;
    if($("#expiredCount"))$("#expiredCount").textContent=groups.expired.length;
    if($("#freshCount"))$("#freshCount").textContent=groups.fresh.length;
    if(!$("#expiryTimeline"))return;
    const items=[...groups.expired,...groups.soon,...groups.fresh];
    $("#expiryTimeline").innerHTML=items.length?items.map(item=>{
      const status=expiryLabel(item);
      return `<article class="expiry-row ${status.className}">
        <div class="expiry-date"><b>${new Date(`${item.expiry}T00:00:00`).getDate()}</b><span>${new Date(`${item.expiry}T00:00:00`).toLocaleDateString(undefined,{month:"short"})}</span></div>
        <div><b>${item.emoji||"🥫"} ${escapeHTML(item.name)}</b><small>${escapeHTML(item.quantity||"1 item")} · ${escapeHTML(status.label)}</small></div>
        <button class="soft" data-use-expiring="${item.id}">Use it</button>
      </article>`;
    }).join(""):`<div class="empty">Add pantry items with expiry dates to build your timeline.</div>`;
    $$("[data-use-expiring]").forEach(button=>button.addEventListener("click",()=>{
      activateShopPanel("pantry");
      $("#pantryShopPanel").scrollIntoView({behavior:"smooth"});
      toast("Recipe suggestions prioritise your pantry ingredients");
    }));
  }

  async function enableExpiryNotifications() {
    if(!("Notification" in window))return toast("Notifications are unavailable in this browser");
    const permission=await Notification.requestPermission();
    toast(permission==="granted"?"Expiry alerts enabled":"Notification permission was not granted");
  }

  function checkExpiryNotifications() {
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    getExpiryGroups().soon.forEach(item=>{
      const key=`${dayKey()}-${item.id}`;
      if(state.shop.expiryAlerted[key])return;
      state.shop.expiryAlerted[key]=true;
      new Notification("Food expiry reminder",{body:`${item.name}: ${expiryLabel(item).label}. Use it in a meal soon.`,icon:"icon-192.png"});
    });
    persist();
  }

  function renderShop() {
    ensureShopState();
    renderMenuProfile();
    renderMenuResults();
    renderRestaurantResults();
    renderReceiptHistory();
    renderPantry();
    renderPantryRecipes();
    renderExpiry();
    renderMore();
  }

  setupUpload("#menuImageInput","#menuImagePreview","#menuUploadPrompt","#analyseMenuBtn");
  setupUpload("#receiptImageInput","#receiptImagePreview","#receiptUploadPrompt","#analyseReceiptBtn");
  setupUpload("#pantryImageInput","#pantryImagePreview","#pantryUploadPrompt","#analysePantryBtn");

  $("#analyseMenuBtn")?.addEventListener("click",analyseMenu);
  $("#clearMenuResults")?.addEventListener("click",()=>{
    state.shop.menuResults=[];persist();renderMenuResults();$("#menuScanResults").classList.add("hidden");
  });
  $("#useRestaurantLocation")?.addEventListener("click",useRestaurantLocation);
  $("#findRestaurantsBtn")?.addEventListener("click",findRestaurants);
  $("#analyseReceiptBtn")?.addEventListener("click",analyseReceipt);
  $("#saveReceiptBtn")?.addEventListener("click",saveReceipt);
  $("#receiptToGrocery")?.addEventListener("click",receiptToGrocery);
  $("#clearReceipts")?.addEventListener("click",()=>{
    state.shop.receipts=[];persist();renderReceiptHistory();toast("Receipt history cleared");
  });
  $("#analysePantryBtn")?.addEventListener("click",analysePantry);
  $("#pantryManualForm")?.addEventListener("submit",addPantryManual);
  $("#clearPantry")?.addEventListener("click",()=>{
    state.shop.pantry=[];persist();renderShop();toast("Pantry cleared");
  });
  $("#refreshPantryRecipes")?.addEventListener("click",()=>{
    renderPantryRecipes();toast("Recipe suggestions refreshed");
  });
  $("#requestExpiryNotifications")?.addEventListener("click",enableExpiryNotifications);

  renderShop();
  setInterval(checkExpiryNotifications,60000);
})();
