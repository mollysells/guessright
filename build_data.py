#!/usr/bin/env python3
"""Build the GuessRight question bank from guessright-ap-bank.flat.jsonl.

Emits:
  data/index.json                       -> course/unit/topic index + per-course
                                           facet availability + global length bands
  public/data/<slug>--<unitId>.json     -> per-unit questions (heavy: full text)
  public/data/<slug>--facets.json       -> per-course facet index (light: NO text)

Design notes
------------
The practice UI is a course-aware "Practice Builder": the user composes a set by
toggling facets (unit, topic, type, length, diagram, #options) and sees a live
match count, then launches. Live counts must be instant, so we ship a *stripped*
per-course facet index (one small record per question, no stem/options text) that
loads in a few KB gzipped. The heavy per-unit files are fetched only when a set is
actually launched.

Honesty: `d` and the length band `lb` are reading-load-based PRIORS, not measured
difficulty (there is no response data). We label the facet "length", never
"difficulty".
"""
import json, os, re, collections

SRC = "guessright-ap-bank.flat.jsonl"
IDX_OUT = "data"
COURSE_OUT = os.path.join("public", "data")
UNIT_NAMES_FILE = os.path.join("data", "unit_names.json")  # curated CED names (optional)
os.makedirs(IDX_OUT, exist_ok=True)
os.makedirs(COURSE_OUT, exist_ok=True)

# Calc AB and BC are byte-identical in the source (same 3,599 questions); the data
# never distinguished them. Merge into one course and de-duplicate by id.
CALC_MERGE = {"ap-calculus-ab", "ap-calculus-bc"}
CALC_CID = "ap-calculus-ab-bc"
CALC_NAME = "AP Calculus AB/BC"


def slug(cid):
    return re.sub(r"[^a-z0-9-]", "", cid.lower())


def cat_key(cat):
    return tuple(int(p) if p.isdigit() else p for p in re.split(r"(\d+)", cat))


def topics_of(category):
    """Split a possibly multi-code category ('1.2, 1.5') into clean tags."""
    out = []
    for c in re.split(r"[,;]", category or ""):
        c = c.strip()
        if c:
            out.append(c)
    return out


def is_topic_code(c):
    """True for real CED topic codes like '1.3' / '10.2' (not 'Skill, Category, 7',
    not 'Unit 4', not 'Unknown Unit')."""
    return bool(re.fullmatch(r"\d+\.\d+", c or ""))


def load_curated_unit_names():
    if os.path.exists(UNIT_NAMES_FILE):
        try:
            return json.load(open(UNIT_NAMES_FILE, encoding="utf-8"))
        except Exception:
            return {}
    return {}


CURATED = load_curated_unit_names()

# ---- read ----
courses = collections.OrderedDict()   # cid -> {name, q:[...]}
meta = {}                             # cid -> {units: OrderedDict}
seen_ids = collections.defaultdict(set)  # cid -> ids already taken (Calc de-dupe)

