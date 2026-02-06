import { useEffect, useMemo, useState } from "react";
import api from "../api/api"; // your axios instance

export default function Home() {
  

  const getUserEmail = () => {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.email || null;
  } catch {
    return null;
  }
};

const userEmail = getUserEmail();

  // ====== HISTORY FROM BACKEND ======
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // ===== FILTER STATES =====
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL / INCOME / EXPENSE
  const [division, setDivision] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState("");

  // ===== MODAL STATES =====
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("INCOME"); // INCOME / EXPENSE

  // ===== FORM STATES =====
  const [dateTime, setDateTime] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [formDivision, setFormDivision] = useState("PERSONAL");
  const [formCategory, setFormCategory] = useState("Food");

  // ===== EDIT MODE =====
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // ===== 12 Hour Edit Rule (MUST BE ABOVE openEditModal) =====
  const canEditWithin12Hours = (dateTimeStr) => {
    if (!dateTimeStr) return false;

    const created = new Date(dateTimeStr);
    const now = new Date();

    const diffMs = now.getTime() - created.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours <= 12;
  };

  // ===== MODAL HELPERS =====
  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);

    // reset form
    setTab("INCOME");
    setDateTime("");
    setAmount("");
    setDescription("");
    setFormDivision("PERSONAL");
    setFormCategory("Food");

    setShowModal(true);
  };

  const openEditModal = (item) => {
    // 12-hour check based on record dateTime
    if (!canEditWithin12Hours(item.dateTime)) {
      alert("Editing is allowed only within 12 hours.");
      return;
    }

    setIsEditMode(true);
    setEditId(item.id);

    setTab(item.type); // INCOME / EXPENSE
    setDateTime(item.dateTime);
    setAmount(String(item.amount ?? ""));
    setDescription(item.description ?? "");
    setFormDivision(item.division ?? "PERSONAL");
    setFormCategory(item.category ?? "Food");

    setShowModal(true);
  };

  // ✅ LOCK FLAG (WAS MISSING - caused your error)
  const isLocked = isEditMode && !canEditWithin12Hours(dateTime);

  // ===== LOAD HISTORY =====
  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    try {
      // your backend endpoint
      const res = await api.get(`/records/user/${encodeURIComponent(userEmail)}`);

      const data = Array.isArray(res.data) ? res.data : [];

      // Map backend -> UI model
      const mapped = data.map((r) => ({
        id: r.id || r._id,
        type: (r.type || r.recordType || r.transactionType || "").toUpperCase(), // INCOME/EXPENSE
        dateTime: r.dateTime || r.createdAt || r.recordDate || "",
        description: r.description || r.title || "",
        category: r.category || "Others",
        division: (r.division || "PERSONAL").toUpperCase(),
        amount: Number(r.amount || 0),
      }));

      setHistory(mapped);
    } catch (err) {
      setHistoryError(
        err?.response?.data?.message || "Failed to load records from backend."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== FILTER LOGIC =====
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (division !== "ALL" && item.division !== division) return false;
      if (category !== "ALL" && item.category !== category) return false;

      const itemDate = item.dateTime?.slice(0, 10);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;

      return true;
    });
  }, [history, typeFilter, division, category, fromDate, toDate]);

  // ===== SAVE (ADD / EDIT) =====
  const handleSave = async () => {
    if (!dateTime || !amount || !description) {
      alert("Please fill Date, Amount, and Description");
      return;
    }

    const payload = {
      createdBy: userEmail,
      type: tab,
      dateTime,
      description,
      category: formCategory,
      division: formDivision,
      amount: Number(amount),
    };

    try {
      if (isEditMode && editId) {
        // UPDATE
        await api.put(`/records/edit/${editId}`, payload);
      } else {
        // CREATE
        await api.post("/records", payload);
      }

      setShowModal(false);
      setIsEditMode(false);
      setEditId(null);

      // reset form
      setDateTime("");
      setAmount("");
      setDescription("");
      setFormDivision("PERSONAL");
      setFormCategory("Food");

      loadHistory(); // no need await
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save/update record.");
    }
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!editId) return;

    if (isLocked) {
      alert("Delete is allowed only within 12 hours.");
      return;
    }

    const ok = window.confirm("Delete this record?");
    if (!ok) return;

    try {
      await api.delete(`/records/${editId}`);

      setShowModal(false);
      setIsEditMode(false);
      setEditId(null);

      loadHistory();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete record.");
    }
  };

  return (
    <div className="content-wrapper">
      {/* ===== HEADER ===== */}
      <div className="home-header">
        <div>
          <h1 className="page-title">Home</h1>
          <p className="page-subtitle">Income / Expense history + filters</p>
        </div>

        <button className="btn-primary" onClick={openAddModal}>
          + Add
        </button>
      </div>

      {/* ===== FILTER SECTION ===== */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div className="form-group">
            <label>Division</label>
            <select value={division} onChange={(e) => setDivision(e.target.value)}>
              <option value="ALL">All</option>
              <option value="PERSONAL">Personal</option>
              <option value="OFFICE">Office</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="ALL">All</option>
              <option value="Food">Food</option>
              <option value="Fuel">Fuel</option>
              <option value="Movie">Movie</option>
              <option value="Loan">Loan</option>
              <option value="Medical">Medical</option>
              <option value="Salary">Salary</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="form-group">
            <label>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="filters-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setTypeFilter("ALL");
              setDivision("ALL");
              setCategory("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ===== HISTORY TABLE ===== */}
      <div className="table-card">
        <div className="table-title">History</div>

        {loadingHistory ? (
          <p style={{ padding: "12px" }}>Loading...</p>
        ) : historyError ? (
          <p style={{ padding: "12px", color: "crimson" }}>{historyError}</p>
        ) : filteredHistory.length === 0 ? (
          <p style={{ padding: "12px" }}>No transactions found.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Description</th>
                <th>Division</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.dateTime?.replace("T", " ")}</td>
                  <td>
                    <span className={item.type === "INCOME" ? "tag-income" : "tag-expense"}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.description}</td>
                  <td>{item.division}</td>
                  <td>{item.category}</td>
                  <td style={{ textAlign: "right" }}>
                    ₹ {Number(item.amount).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {canEditWithin12Hours(item.dateTime) ? (
                      <button className="btn-secondary" onClick={() => openEditModal(item)}>
                        Edit
                      </button>
                    ) : (
                      <span style={{ color: "gray", fontSize: "12px" }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Transaction" : "Add Transaction"}</h3>
              <span onClick={() => setShowModal(false)} style={{ cursor: "pointer" }}>
                ✕
              </span>
            </div>

            <div className="modal-tabs">
              <button
                className={tab === "INCOME" ? "active-tab" : ""}
                onClick={() => setTab("INCOME")}
                disabled={isEditMode} // don’t allow switching type in edit (optional)
              >
                Income
              </button>
              <button
                className={tab === "EXPENSE" ? "active-tab" : ""}
                onClick={() => setTab("EXPENSE")}
                disabled={isEditMode}
              >
                Expense
              </button>
            </div>

            <div className="modal-form">
              <div className="form-row">
                <div>
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    disabled={isLocked}
                  />
                </div>

                <div>
                  <label>Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    disabled={isLocked}
                  />
                </div>
              </div>

              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="one line description"
                disabled={isLocked}
              />

              <div className="form-row">
                <div>
                  <label>Division</label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value)}
                    disabled={isLocked}
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="OFFICE">Office</option>
                  </select>
                </div>

                <div>
                  <label>Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    disabled={isLocked}
                  >
                    <option>Food</option>
                    <option>Fuel</option>
                    <option>Movie</option>
                    <option>Loan</option>
                    <option>Medical</option>
                    <option>Salary</option>
                    <option>Others</option>
                  </select>
                </div>
              </div>

              {isLocked && (
                <p style={{ color: "crimson", fontSize: "13px", marginTop: "10px" }}>
                  Locked: Edit/Delete allowed only within 12 hours.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>

              {isEditMode && (
                <button className="btn-danger" onClick={handleDelete} disabled={isLocked}>
                  Delete
                </button>
              )}

              <button className="btn-primary" onClick={handleSave} disabled={isLocked}>
                {isEditMode ? "Update" : `Save ${tab}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}