import { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart } from "lightweight-charts";

type Market = { value: string; label: string; intervals: string[] };
type Candle = { open_time_ms: number; end_time_ms: number; open: number; high: number; low: number; close: number; volume: number | null };
type StreamMessage = { type: "candles" | "ready" | string; candles?: Candle[] };

const MARKETS: Market[] = [
  { value: "BTC/USDT", label: "BTC / USDT", intervals: ["4h", "1d"] },
  { value: "NDX/USD", label: "NDX / USD", intervals: ["1d"] },
  { value: "GOLD/USD", label: "GOLD / USD", intervals: ["1d"] },
  { value: "MU/USD", label: "MU / USD", intervals: ["1d"] },
  { value: "AAPL/USD", label: "AAPL / USD", intervals: ["1d"] },
];
const vaultOrigin = (import.meta.env.VITE_VAULT_BASE_URL || "https://quantor-vault.onichandame.com").replace(/\/$/, "");
const streamOrigin = vaultOrigin.replace(/^http/, "ws");
const formatPrice = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 6 });
const formatTime = (value: number) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value);

export function meta() { return [{ title: "Market Vault" }, { name: "description", content: "Live market data from Quantor Market Vault." }]; }

export default function Home() {
  const [market, setMarket] = useState(MARKETS[0].value);
  const [interval, setIntervalValue] = useState("4h");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [connection, setConnection] = useState<"connecting" | "live" | "error">("connecting");
  const [lastUpdate, setLastUpdate] = useState<number>();
  const [selected, setSelected] = useState<Candle>();
  const candlesRef = useRef<Candle[]>([]);
  const historyBusy = useRef(false);
  const oldestLoaded = useRef<number | undefined>(undefined);
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof createChart> | null>(null);
  const series = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null);
  const selectedMarket = useMemo(() => MARKETS.find((item) => item.value === market) ?? MARKETS[0], [market]);

  useEffect(() => {
    if (!chartRef.current) return;
    const instance = createChart(chartRef.current, { autoSize: true, layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#9aa7b5" }, grid: { vertLines: { color: "rgba(137, 153, 170, .12)" }, horzLines: { color: "rgba(137, 153, 170, .12)" } }, rightPriceScale: { borderColor: "rgba(137, 153, 170, .3)" }, timeScale: { borderColor: "rgba(137, 153, 170, .3)", timeVisible: true }, crosshair: { vertLine: { labelBackgroundColor: "#3b82f6" }, horzLine: { labelBackgroundColor: "#3b82f6" } } });
    const candleSeries = instance.addSeries(CandlestickSeries, { upColor: "#3fb950", downColor: "#f85149", wickUpColor: "#3fb950", wickDownColor: "#f85149", borderVisible: false });
    instance.subscribeCrosshairMove((param) => { const value = param.seriesData.get(candleSeries); if (value && "time" in value) { const candle = candlesRef.current.find((item) => item.open_time_ms / 1000 === value.time); if (candle) setSelected(candle); } });
    chart.current = instance; series.current = candleSeries;
    return () => { instance.remove(); chart.current = null; series.current = null; };
  }, []);

  useEffect(() => { candlesRef.current = candles; series.current?.setData(candles.map((candle) => ({ time: candle.open_time_ms / 1000 as never, open: candle.open, high: candle.high, low: candle.low, close: candle.close }))); if (candles.length) chart.current?.timeScale().fitContent(); setSelected(candles.at(-1)); }, [candles]);

  const loadEarlier = async () => {
    if (historyBusy.current || candlesRef.current.length === 0) return;
    const before = candlesRef.current[0].open_time_ms;
    if (oldestLoaded.current === before) return;
    historyBusy.current = true;
    try {
      const response = await fetch(`${vaultOrigin}/v1/candles?market=${encodeURIComponent(market)}&interval=${encodeURIComponent(interval)}&limit=300&before=${before}`, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`Vault history request failed (${response.status})`);
      const payload = await response.json() as { candles?: Candle[] };
      const earlier = payload.candles ?? [];
      oldestLoaded.current = before;
      if (earlier.length) {
        const range = chart.current?.timeScale().getVisibleLogicalRange();
        setCandles((current) => {
          const next = new Map(current.map((item) => [item.open_time_ms, item]));
          earlier.forEach((item) => next.set(item.open_time_ms, item));
          return [...next.values()].sort((a, b) => a.open_time_ms - b.open_time_ms);
        });
        requestAnimationFrame(() => {
          if (range) chart.current?.timeScale().setVisibleLogicalRange({ from: range.from + earlier.length, to: range.to + earlier.length });
        });
      }
    } catch (error) {
      console.warn(error);
    } finally { historyBusy.current = false; }
  };

  useEffect(() => {
    const instance = chart.current;
    if (!instance) return;
    const onRange = (range: { from: number; to: number } | null) => { if (range && range.from < 20) void loadEarlier(); };
    instance.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    return () => instance.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
  }, [market, interval]);

  useEffect(() => {
    setCandles([]); oldestLoaded.current = undefined; setConnection("connecting");
    const socket = new WebSocket(`${streamOrigin}/v1/candles/stream?market=${encodeURIComponent(market)}&interval=${encodeURIComponent(interval)}&limit=300`);
    socket.onmessage = (event) => { try { const message = JSON.parse(event.data) as StreamMessage; if (message.type === "candles" && message.candles) { setCandles((current) => { const next = new Map(current.map((item) => [item.open_time_ms, item])); message.candles?.forEach((item) => next.set(item.open_time_ms, item)); return [...next.values()].sort((a, b) => a.open_time_ms - b.open_time_ms); }); setLastUpdate(Date.now()); } if (message.type === "ready") setConnection("live"); } catch { setConnection("error"); } };
    socket.onerror = () => setConnection("error"); socket.onclose = () => setConnection("error");
    return () => socket.close();
  }, [market, interval]);

  const statusLabel = connection === "live" ? "Live stream" : connection === "connecting" ? "Connecting" : "Stream unavailable";
  const latest = candles.at(-1);
  return <main className="vault-shell">
    <header className="topbar"><div className="brand-mark" aria-hidden="true"><span>MV</span></div><div><p className="eyebrow">QUANTOR / PUBLIC MARKET DATA</p><h1>Market Vault</h1></div><div className={`connection ${connection}`}><span className="status-dot" />{statusLabel}</div></header>
    <section className="workspace">
      <div className="intro-row"><div><p className="eyebrow">LIVE SERIES</p><h2>{selectedMarket.label}</h2><p className="intro-copy">Closed candles delivered directly from the Vault stream.</p></div><div className="latest-readout"><span>Latest close</span><strong>{latest ? formatPrice(latest.close) : "—"}</strong><small>{latest ? formatTime(latest.end_time_ms) : "Waiting for data"}</small></div></div>
      <div className="controls" aria-label="Market controls"><label>Market<select value={market} onChange={(event) => { setMarket(event.target.value); setIntervalValue(MARKETS.find((item) => item.value === event.target.value)?.intervals[0] ?? "1d"); }}>{MARKETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Interval<select value={interval} onChange={(event) => setIntervalValue(event.target.value)}>{selectedMarket.intervals.map((item) => <option key={item}>{item}</option>)}</select></label><div className="stream-note"><span className="pulse" /> WebSocket stream · 300 candles</div></div>
      <section className="chart-panel" aria-label={`${selectedMarket.label} candlestick chart`}><div className="chart-meta"><span>{selectedMarket.label} · {interval}</span><span>{lastUpdate ? `Updated ${formatTime(lastUpdate)}` : "Awaiting first update"}</span></div><div ref={chartRef} className="chart" />{selected && <div className="ohlc"><span>O <b>{formatPrice(selected.open)}</b></span><span>H <b>{formatPrice(selected.high)}</b></span><span>L <b>{formatPrice(selected.low)}</b></span><span>C <b>{formatPrice(selected.close)}</b></span><span>{formatTime(selected.open_time_ms)}</span></div>}</section>
    </section><footer><span>Market Vault API</span><span>Source-independent public series</span></footer>
  </main>;
}