with open(SRC, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        o = json.loads(line)
        cid = o["courseId"]
        cname = o["courseName"]
        if cid in CALC_MERGE:
            cid, cname = CALC_CID, CALC_NAME

        if o["id"] in seen_ids[cid]:
            continue  # duplicate (the AB/BC overlap)
        seen_ids[cid].add(o["id"])

        if cid not in courses:
            courses[cid] = {"name": cname, "q": []}
            meta[cid] = {"units": collections.OrderedDict()}

        tags = topics_of(o.get("category", ""))
        options = o.get("options", [])
        is_mcq = o["questionType"] == "MCQ"
        # reading load = words in stem + all options (proxy for cognitive/reading cost)
        words = len(o["question"].split()) + sum(len(x.split()) for x in options)
        imgs = o.get("images", [])

        q = {
            "id": o["id"],
            "u": o["unitId"],
            "tg": tags,                       # topic tags (>=1; multi for 9.9%)
            "t": o["questionType"],           # MCQ | FRQ
            "w": words,                       # reading load (words)
            "no": len(options) if is_mcq else 0,
            "im": 1 if imgs else 0,
            "q": o["question"],
            "o": options,
            "l": o.get("optionLabels", []),
        }
        if imgs:
            q["img"] = [{"src": im.get("src", ""), "alt": im.get("alt", "")} for im in imgs]
        courses[cid]["q"].append(q)

        units = meta[cid]["units"]
        if o["unitId"] not in units:
            units[o["unitId"]] = {"name": o["unitName"], "count": 0, "cats": collections.Counter()}
        u = units[o["unitId"]]
        u["count"] += 1
        for t in (tags or ["<none>"]):
            u["cats"][t] += 1


# ---- global length bands (terciles over reading load) ----
all_words = sorted(q["w"] for c in courses.values() for q in c["q"])
N = len(all_words)
LB1 = all_words[N // 3]        # short  : w <= LB1
LB2 = all_words[2 * N // 3]    # medium : LB1 < w <= LB2 ; long : w > LB2


def length_band(w):
    return 0 if w <= LB1 else (1 if w <= LB2 else 2)


def difficulty_scores(qs):
    """Return dict id->d in [0,1]. d = percentile of a reading-load-led composite
    within the course, nudged up by 5-option and image questions. Honest prior only."""
    ws = sorted(q["w"] for q in qs)
    n = len(ws)
    def wpct(w):
        lo, hi = 0, n
        while lo < hi:
            mid = (lo + hi) // 2
            if ws[mid] < w: lo = mid + 1
            else: hi = mid
        return lo / n if n else 0.0
    comp = {}
    for q in qs:
        c = 0.78 * wpct(q["w"]) + (0.14 if q["no"] >= 5 else 0.0) + (0.08 if q["im"] else 0.0)
        comp[q["id"]] = min(1.0, c)
    order = sorted(qs, key=lambda q: comp[q["id"]])
    d = {}
    for i, q in enumerate(order):
        d[q["id"]] = round((i + 0.5) / n, 5) if n else 0.0
    return d


# ---- write per-course files + index ----
index = {"lengthBands": [LB1, LB2], "courses": []}
for cid, data in courses.items():
    s = slug(cid)
    qs = data["q"]
    d = difficulty_scores(qs)
    for q in qs:
        q["d"] = d[q["id"]]
        q["lb"] = length_band(q["w"])
    mcq = sum(1 for x in qs if x["t"] == "MCQ")
    frq = len(qs) - mcq

    # Does this course have REAL topic codes, or just skill/unit-label noise?
    topic_qs = sum(1 for q in qs if any(is_topic_code(t) for t in q["tg"]))
    has_topics = topic_qs >= 0.5 * len(qs)

    # ---- facet availability (only render a control that actually varies) ----
    img_n = sum(q["im"] for q in qs)
    bands = set(q["lb"] for q in qs)
    opt_counts = collections.Counter(q["no"] for q in qs if q["t"] == "MCQ")
    opt_list = sorted(k for k, v in opt_counts.items() if v >= 20)  # ignore stray outliers
    # A facet is only worth a control if it represents a real split, not a
    # handful of outliers (e.g. Eng Lit has diagrams on ~1% of questions).
    img_frac = img_n / len(qs)
    # Only offer length bands that actually occur (Eng Lang is all long, so a
    # "Short" chip there would always yield 0). Same present-values rule as options.
    band_list = sorted(b for b in bands if sum(1 for q in qs if q["lb"] == b) >= 20)
    facets = {
        "topic": has_topics,
        "type": frq >= 20 and mcq >= 20,
        "length": band_list if len(band_list) > 1 else [],
        "image": 0.05 <= img_frac <= 0.95,
        "options": opt_list if len(opt_list) > 1 else [],
    }

    # ---- heavy per-unit files (full question text) ----
    byunit = collections.OrderedDict()
    for q in qs:
        byunit.setdefault(q["u"], []).append(q)
    for uid, arr in byunit.items():
        with open(os.path.join(COURSE_OUT, f"{s}--{uid}.json"), "w", encoding="utf-8") as w:
            json.dump(arr, w, ensure_ascii=False, separators=(",", ":"))

    # ---- light facet index (NO stem/options text) drives live match counts ----
    facet_rows = [
        {"id": q["id"], "u": q["u"], "tg": q["tg"], "t": q["t"],
         "lb": q["lb"], "im": q["im"], "no": q["no"], "d": q["d"]}
        for q in qs
    ]
    with open(os.path.join(COURSE_OUT, f"{s}--facets.json"), "w", encoding="utf-8") as w:
        json.dump(facet_rows, w, ensure_ascii=False, separators=(",", ":"))

    # ---- units for the browse tree (suppress garbage cats on non-topic courses) ----
    curated_units = CURATED.get(data["name"], {}).get("units", [])
    units_out = []
    for uid, u in meta[cid]["units"].items():
        if has_topics:
            cats = [{"id": c, "count": n} for c, n in
                    sorted(((c, n) for c, n in u["cats"].items() if c != "<none>"),
                           key=lambda kv: cat_key(kv[0]))]
        else:
            cats = []
        title = u["name"]
        m = re.fullmatch(r"Unit (\d+)", title)
        if m:
            i = int(m.group(1)) - 1
            if 0 <= i < len(curated_units):
                title = curated_units[i]
        units_out.append({"id": uid, "name": title, "raw": u["name"], "count": u["count"], "cats": cats})

    index["courses"].append({
        "id": cid, "slug": s, "name": data["name"],
        "count": len(qs), "mcq": mcq, "frq": frq,
        "topics": sum(len(u["cats"]) for u in units_out) if has_topics else 0,
        "facets": facets,
        "units": units_out,
    })

index["courses"].sort(key=lambda c: c["name"])
with open(os.path.join(IDX_OUT, "index.json"), "w", encoding="utf-8") as w:
    json.dump(index, w, ensure_ascii=False, separators=(",", ":"))

total = sum(len(d["q"]) for d in courses.values())
print(f"Courses: {len(courses)}  Questions: {total}  length terciles: <= {LB1}w / {LB2}w")
print(f"(curated unit names: {'yes' if CURATED else 'no'})")
