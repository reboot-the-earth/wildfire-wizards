const priorityRules = {
  horses: { rank: 1, label: "horses", loadTime: 15, capacity: 4, handling: "Load individually or in pairs. Never rush.", reason: "Highest priority: stress-sensitive and slow to load." },
  cattle_calves: { rank: 2, label: "cow-calf pairs", loadTime: 5, capacity: 10, handling: "Keep calves with mothers. Load as pairs.", reason: "Young animals are vulnerable and must stay with mothers." },
  cattle: { rank: 3, label: "cattle", loadTime: 3, capacity: 20, handling: "Load in groups. Use chute if available.", reason: "Bulk evacuation after vulnerable animals." },
  goats: { rank: 4, label: "goats", loadTime: 2, capacity: 40, handling: "Use a lead animal. Secure gates and trailer gaps.", reason: "Small ruminants load quickly once contained." },
  sheep: { rank: 4, label: "sheep", loadTime: 2, capacity: 40, handling: "Use a lead animal. Keep flock together.", reason: "Small ruminants load quickly once contained." },
  poultry: { rank: 5, label: "poultry", loadTime: 0.5, capacity: 200, handling: "Use crates. Prioritize breeding stock.", reason: "Lowest transport priority unless breeding stock is at risk." }
};

const trailerDefaults = {
  stock_trailer: { horses: 4, cattle_calves: 10, cattle: 20, goats: 30, sheep: 30, poultry: 100 },
  horse_trailer: { horses: 4, cattle_calves: 0, cattle: 0, goats: 12, sheep: 12, poultry: 60 },
  livestock_trailer: { horses: 4, cattle_calves: 10, cattle: 20, goats: 40, sheep: 40, poultry: 120 },
  flatbed: { horses: 0, cattle_calves: 0, cattle: 0, goats: 12, sheep: 12, poultry: 80 }
};

const demoProfiles = [
  {
    id: "valley_center_ranch",
    name: "Valley Center Ranch",
    address: "28500 Valley Center Rd, Valley Center, CA",
    lat: 33.22,
    lon: -117.03,
    timeAvailableHours: 3.7,
    animals: [
      { species: "cattle", count: 150, specialNeeds: ["12 calves with mothers", "2 bulls separate"] },
      { species: "horses", count: 8, specialNeeds: ["2 pregnant mares", "1 foal"] }
    ],
    transport: { trailers: 1, type: "stock_trailer" }
  },
  {
    id: "fallbrook_equestrian_center",
    name: "Fallbrook Equestrian Center",
    address: "1200 S Mission Rd, Fallbrook, CA",
    lat: 33.37,
    lon: -117.25,
    timeAvailableHours: 4.2,
    animals: [{ species: "horses", count: 24, specialNeeds: ["3 senior horses", "2 miniatures"] }],
    transport: { trailers: 2, type: "horse_trailer" }
  },
  {
    id: "ramona_heritage_goat_farm",
    name: "Ramona Heritage Goat Farm",
    address: "16800 Mussey Grade Rd, Ramona, CA",
    lat: 33.05,
    lon: -116.87,
    timeAvailableHours: 2.5,
    animals: [
      { species: "goats", count: 85, specialNeeds: ["15 does with kids"] },
      { species: "poultry", count: 200, specialNeeds: ["free-range flock"] }
    ],
    transport: { trailers: 1, type: "livestock_trailer" }
  }
];

const state = {
  farm: { id: "valley_center_ranch", name: "Valley Center Ranch", address: "28500 Valley Center Rd, Valley Center, CA", lat: 33.22, lon: -117.03 },
  animals: structuredClone(demoProfiles[0].animals),
  transport: { trailers: 1, type: "stock_trailer" },
  timeAvailableHours: 3.7,
  smokeClose: false
};

const screens = ["map", "animals", "transport", "plan"];

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  document.querySelector(`#screen-${name}`).classList.add("active");
  document.querySelectorAll(".step").forEach((step) => step.classList.toggle("active", step.dataset.screen === name));
  if (name === "plan") renderPlan();
}

function renderAnimalRows() {
  const list = document.querySelector("#animal-list");
  list.innerHTML = "";
  state.animals.forEach((animal, index) => {
    const row = document.createElement("div");
    row.className = "animal-row";
    row.innerHTML = `
      <label class="field">
        <span>Species</span>
        <select data-animal-field="species" data-index="${index}">
          ${["horses", "cattle", "goats", "sheep", "poultry"].map((species) => `<option value="${species}" ${animal.species === species ? "selected" : ""}>${species.replace("_", " ")}</option>`).join("")}
        </select>
      </label>
      <label class="field count-field">
        <span>Count</span>
        <input data-animal-field="count" data-index="${index}" type="number" min="1" value="${animal.count}">
      </label>
      <label class="field">
        <span>Special needs</span>
        <input data-animal-field="specialNeeds" data-index="${index}" type="text" value="${(animal.specialNeeds || []).join(", ")}">
      </label>
      <button class="remove" data-remove="${index}" type="button">Remove</button>
    `;
    list.append(row);
  });
}

