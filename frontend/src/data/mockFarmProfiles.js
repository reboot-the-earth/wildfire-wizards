export const demoFarms = [
  {
    id: "valley_center_ranch",
    name: "Valley Center Ranch",
    owner: "Maria Gonzalez",
    location: { lat: 33.22, lon: -117.03 },
    address: "28500 Valley Center Rd, Valley Center, CA",
    animals: [
      { species: "cattle", count: 150, special_needs: ["12 calves with mothers", "2 bulls separate"] },
      { species: "horses", count: 8, special_needs: ["2 pregnant mares", "1 foal"] }
    ],
    transport: {
      trailers: 1,
      type: "stock_trailer",
      capacity: { cattle: 20, horses: 4 }
    }
  },
  {
    id: "fallbrook_stables",
    name: "Fallbrook Equestrian Center",
    owner: "Jake Morrison",
    location: { lat: 33.37, lon: -117.25 },
    address: "1200 S Mission Rd, Fallbrook, CA",
    animals: [
      { species: "horses", count: 24, special_needs: ["3 senior > 25 yrs", "2 miniatures"] }
    ],
    transport: {
      trailers: 2,
      type: "horse_trailer",
      capacity: { horses: 4 }
    }
  },
  {
    id: "ramona_goat_farm",
    name: "Ramona Heritage Goat Farm",
    owner: "David & Lin Chen",
    location: { lat: 33.05, lon: -116.87 },
    address: "16800 Mussey Grade Rd, Ramona, CA",
    animals: [
      { species: "goats", count: 85, special_needs: ["15 does with kids"] },
      { species: "poultry", count: 200, special_needs: ["free-range"] }
    ],
    transport: {
      trailers: 1,
      type: "livestock_trailer",
      capacity: { goats: 30, poultry: 100 }
    }
  }
];

export const mockEvacuationPlan = {
  farm: {
    id: "valley_center_ranch",
    name: "Valley Center Ranch",
    location: { lat: 33.22, lon: -117.03 }
  },
  priority_plan: [
    {
      order: 1,
      trip: 1,
      animals: "2 pregnant mares + foal + 1 horse",
      count: 4,
      species: "horses",
      reason: "Highest vulnerability — pregnant, young",
      load_time_est_min: 45,
      handling: "Load individually. Pregnant mares first. Foal will follow mother.",
      status: "pending"
    },
    {
      order: 2,
      trip: 2,
      animals: "4 remaining horses",
      count: 4,
      species: "horses",
      reason: "Complete horse evacuation before cattle",
      load_time_est_min: 30,
      handling: "Load in pairs. Calm handler required.",
      status: "pending"
    },
    {
      order: 3,
      trip: 3,
      animals: "12 cow-calf pairs",
      count: 24,
      species: "cattle",
      reason: "Calves under 3 months — cannot separate from mothers",
      load_time_est_min: 15,
      handling: "Use chute. Load cow-calf pairs together. Do NOT separate.",
      status: "pending"
    },
    {
      order: 4,
      trip: "4–9",
      animals: "Remaining 126 cattle (6 loads × 20)",
      count: 126,
      species: "cattle",
      reason: "Bulk evacuation",
      load_time_est_min: 15,
      handling: "Use chute. Bulls load last, separate trailer section.",
      status: "pending"
    }
  ],
  time_estimate: {
    loading_time_total_min: 200,
    drive_time_per_trip_min: 38,
    total_trips: 9,
    total_evacuation_hours: 15.9
  },
  triage_warning: "You have 3.7 hours. Full evacuation takes 15.9 hours with 1 trailer. Prioritize horses and calves (trips 1–3). Remaining 126 cattle: open gates toward largest pasture away from structures.",
  checklist: {
    immediate: [
      { id: "papers", text: "Grab brand inspection certificates / ownership papers", checked: false },
      { id: "phone", text: "Charge phone — you need it for navigation", checked: false },
      { id: "water", text: "Fill water containers (5 gallons per large animal)", checked: false },
      { id: "photo", text: "Photograph all animals before loading (insurance)", checked: false },
      { id: "notify", text: "Text your plan to a family member or neighbor", checked: false }
    ],
    vehicle_prep: [
      { id: "hitch", text: "Inspect trailer hitch and safety chains", checked: false },
      { id: "tires", text: "Check trailer tire pressure", checked: false },
      { id: "floor", text: "Ensure trailer floor is dry and bedded", checked: false },
      { id: "lights", text: "Test brake lights and turn signals", checked: false },
      { id: "gas", text: "Fill truck gas tank completely", checked: false }
    ],
    horse_specific: [
      { id: "halter", text: "Attach leather halter with ID tag (not nylon — melts)", checked: false },
      { id: "calm", text: "Load horses that trailer well first to calm others", checked: false },
      { id: "sedation", text: "Have sedation on hand for resistant loaders", checked: false },
      { id: "feed", text: "Bring 48hr supply of each horse's feed (prevent colic)", checked: false }
    ],
    cattle_specific: [
      { id: "chute", text: "Set up loading chute before bringing cattle in", checked: false },
      { id: "pairs", text: "Sort calves with mothers — do NOT separate", checked: false },
      { id: "bulls", text: "Move bulls separately if possible", checked: false },
      { id: "brand", text: "Contact brand inspector if moving across county lines", checked: false }
    ],
    last_resort: [
      { id: "gates", text: "If you CANNOT return: open all gates and fences", checked: false },
      { id: "halters_remove", text: "Remove halters and leads (entanglement risk)", checked: false },
      { id: "fences", text: "Turn off all electric fences", checked: false },
      { id: "pasture", text: "Move animals to largest open pasture away from structures", checked: false },
      { id: "paint", text: "Spray-paint your phone number on large animals", checked: false },
      { id: "water_running", text: "Leave water troughs full and running", checked: false }
    ]
  }
};

