"""
Rival Radar — competitor-aware pricing + prepaid voucher campaigns for Fresha merchants.
Demo merchant: ABC, a men's grooming shop.  Agentic AI track · Nebius Token Factory + Tavily

Run (web): uvicorn server:app --host 0.0.0.0 --port 8000
  pip install streamlit openai tavily-python pandas
  export NEBIUS_API_KEY=...
  export TAVILY_API_KEY=...        # optional (synthetic fallback if missing)
  streamlit run app.py
"""
import json, os, random, re, statistics
from datetime import date, timedelta

import pandas as pd
from openai import OpenAI

BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.eu-south1.nebius.com/v1/")
MODEL = os.getenv("NEBIUS_MODEL", "deepseek-ai/DeepSeek-V4.1-Flash-1017-fast")
client = OpenAI(base_url=BASE_URL, api_key=os.getenv("NEBIUS_API_KEY", "missing"))

# ---------------------------------------------------------------- synthetic merchant data
SHOP = "ABC Men's Grooming"
MENU = [  # service, category, price £, cost £ (product + labour)
    {"service": "Skin fade", "category": "fade", "price": 25, "cost": 10},
    {"service": "Classic haircut", "category": "cut", "price": 22, "cost": 9},
    {"service": "Beard trim & shape", "category": "beard", "price": 15, "cost": 5},
    {"service": "Hot towel shave", "category": "shave", "price": 28, "cost": 10},
    {"service": "Cut & beard combo", "category": "combo", "price": 35, "cost": 14},
    {"service": "Grey blending", "category": "colour", "price": 30, "cost": 12},
    {"service": "Men's facial", "category": "facial", "price": 40, "cost": 14},
]
QUERY = {"fade": "skin fade", "cut": "men's haircut", "beard": "beard trim", "shave": "hot towel shave",
         "combo": "haircut and beard", "colour": "men's grey blending", "facial": "men's facial"}
# Demo market data (synthetic, shaped like what Tavily surfaces for local barbers)
MARKET = {
    "fade": [28, 30, 27, 32, 26], "cut": [20, 22, 24, 21, 23], "beard": [12, 14, 13, 15, 12],
    "shave": [25, 30, 28, 32, 27], "combo": [38, 40, 42, 36, 39], "colour": [28, 32, 30, 35, 29],
    "facial": [35, 45, 40, 38, 42],
}


def make_clients(n=400, seed=7):
    random.seed(seed)
    names = ["Adam", "Ben", "Chidi", "Dev", "Ethan", "Femi", "Gus", "Hassan", "Idris", "Jay"]
    return pd.DataFrame([{
        "client": f"{random.choice(names)} {chr(65 + i % 26)}.",
        "email": f"client{i}@example.com",
        "opted_in": random.random() < 0.72,
        "days_since_visit": random.randint(3, 200),
        "lifetime_spend": random.randint(20, 1500),
    } for i in range(n)])


CLIENTS = make_clients()
CTX = {"area": "Shoreditch, London", "radius": 2, "floor": 35}  # set from UI each run

# ---------------------------------------------------------------- tools
def research_competitors(area: str = None, radius_miles: float = None) -> dict:
    """Tavily search scoped to town/area + radius (cached per area). Synthetic price fallback."""
    area, radius = area or CTX["area"], radius_miles or CTX["radius"]
    cache = f"cache_{re.sub(r'[^a-z0-9]+', '_', area.lower())}_{radius}mi.json"
    sources = []
    if os.path.exists(cache):
        sources = json.load(open(cache))
    elif os.getenv("TAVILY_API_KEY"):
        try:
            from tavily import TavilyClient
            tv = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
            for q in ["skin fade", "beard trim", "hot towel shave", "men's grooming"]:
                r = tv.search(f"barber {q} price within {radius} miles of {area}", max_results=3)
                sources += [{"title": x["title"], "url": x["url"], "query": q} for x in r.get("results", [])]
            json.dump(sources, open(cache, "w"))
        except Exception as e:
            sources = [{"title": f"Tavily unavailable: {e}", "url": "", "query": ""}]
    market = {k: {"median": statistics.median(v), "low": min(v), "high": max(v)} for k, v in MARKET.items()}
    return {"area": area, "radius_miles": radius, "market": market,
            "competitors_sampled": 5, "sources": sources[:10]}


def analyse_pricing(margin_floor_pct: float = None) -> dict:
    """Compare ABC's menu vs local market median; never recommend below the margin floor."""
    floor_pct = margin_floor_pct or CTX["floor"]
    mkt = research_competitors()["market"]
    recs = []
    for m in MENU:
        med = mkt[m["category"]]["median"]
        gap = (m["price"] - med) / med * 100
        floor = round(m["cost"] / (1 - floor_pct / 100))
        if gap < -8:
            action, new = "⬆️ RAISE (underpriced vs local market)", max(round(med * 0.97), floor)
        elif gap > 8:
            action, new = "🎁 HOLD + add value via voucher", m["price"]
        else:
            action, new = "✅ HOLD (in line with market)", m["price"]
        recs.append({"service": m["service"], "ABC price £": m["price"], "local median £": med,
                     "local range £": f"{mkt[m['category']]['low']}–{mkt[m['category']]['high']}",
                     "gap %": round(gap, 1), "margin floor £": floor, "recommended £": new, "action": action})
    uplift = sum((r["recommended £"] - r["ABC price £"]) for r in recs)
    return {"margin_floor_pct": floor_pct, "recommendations": recs, "price_uplift_per_full_menu_£": uplift}


