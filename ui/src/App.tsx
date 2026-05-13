import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import TransactionForm from "./components/TransactionForm";
import UserPreferences from "./components/UserPreferences";
import Architecture from "./components/Architecture";
import { Toaster, toast } from "./components/Toaster";

export default function App() {
  const [data, setData] = useState({
    transactions: [],
    notifications: [],
    stats: { total: 0, buys: 0, sells: 0, value: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showArch, setShowArch] = useState(false);
  const userId = "user123";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fetchData = useCallback(async () => {
    try {
      const [txRes, notifRes] = await Promise.all([
        axios.get(`${apiUrl}/api/portfolio/transactions/user/${userId}`),
        axios.get(`${apiUrl}/api/notifications/recent?limit=10`),
      ]);

      const txs = txRes.data.data || [];
      const notifs = notifRes.data.data || [];

      const buys = txs.filter((t: any) => t.type === "BUY");
      const sells = txs.filter((t: any) => t.type === "SELL");
      const value = txs.reduce(
        (s: number, t: any) => s + Number(t.quantity) * Number(t.price),
        0,
      );

      setData({
        transactions: txs,
        notifications: notifs,
        stats: {
          total: txs.length,
          buys: buys.length,
          sells: sells.length,
          value,
        },
      });
    } catch {
      toast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, userId]);

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh", fetchData);
    return () => window.removeEventListener("refresh", fetchData);
  }, [fetchData]);

  return (
    <div className="app-container" style={{ maxWidth: "1000px" }}>
      <Toaster />
      {showArch && <Architecture onClose={() => setShowArch(false)} />}
      <header>
        <div>
          <h1>Portfolio Activity</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <p className="feed-meta">
              Active Session: <span className="mono">{userId}</span>
            </p>
            <button 
              onClick={() => setShowArch(true)} 
              className="btn" 
              style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px" }}
            >
              View Architecture ↗
            </button>
          </div>
        </div>
        <button onClick={fetchData} className="btn" disabled={loading}>
          Refresh
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">
            $
            {data.stats.value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Orders</div>
          <div className="stat-value">{data.stats.total}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Buy / Sell</div>
          <div className="stat-value">
            {data.stats.buys} / {data.stats.sells}
          </div>
        </div>
      </div>

      <div className="card-stack">
        <TransactionForm userId={userId} />
        <UserPreferences userId={userId} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div className="card">
          <h2>Recent History (Last 5)</h2>
          <div className={loading ? "loading" : ""}>
            {data.transactions.length === 0 ? (
              <p className="feed-meta">No activity recorded yet.</p>
            ) : (
              data.transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="feed-item">
                  <div className="feed-info">
                    <div className="feed-title">
                      {tx.assetSymbol}{" "}
                      <span className={`badge badge-${tx.type.toLowerCase()}`}>
                        {tx.type}
                      </span>
                    </div>
                    <div className="feed-meta">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="feed-value">
                    <div className="feed-price">
                      $
                      {(
                        Number(tx.quantity) * Number(tx.price)
                      ).toLocaleString()}
                    </div>
                    <div className="feed-sub">
                      {tx.quantity} @ ${Number(tx.price).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2>Notifications (Last 5)</h2>
          <div className={loading ? "loading" : ""}>
            {data.notifications.length === 0 ? (
              <p className="feed-meta">No events recorded.</p>
            ) : (
              data.notifications.slice(0, 5).map((n: any) => {
                const statusColor = n.status === 'SENT' ? 'var(--success)' : 
                                   n.status === 'SKIPPED' ? 'var(--text-muted)' :
                                   n.status === 'PENDING' ? '#eab308' : 'var(--error)';
                return (
                  <div
                    key={n.id}
                    className="feed-item"
                    style={{
                      borderLeft: `3px solid ${statusColor}`,
                      paddingLeft: "12px",
                    }}
                  >
                    <div className="feed-info">
                      <div className="feed-title" style={{ fontSize: "13px" }}>
                        {n.message}
                      </div>
                      <div className="feed-meta">
                        {new Date(n.createdAt).toLocaleTimeString()} •{" "}
                        <span className="mono" style={{ color: statusColor, fontWeight: 'bold' }}>
                          {n.status === 'PENDING' ? 'PROCESSING...' : n.status}
                        </span>
                        {n.errorMessage && (
                          <span style={{ marginLeft: '4px', opacity: 0.8 }}>({n.errorMessage})</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export { toast };