export const DEMO_STEPS = [
  {
    id: 1,
    name: "Set the Scene",
    narration: "December 7, 2017. 11:15 AM. Fire ignites near Bonsall, California. Santa Ana winds at 35 mph. Humidity: 12%. This is the Lilac Fire.",
    mapCenter: [33.24, -117.18],
    mapZoom: 11,
    showFire: true,
    showFarms: false,
    showRoutes: false,
    activeFarm: null,
  },
  {
    id: 2,
    name: "Farms at Risk",
    narration: "3 farms in the projected path: 182 cattle, 32 horses, 85 goats. Auto-alerts sent. The clock is ticking.",
    mapCenter: [33.18, -117.05],
    mapZoom: 10,
    showFire: true,
    showFarms: true,
    showRoutes: false,
    activeFarm: null,
  },
  {
    id: 3,
    name: "Valley Center Ranch",
    narration: "Maria has 150 cattle, 8 horses, and one trailer. She has 3 hours 42 minutes. The system builds her plan in seconds.",
    mapCenter: [33.22, -117.03],
    mapZoom: 12,
    showFire: true,
    showFarms: true,
    showRoutes: true,
    activeFarm: "valley_center_ranch",
  },
  {
    id: 4,
    name: "Capacity Shifts",
    narration: "Ramona Rodeo now shows 62 of 300 spots remaining. The next farmer will see different options. The system adapts in real time.",
    mapCenter: [33.12, -117.0],
    mapZoom: 11,
    showFire: true,
    showFarms: true,
    showRoutes: false,
    activeFarm: null,
  },
  {
    id: 5,
    name: "Fallbrook Stables",
    narration: "Jake has 24 horses and 2 hours. Ramona is filling up. The system routes him to Del Mar Fairgrounds — 1,500 horse capacity, 52 minutes away.",
    mapCenter: [33.37, -117.25],
    mapZoom: 11,
    showFire: true,
    showFarms: true,
    showRoutes: true,
    activeFarm: "fallbrook_stables",
  },
  {
    id: 6,
    name: "The Stakes",
    narration: "During the actual Lilac Fire, 46 horses died at San Luis Rey Training Center. Evacuation was uncoordinated. WildfireWizards makes that number zero.",
    mapCenter: [33.24, -117.18],
    mapZoom: 10,
    showFire: true,
    showFarms: true,
    showRoutes: false,
    activeFarm: null,
  }
];
