import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

type Item = any;

const TF_MAP: Record<string, string> = { "5m":"5","15m":"15","30m":"30","1h":"60","4h":"240","1d":"D","1w":"W" };

export default function App(): JSX.Element {
  const [interval, setInterval] = useState("1h");
  const [limit, setLimit] = useState(30);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score"|"quoteVolume24h"|"symbol"|"price"|"marketCap">("score");
  const [sortDir, setSortDir] = useState<"desc"|"asc">("desc");
  const [page, setPage] = useState(1);
  const [filterSignal, setFilterSignal] = useState<"BUY"|"SELL"|"HOLD"|null>(null);
  const PAGE_SIZE = 20;

  useEffect(()=>{ load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [interval, limit]);

  async function load(){
    setLoading(true); setError(null);
    try{
      const clamped = Math.max(5, Math.min(80, Number(limit) || 30));
      const res = await fetch(`http://localhost:3001/api/top-signals?limit=${clamped}&interval=${interval}`);
      if(!res.ok){ const t = await res.text(); throw new Error(`${res.status} ${t}`); }
      const json = await res.json();
      setItems((json.results || []).filter((r:any)=>!r.error));
      setPage(1);
    }catch(err:any){ setError(err.message || String(err)); } finally { setLoading(false); }
  }

  const fmtNumber = (v:any) => typeof v === "number" ? v.toLocaleString() : "-";
  const fmtPrice = (v:any) => typeof v === "number" ? v.toLocaleString(undefined,{maximumFractionDigits:8}) : "-";
  const fmtMc = (v:any) => {
    if (typeof v !== "number") return "-";
    if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v/1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v/1e6).toFixed(2)}M`;
    return `$${Math.round(v).toLocaleString()}`;
  };

  // Yeni: hacmi kısa biçimde göster (piyasa değeri ile aynı stil, $ işareti olmadan)
  const fmtVol = (v:any) => {
    if (typeof v !== "number") return "-";
    if (v >= 1e12) return `${(v/1e12).toFixed(2)}T`;
    if (v >= 1e9) return `${(v/1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v/1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v/1e3).toFixed(2)}K`;
    return `${Math.round(v).toLocaleString()}`;
  };

  // toggle filter when clicking summary cards
  function toggleFilter(sig: "BUY"|"SELL"|"HOLD") {
    setPage(1);
    setFilterSignal(prev => prev === sig ? null : sig);
  }

  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    let arr = items.filter(i => !q || i.symbol.toLowerCase().includes(q) || (i.base||"").toLowerCase().includes(q));
    // apply summary-card filter (if any)
    if (filterSignal) arr = arr.filter(i => i.signal === filterSignal);
    arr = arr.sort((a,b) => {
      const aVal:any = sortBy === "symbol" ? (a.symbol||"") : (a as any)[sortBy] ?? 0;
      const bVal:any = sortBy === "symbol" ? (b.symbol||"") : (b as any)[sortBy] ?? 0;
      if (aVal === bVal) return 0;
      return sortDir === "desc" ? (aVal < bVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });
    return arr;
  }, [items, search, sortBy, sortDir, filterSignal]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function toggleSort(k: any){
    if (sortBy === k) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(k); setSortDir("desc"); }
  }

  function openTV(symbol:string){
    const tf = TF_MAP[interval] || "60";
    window.open(`https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}&interval=${tf}`, "_blank", "noopener");
  }

  return (
    <div className="pro-simple">
      <header className="header">
        <div className="branding">
          <div className="logo">CS</div>
          <div>
            <h1>Crypto Signal — Professional</h1>
            <p className="sub">Puanlama ve nedenler artık gerçek göstergelere dayalı ve piyasa değeri eklendi</p>
          </div>
        </div>

        <div className="controls">
          <input className="search" placeholder="Symbol ara (örn. BTCUSDT)" value={search} onChange={e => setSearch(e.target.value)} />
          {/* interval select: sınıf adında seçili interval bilgisi var (ör: interval-1h, interval-4h) */}
          <select
            className={`sel interval-${String(interval).replace(/[^a-zA-Z0-9]/g, "-")}`}
            value={interval}
            onChange={e => setInterval(e.target.value)}
          >
             <option value="5m">5m</option><option value="15m">15m</option><option value="30m">30m</option>
             <option value="1h">1h</option><option value="4h">4h</option><option value="1d">1d</option><option value="1w">1w</option>
           </select>

          {/* limit select kaldırıldı per kullanıcı isteği */}
 
           <button className="btn primary" onClick={load} disabled={loading}>{loading ? "Yükleniyor..." : "Yenile"}</button>
         </div>
      </header>

      <section className="summary">
        <div className={`stat clickable ${filterSignal === null ? "active-all": ""}`} onClick={() => setFilterSignal(null)}>
          <div className="stat-label">Toplam</div>
          <div className="stat-value">{items.length}</div>
        </div>

        <div className={`stat clickable ${filterSignal === "BUY" ? "active" : ""}`} onClick={() => toggleFilter("BUY")}>
          <div className="stat-label">BUY</div>
          <div className="stat-value">{items.filter(i => i.signal === "BUY").length}</div>
        </div>

        <div className={`stat clickable ${filterSignal === "SELL" ? "active" : ""}`} onClick={() => toggleFilter("SELL")}>
          <div className="stat-label">SELL</div>
          <div className="stat-value">{items.filter(i => i.signal === "SELL").length}</div>
        </div>

        <div className={`stat clickable ${filterSignal === "HOLD" ? "active" : ""}`} onClick={() => toggleFilter("HOLD")}>
          <div className="stat-label">HOLD</div>
          <div className="stat-value">{items.filter(i => i.signal === "HOLD").length}</div>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      <main>
        <table className="table">
          <thead>
            <tr>
              <th onClick={()=>toggleSort("symbol")}>Symbol</th>
              <th onClick={()=>toggleSort("price")} className="right">Fiyat</th>
              <th onClick={()=>toggleSort("quoteVolume24h")} className="right">24h Hacim</th>
              <th onClick={()=>toggleSort("marketCap")} className="right">Piyasa Değeri</th>
              <th onClick={()=>toggleSort("score")} className="right">Puan</th>
              <th className="center">Sinyal</th>
              <th>Neden (kısa)</th>
              <th className="center">Grafik</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(it=>(
              <tr key={it.symbol}>
                <td className="symbol"><button className="link" onClick={()=>openTV(it.symbol)}>{it.symbol}</button><div className="small">{it.base}</div></td>
                <td className="right">{fmtPrice(it.price)}</td>
                <td className="right">{fmtVol(it.quoteVolume24h)}</td>
                <td className="right">{fmtMc(it.marketCap)}</td>
                <td className="right"><div className={`score ${it.score>0?"pos":it.score<0?"neg":"neut"}`}>{typeof it.score==="number"?it.score:0}</div></td>
                <td className="center"><div className={`badge ${it.signal?.toLowerCase()}`}>{it.signal??"HOLD"}</div></td>
                <td className="reason">{(it.decisionReasons || it.reasons || []).slice(0,2).join(" · ")}</td>
                <td className="center"><button className="btn ghost" onClick={()=>openTV(it.symbol)}>Open</button></td>
              </tr>
            ))}
            {pageItems.length===0 && <tr><td colSpan={8} className="empty">{loading ? "Yükleniyor..." : "Sonuç yok"}</td></tr>}
          </tbody>
        </table>

        <div className="pager">
          <div>Sayfa {page} / {pageCount}</div>
          <div className="pager-controls">
            <button className="btn ghost" onClick={()=>setPage(1)} disabled={page===1}>«</button>
            <button className="btn ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
            <button className="btn ghost" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount}>›</button>
            <button className="btn ghost" onClick={()=>setPage(pageCount)} disabled={page===pageCount}>»</button>
          </div>
        </div>
      </main>
    </div>
  );
}