function syncAnimalsFromInputs(event) {
  const field = event.target.dataset.animalField;
  if (!field) return;
  const index = Number(event.target.dataset.index);
  if (field === "count") {
    state.animals[index].count = Number(event.target.value);
  } else if (field === "specialNeeds") {
    state.animals[index].specialNeeds = event.target.value.split(",").map((item) => item.trim()).filter(Boolean);
  } else {
    state.animals[index][field] = event.target.value;
  }
}

function capacityFor(species) {
  const capacity = trailerDefaults[state.transport.type][species] ?? priorityRules[species].capacity;
  return capacity * state.transport.trailers;
}

function renderCapacity() {
  const grid = document.querySelector("#capacity-readout");
  grid.innerHTML = Object.keys(priorityRules).map((species) => `
    <div><strong>${capacityFor(species)}</strong> ${priorityRules[species].label} per trip</div>
  `).join("");
}

function expandedAnimals() {
  return state.animals.flatMap((animal) => {
    if (animal.species !== "cattle") return [animal];
    const text = (animal.specialNeeds || []).join(" ").toLowerCase();
    const match = text.match(/(\d+)\s*(calf|calves)/);
    if (!match) return [animal];
    const calves = Math.min(Number(match[1]), animal.count);
    const remainingNeeds = (animal.specialNeeds || []).filter((need) => !need.toLowerCase().includes("calf") && !need.toLowerCase().includes("calves"));
    return [
      { species: "cattle_calves", count: calves, specialNeeds: ["keep with mothers"] },
      { ...animal, count: animal.count - calves, specialNeeds: remainingNeeds }
    ].filter((item) => item.count > 0);
  });
}

function buildPlan() {
  const multiplier = state.smokeClose ? 2 : 1;
  let trip = 1;
  return expandedAnimals()
    .sort((a, b) => priorityRules[a.species].rank - priorityRules[b.species].rank)
    .flatMap((animal) => {
      const rule = priorityRules[animal.species];
      const capacity = capacityFor(animal.species);
      if (capacity <= 0) {
        return [{ ...animal, trip: null, load: animal.count, loadTime: 0, rule, canTransport: false }];
      }
      const rows = [];
      let remaining = animal.count;
      while (remaining > 0) {
        const load = Math.min(remaining, capacity);
        rows.push({ ...animal, specialNeeds: remaining === animal.count ? animal.specialNeeds : [], trip: trip++, load, loadTime: Math.ceil(load * rule.loadTime * multiplier), rule, canTransport: true });
        remaining -= load;
      }
      return rows;
    });
}

function checklistFor(speciesList) {
  const has = new Set(speciesList);
  const checklist = {
    immediate: [
      "Grab brand inspection certificates and ownership papers.",
      "Charge phone and battery pack.",
      "Fill water containers, minimum 5 gallons per large animal.",
      "Photograph every animal before loading.",
      "Text your evacuation plan to a family member or neighbor."
    ],
    vehicle_prep: [
      "Inspect trailer hitch and safety chains.",
      "Check trailer tire pressure.",
      "Test brake lights and turn signals.",
      "Fill truck gas tank completely."
    ],
    last_resort: [
      "Open all gates and interior fences.",
      "Remove halters and attached leads.",
      "Turn off electric fences.",
      "Move animals to the largest open pasture away from structures.",
      "Leave water troughs full and running."
    ]
  };
  if (has.has("horses")) checklist.horse_specific = ["Attach leather halter with ID tag.", "Load calm horses first.", "Have veterinarian-approved sedation ready.", "Bring 48 hours of regular feed."];
  if (has.has("cattle")) checklist.cattle_specific = ["Set up loading chute.", "Keep calves with mothers.", "Move bulls separately if possible.", "Carry brand inspection documents."];
  if (has.has("goats") || has.has("sheep")) checklist.small_ruminant_specific = ["Use a lead animal.", "Secure trailer gaps.", "Provide hay in trailer.", "Count on loading and unloading."];
  if (has.has("poultry")) checklist.poultry_specific = ["Catch birds at night if possible.", "Use ventilated crates.", "Do not stack crates more than 3 high.", "Prioritize breeding stock."];
  return checklist;
}

