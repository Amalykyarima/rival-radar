/* DEMO DATA for ABC Men's Grooming. All synthetic, matching the backend spec (menu, costs, market prices).
   Competitor names, ratings and distances are invented for the demo. People are invented.
   Dates are relative to "now" so the demo always looks fresh. */
(function () {
  const ago = (days, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600e3).toISOString();
  const MARKET = { fade: [28, 30, 27, 32, 26], cut: [20, 22, 24, 21, 23], beard: [12, 14, 13, 15, 12], shave: [25, 30, 28, 32, 27],
                   combo: [38, 40, 42, 36, 39], colour: [28, 32, 30, 35, 29], facial: [35, 45, 40, 38, 42] };
  const services = [
    { key: "beard_trim",      category: "beard",  label: "Beard trim & shape", price_gbp: 15, cost_gbp: 5,  duration_min: 20, blurb: "Line-up, shape and hot towel finish." },
    { key: "skin_fade",       category: "fade",   label: "Skin fade",          price_gbp: 25, cost_gbp: 10, duration_min: 40, blurb: "Clean fade to the skin, styled to finish." },
    { key: "classic_cut",     category: "cut",    label: "Classic haircut",    price_gbp: 22, cost_gbp: 9,  duration_min: 30, blurb: "Scissor or clipper cut, wash and style." },
    { key: "hot_towel_shave", category: "shave",  label: "Hot towel shave",    price_gbp: 28, cost_gbp: 10, duration_min: 35, blurb: "Traditional straight-razor shave with hot towels." },
    { key: "cut_beard_combo", category: "combo",  label: "Cut & beard combo",  price_gbp: 35, cost_gbp: 14, duration_min: 50, blurb: "Haircut plus beard trim and shape." },
    { key: "grey_blending",   category: "colour", label: "Grey blending",      price_gbp: 30, cost_gbp: 12, duration_min: 30, blurb: "Natural-looking grey reduction." },
    { key: "mens_facial",     category: "facial", label: "Men's facial",       price_gbp: 40, cost_gbp: 14, duration_min: 45, blurb: "Deep cleanse, exfoliation and hydration." }
  ];
  const rivals = [["Rival Barber A", 4.4, 0.3, "fresha"], ["Rival Barber B", 4.7, 0.6, "website"], ["Rival Barber C", 4.2, 0.9, "google"],
                  ["Rival Barber D", 4.6, 1.2, "fresha"], ["Rival Barber E", 4.3, 1.6, "website"]];

  window.DEMO = {
    settings: { deposit_pct: 20 },   // demo assumption, not a Fresha default

    competitors: {
      area: "Shoreditch, London", category: "barber", scraped_at: null,
      me: { id: "me", name: "ABC Men's Grooming", rating: 4.8, review_count: 260,
        brand: { primary: "#0D0D0D", accent: "#6950F3", tone: ["confident", "friendly", "straightforward"], sign_off: "The team at ABC Men's Grooming" },
        services },
      competitors: rivals.map(([name, rating, km, source], i) => ({
        id: "c" + (i + 1), name, rating, distance_km: km, source, on_fresha: source === "fresha", review_count: null, url: "#",
        services: services.map(s => ({ key: s.key, label: s.label, price_gbp: MARKET[s.category][i], evidence_url: "#" })) }))
    },

    /* Logged-in app users. Visitors must sign in to book, so we know who they are. */
    users: [
      { id: "u1",  first_name: "Adam",   last_name: "Hart",   email: "adam.hart@example.com",    consent_marketing: true },
      { id: "u2",  first_name: "Pranav", last_name: "Nair",   email: "pranav.nair@example.com",  consent_marketing: true },
      { id: "u3",  first_name: "Harry",  last_name: "Cole",   email: "harry.cole@example.com",   consent_marketing: true },
      { id: "u4",  first_name: "Zaid",   last_name: "Ahmed",  email: "zaid.ahmed@example.com",   consent_marketing: false },
      { id: "u5",  first_name: "Oliver", last_name: "Brooks", email: "oliver.brooks@example.com", consent_marketing: true },
      { id: "u6",  first_name: "Callum", last_name: "Evans",  email: "callum.evans@example.com", consent_marketing: true },
      { id: "u7",  first_name: "Mo",     last_name: "Patel",  email: "mo.patel@example.com",     consent_marketing: true },
      { id: "u8",  first_name: "Ethan",  last_name: "Morgan", email: "ethan.morgan@example.com", consent_marketing: true },
      { id: "u9",  first_name: "George", last_name: "Lee",    email: "george.lee@example.com",   consent_marketing: true },   // use for the live demo
      { id: "u10", first_name: "Isaac",  last_name: "Reid",   email: "isaac.reid@example.com",   consent_marketing: true },   // also a past client
      { id: "u11", first_name: "Noah",   last_name: "Clarke", email: "noah.clarke@example.com",  consent_marketing: true },   // new visitor
      { id: "u12", first_name: "Leo",    last_name: "Woods",  email: "leo.woods@example.com",    consent_marketing: false }   // new visitor, no consent
    ],

    /* Past clients from the shop's client list. lifetime_spend drives the agent's segments:
       lapsed > 60 days, vip <= 60 days and >= £700, regular <= 60 days and < £700. */
    clients: [
      { id: "p1", first_name: "Isaac", email: "isaac.reid@example.com", last_service: "beard_trim",      last_visit: ago(42),  lifetime_spend: 820, consent_marketing: true },
      { id: "p2", first_name: "Fred",  email: "fred.wood@example.com",  last_service: "beard_trim",      last_visit: ago(35),  lifetime_spend: 300, consent_marketing: true },
      { id: "p3", first_name: "Rory",  email: "rory.shaw@example.com",  last_service: "skin_fade",       last_visit: ago(90),  lifetime_spend: 410, consent_marketing: false },
      { id: "p4", first_name: "Liam",  email: "liam.grant@example.com", last_service: "beard_trim",      last_visit: ago(28),  lifetime_spend: 450, consent_marketing: true },
      { id: "p5", first_name: "Sam",   email: "sam.bell@example.com",   last_service: "cut_beard_combo", last_visit: ago(21),  lifetime_spend: 950, consent_marketing: true },
      { id: "p6", first_name: "Pete",  email: "pete.fox@example.com",   last_service: "skin_fade",       last_visit: ago(75),  lifetime_spend: 260, consent_marketing: true },
      { id: "p7", first_name: "Ewan",  email: "ewan.price@example.com", last_service: "hot_towel_shave", last_visit: ago(33),  lifetime_spend: 150, consent_marketing: true },
      { id: "p8", first_name: "Alfie", email: "alfie.kerr@example.com", last_service: "classic_cut",     last_visit: ago(120), lifetime_spend: 600, consent_marketing: false }
    ],

    /* Storefront activity before the demo starts. Live clicks in shop.html are added on top. */
    events: [
      { user_id: "u1", type: "view",               service_key: "beard_trim",      at: ago(3, 2) },
      { user_id: "u1", type: "checkout_started",   service_key: "beard_trim",      at: ago(3, 1) },
      { user_id: "u1", type: "checkout_abandoned", service_key: "beard_trim",      at: ago(3, 1), price_in_mind_gbp: 12 },
      { user_id: "u2", type: "view",               service_key: "beard_trim",      at: ago(5) },
      { user_id: "u2", type: "checkout_abandoned", service_key: "beard_trim",      at: ago(5), price_in_mind_gbp: 13 },
      { user_id: "u3", type: "view",               service_key: "beard_trim",      at: ago(2, 3) },
      { user_id: "u3", type: "checkout_started",   service_key: "beard_trim",      at: ago(2, 2) },
      { user_id: "u3", type: "booked",             service_key: "beard_trim",      at: ago(2, 2) },
      { user_id: "u4", type: "view",               service_key: "beard_trim",      at: ago(1, 5) },
      { user_id: "u4", type: "checkout_abandoned", service_key: "beard_trim",      at: ago(1, 5), price_in_mind_gbp: 12 },
      { user_id: "u5", type: "view",               service_key: "hot_towel_shave", at: ago(4) },
      { user_id: "u5", type: "checkout_abandoned", service_key: "hot_towel_shave", at: ago(4), price_in_mind_gbp: 25 },
      { user_id: "u6", type: "view",               service_key: "classic_cut",     at: ago(6) },
      { user_id: "u6", type: "checkout_abandoned", service_key: "classic_cut",     at: ago(6) },
      { user_id: "u7", type: "view",               service_key: "beard_trim",      at: ago(20) },
      { user_id: "u7", type: "checkout_abandoned", service_key: "beard_trim",      at: ago(20), price_in_mind_gbp: 11 },
      { user_id: "u8", type: "view",               service_key: "beard_trim",      at: ago(8) },
      { user_id: "u8", type: "checkout_abandoned", service_key: "beard_trim",      at: ago(8) }
    ]
  };
})();
