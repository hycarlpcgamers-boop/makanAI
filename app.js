const foods = [
  {id:1,name:"Nasi Lemak",category:"Rice",serving:"1 packet",calories:520,protein:13,carbs:70,fat:22,emoji:"🍛"},
  {id:2,name:"Nasi Ayam",category:"Rice",serving:"1 plate",calories:600,protein:28,carbs:74,fat:20,emoji:"🍗"},
  {id:3,name:"Nasi Kerabu",category:"Rice",serving:"1 plate",calories:560,protein:24,carbs:72,fat:18,emoji:"🍚"},
  {id:4,name:"Mee Goreng Mamak",category:"Noodles",serving:"1 plate",calories:610,protein:18,carbs:84,fat:23,emoji:"🍜"},
  {id:5,name:"Char Kuey Teow",category:"Noodles",serving:"1 plate",calories:740,protein:23,carbs:86,fat:34,emoji:"🥢"},
  {id:6,name:"Laksa",category:"Noodles",serving:"1 bowl",calories:520,protein:17,carbs:65,fat:21,emoji:"🍲"},
  {id:7,name:"Roti Canai",category:"Snacks",serving:"1 piece",calories:300,protein:6,carbs:45,fat:11,emoji:"🫓"},
  {id:8,name:"Karipap",category:"Snacks",serving:"1 piece",calories:180,protein:4,carbs:23,fat:8,emoji:"🥟"},
  {id:9,name:"Pisang Goreng",category:"Snacks",serving:"3 pieces",calories:290,protein:3,carbs:46,fat:11,emoji:"🍌"},
  {id:10,name:"Teh Tarik",category:"Drinks",serving:"1 glass",calories:190,protein:5,carbs:33,fat:5,emoji:"🥤"},
  {id:11,name:"Milo Ais",category:"Drinks",serving:"1 glass",calories:250,protein:7,carbs:43,fat:6,emoji:"🧋"},
  {id:12,name:"Kopi O Kosong",category:"Drinks",serving:"1 cup",calories:8,protein:0,carbs:2,fat:0,emoji:"☕"}
];

let state = JSON.parse(localStorage.getItem("makanaiState")) || {
  target: 2000,
  meals: [],
  profile: {}
};

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

function save() {
  localStorage.setItem("makanaiState", JSON.stringify(state));
  renderDashboard();
}

function toast(message) {
  const el = qs("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function goTo(page) {
  qsa(".page").forEach(p => p.classList.toggle("active", p.id === page));
  qsa(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  window.scrollTo({top:0, behavior:"smooth"});
}

qsa(".nav-item").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.page)));
qsa("[data-go]").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.go)));

function totals() {
  return state.meals.reduce((a,m) => {
    a.calories += m.calories; a.protein += m.protein; a.carbs += m.carbs; a.fat += m.fat; return a;
  }, {calories:0,protein:0,carbs:0,fat:0});
}

function renderDashboard() {
  const t = totals();
  const remaining = Math.max(0, state.target - t.calories);
  qs("#remainingCalories").textContent = remaining;
  qs("#consumedCalories").textContent = `${t.calories} kcal`;
  qs("#proteinTotal").textContent = `${t.protein} g`;
  qs("#carbTotal").textContent = `${t.carbs} g`;
  qs("#fatTotal").textContent = `${t.fat} g`;
  qs("#dailyTarget").textContent = `${state.target} kcal`;

  const deg = Math.min(360, Math.round((t.calories / state.target) * 360));
  qs("#calorieRing").style.background = `conic-gradient(#86efac ${deg}deg, rgba(255,255,255,.18) ${deg}deg)`;

  const list = qs("#mealList");
  if (!state.meals.length) {
    list.innerHTML = `<div class="empty-state">No meals logged yet. Add your first Malaysian meal.</div>`;
  } else {
    list.innerHTML = state.meals.map((m,i) => `
      <div class="meal-item">
        <div class="food-meta">
          <div class="food-emoji">${m.emoji}</div>
          <div><strong>${m.name}</strong><span>${m.serving} · ${m.calories} kcal</span></div>
        </div>
        <button class="icon-btn" data-remove="${i}" aria-label="Remove meal">×</button>
      </div>`).join("");
    qsa("[data-remove]").forEach(btn => btn.addEventListener("click", () => {
      state.meals.splice(Number(btn.dataset.remove),1); save(); toast("Meal removed");
    }));
  }
}