function renderPlan() {
  state.farm.name = document.querySelector("#farm-name").value;
  state.farm.address = document.querySelector("#farm-address").value;
  state.timeAvailableHours = Number(document.querySelector("#time-available").value);
  state.smokeClose = document.querySelector("#smoke-close").checked;
  document.querySelector("#countdown").textContent = `${state.timeAvailableHours}h`;

  const plan = buildPlan();
  const totalLoad = plan.reduce((sum, item) => sum + item.loadTime, 0);
  const available = state.timeAvailableHours * 60;
  const banner = document.querySelector("#critical-banner");

  if (totalLoad > available) {
    const saved = [];
    const left = [];
    let elapsed = 0;
    plan.forEach((item) => {
      if (item.canTransport && elapsed + item.loadTime <= available) {
        saved.push(`${item.load} ${item.rule.label}`);
        elapsed += item.loadTime;
      } else {
        left.push(`${item.load} ${item.rule.label}`);
      }
    });
    banner.textContent = `CRITICAL: You have ${state.timeAvailableHours} hours. Loading alone takes ${(totalLoad / 60).toFixed(1)} hours. Save ${saved.join(", ") || "highest-priority animals first"}. Remaining animals: ${left.join(", ")} need shelter-in-place.`;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

  document.querySelector("#plan-list").innerHTML = plan.map((item, index) => `
    <article class="plan-card">
      <div class="plan-meta">
        <h3>${index + 1}. ${item.trip ? `Trip ${item.trip}` : "Shelter-in-place"}</h3>
        <strong>${item.loadTime} min</strong>
      </div>
      <p>${item.load} ${item.rule.label}${item.specialNeeds?.length ? ` (${item.specialNeeds.join("; ")})` : ""}</p>
      <p>${item.reason || item.rule.reason}</p>
      <p>${item.rule.handling}</p>
    </article>
  `).join("");

  const checklist = checklistFor(state.animals.map((animal) => animal.species));
  document.querySelector("#checklist").innerHTML = Object.entries(checklist).map(([section, items]) => `
    <details open>
      <summary>${section.replaceAll("_", " ")}</summary>
      <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </details>
  `).join("");
}

function loadProfile(profile) {
  state.farm = { id: profile.id, name: profile.name, address: profile.address, lat: profile.lat, lon: profile.lon };
  state.animals = structuredClone(profile.animals);
  state.transport = structuredClone(profile.transport);
  state.timeAvailableHours = profile.timeAvailableHours;

  document.querySelector("#farm-name").value = state.farm.name;
  document.querySelector("#farm-address").value = state.farm.address;
  document.querySelector("#location-readout").textContent = `${state.farm.lat.toFixed(4)}, ${state.farm.lon.toFixed(4)}`;
  document.querySelector("#time-available").value = state.timeAvailableHours;
  document.querySelector("#trailer-type").value = state.transport.type;
  document.querySelectorAll("#trailer-count button").forEach((button) => button.classList.toggle("active", Number(button.dataset.count) === state.transport.trailers));
  renderAnimalRows();
  renderCapacity();
}

async function geocodeAddress() {
  const address = document.querySelector("#farm-address").value;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
  const results = await response.json();
  if (!results.length) return;
  state.farm.lat = Number(results[0].lat);
  state.farm.lon = Number(results[0].lon);
  document.querySelector("#location-readout").textContent = `${state.farm.lat.toFixed(4)}, ${state.farm.lon.toFixed(4)}`;
}

function init() {
  const profileSelect = document.querySelector("#demo-profile");
  demoProfiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.append(option);
  });

  document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.next)));
  document.querySelectorAll("[data-prev]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.prev)));
  document.querySelectorAll(".step").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.screen)));
  document.querySelector("#animal-list").addEventListener("input", syncAnimalsFromInputs);
  document.querySelector("#animal-list").addEventListener("click", (event) => {
    const index = event.target.dataset.remove;
    if (index === undefined) return;
    state.animals.splice(Number(index), 1);
    renderAnimalRows();
  });
  document.querySelector("#add-animal").addEventListener("click", () => {
    state.animals.push({ species: "goats", count: 1, specialNeeds: [] });
    renderAnimalRows();
  });
  document.querySelector("#trailer-count").addEventListener("click", (event) => {
    if (!event.target.dataset.count) return;
    state.transport.trailers = Number(event.target.dataset.count);
    document.querySelectorAll("#trailer-count button").forEach((button) => button.classList.toggle("active", button === event.target));
    renderCapacity();
  });
  document.querySelector("#trailer-type").addEventListener("change", (event) => {
    state.transport.type = event.target.value;
    renderCapacity();
  });
  document.querySelector("#demo-profile").addEventListener("change", (event) => {
    const profile = demoProfiles.find((item) => item.id === event.target.value);
    if (profile) loadProfile(profile);
  });
  document.querySelector("#geocode-btn").addEventListener("click", geocodeAddress);
  document.querySelector("#print-plan").addEventListener("click", () => window.print());

  loadProfile(demoProfiles[0]);
}

init();