def segment_and_offer() -> dict:
    """Segment opted-in clients only (GDPR) and assign a prepaid voucher offer per segment."""
    c = CLIENTS[CLIENTS.opted_in]
    seg = {
        "lapsed": c[c.days_since_visit > 60],
        "vip": c[(c.days_since_visit <= 60) & (c.lifetime_spend >= 700)],
        "regular": c[(c.days_since_visit <= 60) & (c.lifetime_spend < 700)],
    }
    offers = {
        "lapsed": {"pay": 30, "get": 36, "pitch": "Come back: £30 voucher = £36 of grooming"},
        "vip": {"pay": 100, "get": 120, "pitch": "VIP: £100 voucher = £120 (cuts, shaves, facials)"},
        "regular": {"pay": 40, "get": 48, "pitch": "Lock in today's prices: £40 voucher = £48"},
    }
    expiry = (date.today() + timedelta(days=14)).isoformat()
    out = {k: {"count": len(df), **offers[k], "expires": expiry,
               "projected_£_upfront": round(len(df) * 0.08 * offers[k]["pay"])} for k, df in seg.items()}
    return {"opted_out_excluded": int((~CLIENTS.opted_in).sum()), "segments": out}


def draft_campaign(segment: str, pitch: str, expires: str) -> dict:
    r = client.chat.completions.create(model=MODEL, temperature=0.7, messages=[
        {"role": "system", "content": "You write short, friendly barbershop marketing emails for men. Max 90 words. "
                                      "Include a subject line, {first_name}, {VOUCHER_CODE} and the expiry date. No false urgency."},
        {"role": "user", "content": f"Shop: {SHOP}. Segment: {segment}. Offer: {pitch}. Expires: {expires}."}])
    return {"segment": segment, "email": r.choices[0].message.content}


TOOLS_IMPL = {"research_competitors": research_competitors, "analyse_pricing": analyse_pricing,
              "segment_and_offer": segment_and_offer, "draft_campaign": draft_campaign}
TOOLS = [
    {"type": "function", "function": {"name": "research_competitors",
        "description": "Find competitor prices within a radius of a town/area.",
        "parameters": {"type": "object", "properties": {"area": {"type": "string"}, "radius_miles": {"type": "number"}}}}},
    {"type": "function", "function": {"name": "analyse_pricing",
        "description": "Compare ABC's menu to local market, respecting the margin floor.",
        "parameters": {"type": "object", "properties": {"margin_floor_pct": {"type": "number"}}}}},
    {"type": "function", "function": {"name": "segment_and_offer",
        "description": "Segment opted-in clients and assign prepaid voucher offers.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "draft_campaign", "description": "Draft the email for one segment.",
        "parameters": {"type": "object", "properties": {"segment": {"type": "string"}, "pitch": {"type": "string"},
                                                         "expires": {"type": "string"}},
                       "required": ["segment", "pitch", "expires"]}}},
]
SYSTEM = (f"You are Rival Radar, a pricing agent for {SHOP}, a men's grooming shop on Fresha. Call research_competitors, "
          "then analyse_pricing, then segment_and_offer, then draft_campaign once per segment. Never go below the margin "
          "floor; prefer added-value vouchers over discounts. Finish with a 4-bullet brief for the owner, naming the "
          "area and radius searched, the price changes, and total projected upfront revenue.")


def run_agent(goal: str, max_steps: int = 10):
    msgs = [{"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"{goal} Area: {CTX['area']}, radius {CTX['radius']} miles, "
                                        f"margin floor {CTX['floor']}%."}]
    trace = []
    for _ in range(max_steps):
        m = client.chat.completions.create(model=MODEL, messages=msgs, tools=TOOLS, temperature=0.2).choices[0].message
        if not m.tool_calls:
            return m.content, trace
        msgs.append(m)
        for tc in m.tool_calls:
            args = json.loads(tc.function.arguments or "{}")
            if tc.function.name == "research_competitors":  # UI is source of truth for location
                args = {"area": CTX["area"], "radius_miles": CTX["radius"]}
            if tc.function.name == "analyse_pricing":
                args = {"margin_floor_pct": CTX["floor"]}
            result = TOOLS_IMPL[tc.function.name](**args)
            trace.append((tc.function.name, args, result))
            msgs.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result)[:6000]})
    return "Stopped after max steps.", trace




# ---------------------------------------------------------------- web API (FastAPI)
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="Rival Radar")
HERE = os.path.dirname(os.path.abspath(__file__))


class RunReq(BaseModel):
    goal: str = "How do my prices compare with barbers near me, and how do I lock in revenue before Christmas?"
    area: str = "Shoreditch, London"
    radius: float = 2
    floor: float = 35


@app.get("/")
def index():
    return FileResponse(os.path.join(HERE, "static", "index.html"))


@app.post("/api/run")
def api_run(req: RunReq):
    CTX.update(area=req.area, radius=req.radius, floor=req.floor)
    fallback = None
    try:
        brief, trace = run_agent(req.goal)
    except Exception as e:
        fallback = str(e)[:200]
        trace = [("research_competitors", {}, research_competitors()),
                 ("analyse_pricing", {}, analyse_pricing()),
                 ("segment_and_offer", {}, segment_and_offer())]
        brief = "Fallback pipeline run (LLM unavailable)."
    res = {n: r for n, _, r in trace}
    if "analyse_pricing" not in res:
        res["analyse_pricing"] = analyse_pricing()
    if "segment_and_offer" not in res:
        res["segment_and_offer"] = segment_and_offer()
    if "research_competitors" not in res:
        res["research_competitors"] = research_competitors()
    drafts = {r["segment"]: r["email"] for n, _, r in trace if n == "draft_campaign"}
    return {"brief": brief, "steps": [n for n, _, _ in trace], "fallback": fallback,
            "research": res["research_competitors"], "pricing": res["analyse_pricing"],
            "campaign": res["segment_and_offer"], "drafts": drafts}