let activeFilter = "all";
function renderFoods() {
  const term = qs("#foodSearch").value.toLowerCase();
  const filtered = foods.filter(f =>
    (activeFilter === "all" || f.category === activeFilter) &&
    f.name.toLowerCase().includes(term)
  );
  qs("#foodGrid").innerHTML = filtered.map(f => `
    <article class="food-card">
      <div class="food-emoji">${f.emoji}</div>
      <h4>${f.name}</h4>
      <p>${f.serving} · ${f.calories} kcal<br>${f.protein}g protein · ${f.carbs}g carbs · ${f.fat}g fat</p>
      <button class="add-btn" data-add="${f.id}">Add to today</button>
    </article>`).join("") || `<div class="empty-state">No matching food found.</div>`;

  qsa("[data-add]").forEach(btn => btn.addEventListener("click", () => addFood(Number(btn.dataset.add))));
}

function addFood(id) {
  const food = foods.find(f => f.id === id);
  state.meals.push({...food, loggedAt: Date.now()});
  save();
  toast(`${food.name} added`);
}

qs("#foodSearch").addEventListener("input", renderFoods);
qsa(".filter").forEach(btn => btn.addEventListener("click", () => {
  activeFilter = btn.dataset.filter;
  qsa(".filter").forEach(b => b.classList.toggle("active", b === btn));
  renderFoods();
}));

qs("#profileForm").addEventListener("submit", e => {
  e.preventDefault();
  const age = +qs("#age").value;
  const height = +qs("#height").value;
  const weight = +qs("#weight").value;
  const gender = qs("#gender").value;
  const activity = +qs("#activity").value;
  const goal = +qs("#goal").value;

  const bmr = gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  state.target = Math.max(1200, Math.round((bmr * activity + goal) / 10) * 10);
  state.profile = {
    name: qs("#name").value, age, height, weight, gender, activity, goal
  };
  save();
  toast("Daily target updated");
});

function loadProfile() {
  const p = state.profile;
  if (!p || !Object.keys(p).length) return;
  qs("#name").value = p.name || "";
  qs("#age").value = p.age || 22;
  qs("#height").value = p.height || 170;
  qs("#weight").value = p.weight || 70;
  qs("#gender").value = p.gender || "male";
  qs("#activity").value = p.activity || "1.55";
  qs("#goal").value = p.goal ?? "0";
}

qs("#foodImage").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  qs("#previewImage").src = url;
  qs("#previewImage").classList.remove("hidden");
  qs("#uploadPrompt").classList.add("hidden");
  qs("#analyzeBtn").disabled = false;
  qs("#scanResults").classList.add("hidden");
});

qs("#analyzeBtn").addEventListener("click", () => {
  qs("#analyzeBtn").textContent = "Analysing...";
  qs("#analyzeBtn").disabled = true;
  setTimeout(() => {
    const picks = [foods[0], foods[1], foods[3]];
    qs("#suggestions").innerHTML = picks.map((f,i) => `
      <div class="suggestion-item">
        <div class="food-meta">
          <div class="food-emoji">${f.emoji}</div>
          <div><strong>${f.name}</strong><span>${f.calories} kcal · ${[86,73,61][i]}% match</span></div>
        </div>
        <button class="add-btn" style="width:auto" data-scan-add="${f.id}">Choose</button>
      </div>`).join("");
    qs("#scanResults").classList.remove("hidden");
    qs("#analyzeBtn").textContent = "Analyse Food";
    qs("#analyzeBtn").disabled = false;
    qsa("[data-scan-add]").forEach(btn => btn.addEventListener("click", () => {
      addFood(Number(btn.dataset.scanAdd));
      goTo("home");
    }));
  }, 900);
});

qs("#clearDataBtn").addEventListener("click", () => {
  if (!confirm("Clear all saved meals and profile data?")) return;
  localStorage.removeItem("makanaiState");
  state = {target:2000, meals:[], profile:{}};
  loadProfile(); renderDashboard(); toast("App data cleared");
});

let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  qs("#installBtn").classList.remove("hidden");
});
qs("#installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  qs("#installBtn").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

loadProfile();
renderFoods();
renderDashboard();
