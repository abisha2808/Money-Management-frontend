import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

export default function Dashboard() {
  const [view, setView] = useState("MONTHLY"); // WEEKLY / MONTHLY / YEARLY
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // ✅ get email from localStorage (login user)
  const getUserEmail = () => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return "abisha@gmail.com"; // fallback (until login fully done)
      const user = JSON.parse(raw);
      return user?.email || "abisha@gmail.com";
    } catch {
      return "abisha@gmail.com";
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    setErrMsg("");

    const email = getUserEmail();

    try {
      // ✅ Your backend endpoint (as you used in Home)
      const res = await api.get(`/records/user/${encodeURIComponent(email)}`);

      const data = Array.isArray(res.data) ? res.data : [];

      const mapped = data.map((r) => ({
        id: r.id || r._id,
        type: (r.type || r.recordType || "").toUpperCase(), // INCOME/EXPENSE
        dateTime: r.dateTime || r.createdAt || "", // must be string
        description: r.description || r.title || "",
        category: r.category || "Others",
        division: (r.division || "PERSONAL").toUpperCase(),
        amount: Number(r.amount || 0),
      }));

      setHistory(mapped);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load records";

      setErrMsg(status ? `${msg} (HTTP ${status})` : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // ✅ Filter records based on view
  const filteredByView = useMemo(() => {
    const now = new Date();

    return history.filter((item) => {
      if (!item.dateTime) return false;
      const d = new Date(item.dateTime);

      if (view === "YEARLY") return d.getFullYear() === now.getFullYear();

      if (view === "MONTHLY") {
        return (
          d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        );
      }

      // WEEKLY = last 7 days
      const diffMs = now.getTime() - d.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });
  }, [history, view]);

  // ✅ Summary cards
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const item of filteredByView) {
      if (item.type === "INCOME") income += item.amount;
      if (item.type === "EXPENSE") expense += item.amount;
    }

    return { income, expense, balance: income - expense };
  }, [filteredByView]);

  // ✅ Recent list (top 10)
  const recent = useMemo(() => {
    return [...filteredByView]
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 10);
  }, [filteredByView]);

  // ✅ CATEGORY SUMMARY (based on the selected view)
  const categorySummary = useMemo(() => {
    const map = {};

    filteredByView.forEach((item) => {
      const cat = item.category || "Others";
      map[cat] = (map[cat] || 0) + (item.amount || 0);
    });

    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredByView]);

  return (
    <div className="content-wrapper">
      <div className="dash-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Weekly / Monthly / Yearly summary</p>
        </div>

        <select value={view} onChange={(e) => setView(e.target.value)}>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      </div>

      {loading ? (
        <p style={{ padding: 12 }}>Loading...</p>
      ) : errMsg ? (
        <p style={{ padding: 12, color: "crimson" }}>{errMsg}</p>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="dash-cards">
            <div className="dash-card">
              <div className="dash-card-title">Income</div>
              <div className="dash-card-value">
                ₹ {summary.income.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-title">Expense</div>
              <div className="dash-card-value">
                ₹ {summary.expense.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-title">Balance</div>
              <div className="dash-card-value">
                ₹ {summary.balance.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* RECENT HISTORY */}
          <div className="table-card">
            <div className="table-title">Recent History</div>

            {recent.length === 0 ? (
              <p style={{ padding: 12 }}>No transactions found.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id}>
                      <td>{item.dateTime?.replace("T", " ")}</td>
                      <td>
                        <span
                          className={
                            item.type === "INCOME" ? "tag-income" : "tag-expense"
                          }
                        >
                          {item.type}
                        </span>
                      </td>
                      <td>{item.description}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: "right" }}>
                        ₹ {Number(item.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* CATEGORY SUMMARY */}
          <div className="table-card">
            <div className="table-title">Category Summary</div>

            {categorySummary.length === 0 ? (
              <p style={{ padding: 12 }}>No data</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySummary.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td style={{ textAlign: "right" }}>
                        ₹ {Number(c.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}