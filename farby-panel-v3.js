/* =====================================================================
   Farebný panel pre demo web (len na tvorbu, nenahrávať na ostrý web)
   Otvára sa tlačidlom "Farby" vpravo dole na stránke.
   ===================================================================== */

/* ---- Supabase: doplň Project URL a kľúč (publishable alebo anon) ----
   Kým je to prázdne, presety sa ukladajú len v tomto prehliadači. */
const SUPABASE_URL = "https://ngajutitdasnvirdpzjn.supabase.co/";
const SUPABASE_KEY = "sb_publishable_cO1BxVyzpwYAx_E5LDSTog_-tyuVTkT";
const SUPABASE_TABULKA = "farebne_presety";
const WEB_ID = "demo-v1"; // aby sa presety rôznych webov nemiešali

(function () {
  "use strict";

  const POVODNE = { hlavna: "#3F6B5C", tmava: "#23302B", pozadie: "#F7F5F1" };

  const ZAKLAD = [
    { k: "hlavna", v: "--f-hlavna", nazov: "1  Hlavná", popis: "ikony, nadpisky, tlačidlá" },
    { k: "tmava", v: "--f-tmava", nazov: "2  Tmavá", popis: "text, pätička" },
    { k: "pozadie", v: "--f-pozadie", nazov: "3  Pozadie", popis: "hero, karty, FAQ" },
  ];
  const POKROCILE = [
    { k: "svetla", v: "--f-svetla", nazov: "Svetlá tónovaná", popis: "tlačidlá v menu, kolieska" },
    { k: "linka", v: "--f-linka", nazov: "Linky", popis: "oddeľovače, okraje kariet" },
    { k: "tlmeny", v: "--f-text-tlmeny", nazov: "Tlmený text", popis: "popisy pod nadpismi" },
    { k: "tlacidloText", v: "--f-text-na-svetlej", nazov: "Text na tlačidlách", popis: "na svetlých tlačidlách" },
  ];
  const VSETKY = ZAKLAD.concat(POKROCILE);
  const root = document.documentElement;
  const supabaseZapnuty = !!(SUPABASE_URL && SUPABASE_KEY);

  /* ---------- pomocné ---------- */
  const ls = {
    get(k, d) { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const jeHex = (h) => /^#[0-9a-f]{6}$/i.test(h);
  function normHex(h) {
    h = (h || "").trim();
    if (!h.startsWith("#")) h = "#" + h;
    if (/^#[0-9a-f]{3}$/i.test(h)) h = "#" + h.slice(1).split("").map((c) => c + c).join("");
    return jeHex(h) ? h.toUpperCase() : null;
  }

  // vypočítaná farba premennej (funguje aj s color-mix)
  const sonda = document.createElement("span");
  sonda.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(sonda);
  function rgbPremennej(premenna) {
    sonda.style.color = "var(" + premenna + ")";
    const c = getComputedStyle(sonda).color;
    let m = c.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    m = c.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)/);
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255];
    return [0, 0, 0];
  }
  const naHex = (rgb) => "#" + rgb.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("").toUpperCase();
  function jas(rgb) {
    const [r, g, b] = rgb.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function kontrast(a, b) {
    const l1 = jas(a), l2 = jas(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /* ---------- stav ---------- */
  let stav = ls.get("farby-aktualne", Object.assign({}, POVODNE));

  function aplikuj() {
    VSETKY.forEach((p) => {
      if (stav[p.k]) root.style.setProperty(p.v, stav[p.k]);
      else root.style.removeProperty(p.v);
    });
    ls.set("farby-aktualne", stav);
  }
  aplikuj();

  /* ---------- štýl panela (vlastné farby, web ho neovplyvní) ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .fp-tab{position:fixed;right:20px;bottom:20px;z-index:5001;display:flex;align-items:center;gap:8px;background:#1d1d1f;color:#fff;border:0;border-radius:999px;padding:12px 18px 12px 14px;cursor:pointer;font:600 14px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}
  .fp-tab:hover{transform:translateY(-2px)}
  .fp-tab svg{width:20px;height:20px}
  .fp{position:fixed;top:0;right:0;height:100vh;width:340px;max-width:92vw;z-index:5000;background:#fff;color:#1d1d1f;font:14px/1.4 system-ui,-apple-system,sans-serif;box-shadow:-10px 0 40px rgba(0,0,0,.18);transform:translateX(105%);transition:transform .3s ease;display:flex;flex-direction:column}
  .fp.otv{transform:none}
  .fp *{box-sizing:border-box;font-family:inherit}
  .fp-hlava{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #eee}
  .fp-hlava b{font-size:16px}
  .fp-x{background:none;border:0;font-size:22px;cursor:pointer;color:#666;line-height:1}
  .fp-telo{overflow-y:auto;padding:14px 18px 24px;flex:1}
  .fp h4{margin:18px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888}
  .fp h4:first-child{margin-top:4px}
  .fp-riadok{display:grid;grid-template-columns:40px 1fr 86px;gap:10px;align-items:center;padding:6px 0}
  .fp-riadok input[type=color]{width:40px;height:40px;border:1px solid #ddd;border-radius:10px;padding:2px;background:#fff;cursor:pointer}
  .fp-riadok .fp-n{font-weight:600;font-size:13.5px}
  .fp-riadok .fp-p{font-size:11.5px;color:#888}
  .fp-hex{width:86px;padding:7px 8px;border:1px solid #ddd;border-radius:8px;font:12.5px ui-monospace,monospace;text-transform:uppercase}
  .fp-hex.zle{border-color:#d33}
  .fp-auto{font-size:11px;color:#888;display:flex;gap:4px;align-items:center;margin-top:2px;cursor:pointer}
  .fp-riadok.je-auto input[type=color],.fp-riadok.je-auto .fp-hex{opacity:.45}
  .fp details summary{cursor:pointer;font-weight:600;font-size:13px;padding:8px 0;color:#444}
  .fp-kon{display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0}
  .fp-kon .ok{color:#1a7f37;font-weight:600}.fp-kon .zle{color:#c62828;font-weight:600}
  .fp-btn{border:1px solid #ddd;background:#f6f6f6;color:#1d1d1f;border-radius:999px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:600}
  .fp-btn:hover{background:#ececec}
  .fp-btn.hl{background:#1d1d1f;color:#fff;border-color:#1d1d1f}
  .fp-btn.hl:hover{background:#000}
  .fp-rad{display:flex;gap:8px;flex-wrap:wrap}
  .fp-ulozit{display:flex;gap:8px}
  .fp-ulozit input{flex:1;padding:8px 10px;border:1px solid #ddd;border-radius:999px;font-size:13px;min-width:0}
  .fp-zoznam{display:flex;flex-direction:column;gap:6px;margin-top:10px}
  .fp-preset{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #eee;border-radius:12px;cursor:pointer}
  .fp-preset:hover{border-color:#bbb;background:#fafafa}
  .fp-preset.akt{border-color:#1d1d1f}
  .fp-kruhy{display:flex}
  .fp-kruhy i{width:18px;height:18px;border-radius:50%;border:2px solid #fff;margin-left:-5px;box-shadow:0 0 0 1px #ddd}
  .fp-kruhy i:first-child{margin-left:0}
  .fp-preset span{flex:1;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fp-del{background:none;border:0;color:#aaa;font-size:18px;cursor:pointer;padding:0 4px}
  .fp-del:hover{color:#c62828}
  .fp-info{font-size:11.5px;color:#888;margin-top:6px}
  .fp-hlaska{position:fixed;right:360px;bottom:20px;z-index:5002;background:#1d1d1f;color:#fff;padding:10px 14px;border-radius:10px;font:13px system-ui,sans-serif;opacity:0;transition:opacity .2s;pointer-events:none}
  .fp-hlaska.vid{opacity:1}
  @media(max-width:700px){.fp-hlaska{right:20px}}
  `;
  document.head.appendChild(css);

  /* ---------- HTML panela ---------- */
  const tab = document.createElement("button");
  tab.className = "fp-tab";
  tab.title = "Zmeniť farby webu";
  tab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/></svg>Farby';
  const panel = document.createElement("aside");
  panel.className = "fp";
  panel.innerHTML = `
    <div class="fp-hlava"><b>Farby webu</b><button class="fp-x" title="Zavrieť">×</button></div>
    <div class="fp-telo">
      <h4>Základné farby</h4>
      <div id="fp-zaklad"></div>
      <details id="fp-pokr"><summary>Pokročilé (inak sa dopočítajú)</summary><div id="fp-pokrocile"></div></details>

      <h4>Čitateľnosť</h4>
      <div id="fp-kontrast"></div>

      <h4>Presety</h4>
      <button class="fp-btn hl" id="fp-uloz" style="width:100%;padding:11px 14px">+ Uložiť aktuálne farby ako preset</button>
      <div class="fp-zoznam" id="fp-zoznam"></div>
      <div class="fp-info" id="fp-zdroj"></div>

      <h4>Ďalšie</h4>
      <div class="fp-rad">
        <button class="fp-btn" id="fp-reset">Pôvodné farby</button>
        <button class="fp-btn" id="fp-css">Kopírovať CSS</button>
      </div>
      <div class="fp-info">„Kopírovať CSS" ti dá blok :root s aktuálnymi farbami, ktorý vložíš natrvalo do webu.</div>
    </div>`;
  const hlaska = document.createElement("div");
  hlaska.className = "fp-hlaska";
  document.body.append(tab, panel, hlaska);
  const $ = (id) => panel.querySelector("#" + id);

  let casHlasky;
  function oznam(t) {
    hlaska.textContent = t;
    hlaska.classList.add("vid");
    clearTimeout(casHlasky);
    casHlasky = setTimeout(() => hlaska.classList.remove("vid"), 2200);
  }

  function otvor(ano) {
    panel.classList.toggle("otv", ano);
    tab.style.display = ano ? "none" : "";
    ls.set("farby-panel-otvoreny", ano);
  }
  tab.onclick = () => otvor(true);
  panel.querySelector(".fp-x").onclick = () => otvor(false);
  if (ls.get("farby-panel-otvoreny", false)) otvor(true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("otv")) otvor(false); });

  /* ---------- riadky s farbami ---------- */
  function riadok(p, pokrocily) {
    const el = document.createElement("div");
    el.className = "fp-riadok";
    el.innerHTML = `
      <input type="color">
      <div><div class="fp-n">${p.nazov}</div><div class="fp-p">${p.popis}</div>
        ${pokrocily ? '<label class="fp-auto"><input type="checkbox"> automaticky</label>' : ""}</div>
      <input class="fp-hex" maxlength="7" spellcheck="false">`;
    const farba = el.querySelector("input[type=color]");
    const hex = el.querySelector(".fp-hex");
    const auto = el.querySelector(".fp-auto input");

    function nastav(h) {
      stav[p.k] = h;
      if (auto) auto.checked = false;
      aplikuj();
      obnov();
    }
    farba.oninput = () => nastav(farba.value.toUpperCase());
    hex.oninput = () => {
      const h = normHex(hex.value);
      hex.classList.toggle("zle", !h);
      if (h) nastav(h);
    };
    hex.onblur = () => { hex.classList.remove("zle"); obnov(); };
    if (auto) auto.onchange = () => {
      if (auto.checked) delete stav[p.k];
      else stav[p.k] = naHex(rgbPremennej(p.v));
      aplikuj();
      obnov();
    };
    el._obnov = () => {
      const h = stav[p.k] || naHex(rgbPremennej(p.v));
      farba.value = h.toLowerCase();
      if (document.activeElement !== hex) hex.value = h;
      if (auto) { auto.checked = !stav[p.k]; el.classList.toggle("je-auto", !stav[p.k]); }
    };
    return el;
  }
  const riadky = [];
  ZAKLAD.forEach((p) => { const r = riadok(p, false); riadky.push(r); $("fp-zaklad").appendChild(r); });
  POKROCILE.forEach((p) => { const r = riadok(p, true); riadky.push(r); $("fp-pokrocile").appendChild(r); });
  if (POKROCILE.some((p) => stav[p.k])) $("fp-pokr").open = true;

  /* ---------- kontrola kontrastu ---------- */
  const KONTROLY = [
    ["Text na pozadí", "--f-tmava", "--f-pozadie"],
    ["Text na bielej", "--f-tmava", null],
    ["Tlmený text na bielej", "--f-text-tlmeny", null],
    ["Biela na hlavnej (tlačidlo)", null, "--f-hlavna"],
    ["Text na svetlých tlačidlách", "--f-text-na-svetlej", "--f-svetla"],
    ["Biela na tmavej (pätička)", null, "--f-tmava"],
  ];
  function obnovKontrast() {
    const biela = [255, 255, 255];
    $("fp-kontrast").innerHTML = KONTROLY.map(([n, a, b]) => {
      const k = kontrast(a ? rgbPremennej(a) : biela, b ? rgbPremennej(b) : biela);
      const ok = k >= 4.5;
      return `<div class="fp-kon"><span>${n}</span><span class="${ok ? "ok" : "zle"}">${k.toFixed(1)} ${ok ? "✓" : "⚠ slabé"}</span></div>`;
    }).join("");
  }

  function obnov() {
    riadky.forEach((r) => r._obnov());
    obnovKontrast();
    obnovZoznam();
  }

  /* ---------- presety: Supabase alebo prehliadač ---------- */
  const VSTAVANE = [{ id: "povodne", nazov: "Pôvodná zelená", farby: Object.assign({}, POVODNE), vstavany: true }];
  let presety = [];

  // starý "anon" kľúč (eyJ...) ide aj do Authorization, nový "publishable" (sb_publishable_...) len do apikey
  const sbHlavicky = () => Object.assign(
    { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    SUPABASE_KEY.startsWith("eyJ") ? { Authorization: "Bearer " + SUPABASE_KEY } : {}
  );
  const sbUrl = (q) => SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + SUPABASE_TABULKA + (q || "");

  async function nacitajPresety() {
    if (supabaseZapnuty) {
      try {
        const r = await fetch(sbUrl("?select=id,nazov,farby&web=eq." + encodeURIComponent(WEB_ID) + "&order=created_at.desc"), { headers: sbHlavicky() });
        if (!r.ok) throw new Error(r.status + " " + (await r.text()));
        presety = await r.json();
        $("fp-zdroj").textContent = "Presety sa ukladajú do Supabase.";
      } catch (e) {
        console.error("Supabase:", e);
        presety = ls.get("farby-presety", []);
        $("fp-zdroj").textContent = "Supabase nedostupný, zobrazujem presety z prehliadača. (" + e.message + ")";
      }
    } else {
      presety = ls.get("farby-presety", []);
      $("fp-zdroj").textContent = "Supabase nie je nastavený, presety sú len v tomto prehliadači.";
    }
    obnovZoznam();
  }

  async function ulozPreset(nazov) {
    const farby = Object.assign({}, stav);
    if (supabaseZapnuty) {
      const r = await fetch(sbUrl(), {
        method: "POST",
        headers: Object.assign(sbHlavicky(), { Prefer: "return=representation" }),
        body: JSON.stringify({ nazov, farby, web: WEB_ID }),
      });
      if (!r.ok) throw new Error(r.status + " " + (await r.text()));
      const [novy] = await r.json();
      presety.unshift(novy);
    } else {
      presety.unshift({ id: "l" + Date.now(), nazov, farby });
      ls.set("farby-presety", presety);
    }
    obnovZoznam();
  }

  async function zmazPreset(id) {
    if (supabaseZapnuty) {
      const r = await fetch(sbUrl("?id=eq." + encodeURIComponent(id)), { method: "DELETE", headers: sbHlavicky() });
      if (!r.ok) throw new Error(r.status + " " + (await r.text()));
    }
    presety = presety.filter((p) => p.id !== id);
    if (!supabaseZapnuty) ls.set("farby-presety", presety);
    obnovZoznam();
  }

  const rovnake = (a, b) => VSETKY.every((p) => (a[p.k] || "").toUpperCase() === (b[p.k] || "").toUpperCase());

  function obnovZoznam() {
    const vsetky = VSTAVANE.concat(presety);
    $("fp-zoznam").innerHTML = vsetky.map((p, i) => `
      <div class="fp-preset${rovnake(p.farby || {}, stav) ? " akt" : ""}" data-i="${i}">
        <div class="fp-kruhy"><i style="background:${esc(p.farby.hlavna)}"></i><i style="background:${esc(p.farby.tmava)}"></i><i style="background:${esc(p.farby.pozadie)}"></i></div>
        <span>${esc(p.nazov)}</span>
        ${p.vstavany ? "" : '<button class="fp-del" title="Zmazať">×</button>'}
      </div>`).join("");
    $("fp-zoznam").querySelectorAll(".fp-preset").forEach((el) => {
      const p = vsetky[+el.dataset.i];
      el.onclick = (e) => {
        if (e.target.classList.contains("fp-del")) {
          if (confirm('Zmazať preset "' + p.nazov + '"?')) zmazPreset(p.id).then(() => oznam("Zmazané")).catch((er) => oznam("Chyba: " + er.message));
          return;
        }
        stav = {};
        VSETKY.forEach((x) => { const h = p.farby[x.k] && normHex(p.farby[x.k]); if (h) stav[x.k] = h; });
        aplikuj();
        obnov();
        oznam("Preset „" + p.nazov + "\" použitý");
      };
    });
  }

  $("fp-uloz").onclick = async () => {
    const nazov = (prompt("Ako sa má preset volať?", "") || "").trim();
    if (!nazov) return;
    const btn = $("fp-uloz");
    btn.disabled = true;
    btn.textContent = "Ukladám...";
    try {
      await ulozPreset(nazov.slice(0, 60));
      oznam("Preset „" + nazov + "\" uložený");
    } catch (e) {
      console.error(e);
      alert("Uloženie zlyhalo:\n" + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "+ Uložiť aktuálne farby ako preset";
    }
  };

  /* ---------- ďalšie tlačidlá ---------- */
  $("fp-reset").onclick = () => { stav = Object.assign({}, POVODNE); aplikuj(); obnov(); oznam("Pôvodné farby"); };

  $("fp-css").onclick = async () => {
    const riadkyCss = VSETKY.filter((p) => stav[p.k]).map((p) => "  " + p.v + ": " + stav[p.k] + ";");
    const text = ":root {\n" + riadkyCss.join("\n") + "\n}";
    try { await navigator.clipboard.writeText(text); oznam("CSS skopírované"); }
    catch (e) { prompt("Skopíruj CSS:", text.replace(/\n/g, " ")); }
  };

  obnov();
  nacitajPresety();
})();
