import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { useAuth } from "../context/AuthContext"
import Header from "../components/Header"

const TABS = [
  { key: "info",       label: "👤 Профиль" },
  { key: "apartments", label: "🏠 Мои квартиры" },
  { key: "requests",   label: "📋 Запросы" },
  { key: "bookings",   label: "📅 Мои аренды" },
  { key: "chats",      label: "💬 Чаты" },
]

const STATUS_COLORS = {
  pending:   { bg: "rgba(243,156,18,0.15)",  color: "#f39c12",  label: "⏳ Ожидает" },
  rented:    { bg: "rgba(52,211,153,0.15)",  color: "#34d399",  label: "✓ Подтверждено" },
  cancelled: { bg: "rgba(248,113,113,0.15)", color: "#f87171",  label: "✗ Отклонено" },
}

export default function Profile() {
  const { account, setAccount, logout } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]               = useState("info")
  const [apartments, setApartments] = useState([])
  const [bookings, setBookings]     = useState([])   // аренды жильца
  const [requests, setRequests]     = useState([])   // запросы на квартиры владельца
  const [chats, setChats]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState({})
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError]   = useState(null)
  const [saveOk, setSaveOk]         = useState(false)

  useEffect(() => {
    if (!account) { navigate("/login"); return }
    setForm({
      username:     account.username     ?? "",
      email:        account.email        ?? "",
      phone_number: account.phone_number ?? "",
      birth_date:   account.birth_date   ?? "",
      gender:       account.gender       ?? "",
      nationality:  account.nationality  ?? "",
    })
  }, [account, navigate])

  useEffect(() => {
    if (tab === "apartments") {
      setLoading(true)
      api.myApartments().then(r => r.ok ? r.json() : [])
        .then(d => setApartments(d.results ?? d)).finally(() => setLoading(false))
    }
    if (tab === "bookings") {
      // GET /bookings/ — список аренд текущего жильца
      setLoading(true)
      api.myBookings().then(r => r.ok ? r.json() : [])
        .then(d => setBookings(d.results ?? d)).finally(() => setLoading(false))
    }
    if (tab === "requests") {
      // GET /owner/bookings/ — список запросов на квартиры владельца
      setLoading(true)
      api.ownerRentings().then(r => r.ok ? r.json() : [])
        .then(d => setRequests(d.results ?? d)).finally(() => setLoading(false))
    }
    if (tab === "chats") {
      setLoading(true)
      api.chatRooms().then(r => r.ok ? r.json() : [])
        .then(d => setChats(d.results ?? d)).finally(() => setLoading(false))
    }
  }, [tab])

  const handleSave = async () => {
    setSaveLoading(true); setSaveError(null); setSaveOk(false)
    try {
      const res  = await api.updateProfile(form)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(Object.entries(data).map(([k,v]) =>
          `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | "))
      }
      setAccount(data); setSaveOk(true); setEditing(false)
    } catch (e) { setSaveError(e.message) }
    finally { setSaveLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить квартиру?")) return
    await api.deleteApartment(id)
    setApartments(prev => prev.filter(a => a.id !== id))
  }

  // Владелец меняет статус запроса
  // PATCH /owner/bookings/:id/ с { status: "rented" или "cancelled" }
  const handleUpdateStatus = async (rentingId, status) => {
    await api.updateRentingStatus(rentingId, status)
    setRequests(prev => prev.map(r =>
      r.id === rentingId ? { ...r, status } : r
    ))
  }

  if (!account) return null

  const cardStyle = {
    background: "var(--bg2)", borderRadius: 16, padding: "18px 22px",
    border: "1px solid var(--glass-border)", marginBottom: 12
  }

  return (
    <div>
      <Header />
      <div className="container" style={{ maxWidth: 860 }}>

        {/* Шапка */}
        <div style={{
          background: "var(--bg2)", borderRadius: 20, padding: "28px 32px",
          display: "flex", alignItems: "center", gap: 20,
          marginBottom: 28, border: "1px solid var(--glass-border)"
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--accent-grad)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 28, fontWeight: 800, flexShrink: 0,
          }}>
            {account.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
              {account.username}
            </h1>
            <p style={{ color: "var(--text2)", margin: "4px 0 0", fontSize: 15 }}>{account.email}</p>
          </div>
          <button className="btn" onClick={logout}
            style={{ marginLeft: "auto", background: "var(--glass)",
              color: "var(--text2)", border: "1px solid var(--glass-border)" }}>
            Выйти
          </button>
        </div>

        {/* Табы */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`tab-btn ${tab === t.key ? "active" : "inactive"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Профиль */}
        {tab === "info" && (
          <div style={{ ...cardStyle, padding: 24 }}>
            {!editing ? (
              <>
                {[
                  ["Имя пользователя", "username"],
                  ["Email",            "email"],
                  ["Телефон",          "phone_number"],
                  ["Дата рождения",    "birth_date"],
                  ["Пол",              "gender"],
                  ["Национальность",   "nationality"],
                ].map(([label, key]) => (
                  <div key={key} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px 0", borderBottom: "1px solid var(--glass-border)"
                  }}>
                    <span style={{ color: "var(--text3)", fontSize: 14 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{account[key] || "—"}</span>
                  </div>
                ))}
                <button className="btn" onClick={() => setEditing(true)} style={{ marginTop: 20 }}>
                  ✏️ Редактировать
                </button>
              </>
            ) : (
              <>
                {[
                  ["Имя пользователя", "username",     "text"],
                  ["Email",            "email",         "email"],
                  ["Телефон",          "phone_number",  "tel"],
                  ["Дата рождения",    "birth_date",    "date"],
                  ["Национальность",   "nationality",   "text"],
                ].map(([label, key, type]) => (
                  <label key={key} className="auth-field">
                    <span>{label}</span>
                    <input type={type} value={form[key] ?? ""}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </label>
                ))}
                <label className="auth-field">
                  <span>Пол</span>
                  <select value={form.gender ?? ""}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Не указан</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                    <option value="prefer_not">Не хочу указывать</option>
                  </select>
                </label>
                {saveError && <p className="error-msg">{saveError}</p>}
                {saveOk    && <p className="success-msg">✓ Сохранено</p>}
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button className="btn" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? "Сохранение..." : "Сохранить"}
                  </button>
                  <button className="btn" onClick={() => setEditing(false)}
                    style={{ background: "var(--glass)", color: "var(--text2)",
                      border: "1px solid var(--glass-border)" }}>
                    Отмена
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Мои квартиры */}
        {tab === "apartments" && (
          <div>
            <button className="btn" onClick={() => navigate("/apartments/create")}
              style={{ marginBottom: 20 }}>
              + Добавить квартиру
            </button>
            {loading && <p className="loading-msg">Загрузка...</p>}
            {!loading && apartments.length === 0 && <p className="empty-msg">Квартир пока нет</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {apartments.map(ap => (
                <div key={ap.id} style={{
                  background: "var(--bg2)", borderRadius: 16, overflow: "hidden",
                  display: "flex", border: "1px solid var(--glass-border)"
                }}>
                  {ap.images?.[0]
                    ? <img src={ap.images[0].image} alt={ap.title}
                        style={{ width: 130, height: 100, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 130, height: 100, background: "var(--bg3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, flexShrink: 0 }}>🏠</div>
                  }
                  <div style={{ flex: 1, padding: "12px 16px" }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700,
                      color: "var(--text)" }}>{ap.title}</h3>
                    <p style={{ color: "var(--text2)", fontSize: 13, margin: "4px 0" }}>
                      {ap.city}, {ap.country}
                    </p>
                    <p style={{ fontWeight: 700, fontSize: 15,
                      background: "var(--accent-grad)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {ap.price_per_month} € / мес
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column",
                    gap: 6, padding: 12, justifyContent: "center" }}>
                    <button className="btn" onClick={() => navigate(`/apartments/${ap.id}`)}
                      style={{ fontSize: 12, padding: "5px 12px" }}>Открыть</button>
                    <button className="btn" onClick={() => navigate(`/apartments/${ap.id}/edit`)}
                      style={{ fontSize: 12, padding: "5px 12px",
                        background: "var(--glass)", color: "var(--text2)",
                        border: "1px solid var(--glass-border)" }}>Изменить</button>
                    <button className="btn" onClick={() => handleDelete(ap.id)}
                      style={{ fontSize: 12, padding: "5px 12px",
                        background: "rgba(248,113,113,0.15)", color: "#f87171",
                        border: "1px solid rgba(248,113,113,0.3)" }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Запросы на аренду — таб для владельца */}
        {tab === "requests" && (
          <div>
            <p style={{ color: "var(--text2)", marginBottom: 16, fontSize: 14 }}>
              Здесь отображаются запросы на аренду твоих квартир.
              Подтверди или отклони каждый запрос.
            </p>
            {loading && <p className="loading-msg">Загрузка...</p>}
            {!loading && requests.length === 0 && (
              <p className="empty-msg">Запросов пока нет</p>
            )}
            {requests.map(r => {
              const s = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending
              return (
                <div key={r.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      {/* Кто запрашивает */}
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16,
                        color: "var(--text)" }}>👤 {r.user}</p>
                      {/* Какую квартиру */}
                      <p style={{ margin: "4px 0 0", color: "var(--text2)", fontSize: 14 }}>
                        🏠 {r.apartment}
                      </p>
                      {/* Когда создан запрос */}
                      {r.created_at && (
                        <p style={{ margin: "4px 0 0", color: "var(--text3)", fontSize: 12 }}>
                          {new Date(r.created_at).toLocaleDateString("ru-RU")}
                        </p>
                      )}
                      {/* Статус */}
                      <span style={{
                        display: "inline-block", marginTop: 8, fontSize: 13,
                        padding: "3px 12px", borderRadius: 20, fontWeight: 600,
                        background: s.bg, color: s.color
                      }}>
                        {s.label}
                      </span>
                    </div>

                    {/* Кнопки только для pending */}
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn"
                          onClick={() => handleUpdateStatus(r.id, "rented")}
                          style={{ fontSize: 13, padding: "7px 16px",
                            background: "rgba(52,211,153,0.15)", color: "#34d399",
                            border: "1px solid rgba(52,211,153,0.3)" }}>
                          ✓ Подтвердить
                        </button>
                        <button className="btn"
                          onClick={() => handleUpdateStatus(r.id, "cancelled")}
                          style={{ fontSize: 13, padding: "7px 16px",
                            background: "rgba(248,113,113,0.15)", color: "#f87171",
                            border: "1px solid rgba(248,113,113,0.3)" }}>
                          ✗ Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Мои аренды — таб для жильца */}
        {tab === "bookings" && (
          <div>
            <p style={{ color: "var(--text2)", marginBottom: 16, fontSize: 14 }}>
              Здесь отображаются твои запросы на аренду квартир.
            </p>
            {loading && <p className="loading-msg">Загрузка...</p>}
            {!loading && bookings.length === 0 && (
              <p className="empty-msg">Запросов на аренду пока нет</p>
            )}
            {bookings.map(b => {
              const s = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending
              return (
                <div key={b.id} style={cardStyle}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                      🏠 {b.apartment_title ?? `Квартира #${b.apartment}`}
                  </p>
                  {b.created_at && (
                    <p style={{ margin: "4px 0 0", color: "var(--text3)", fontSize: 12 }}>
                      Запрос от {new Date(b.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                  <span style={{
                    display: "inline-block", marginTop: 8, fontSize: 13,
                    padding: "3px 12px", borderRadius: 20, fontWeight: 600,
                    background: s.bg, color: s.color
                  }}>
                    {s.label}
                  </span>
                  {/* Если подтверждено — кнопка перейти к квартире и написать отзыв */}
                  {b.status === "rented" && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>
                        ✓ Аренда подтверждена — вы можете оставить отзыв
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Чаты */}
        {tab === "chats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading && <p className="loading-msg">Загрузка...</p>}
            {!loading && chats.length === 0 && <p className="empty-msg">Чатов пока нет</p>}
            {chats.map(room => (
              <div key={room.id} onClick={() => navigate(`/chat/${room.id}`)}
                style={{
                  ...cardStyle, display: "flex", alignItems: "center",
                  gap: 14, cursor: "pointer", marginBottom: 0,
                  transition: "border-color 0.15s"
                }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "var(--accent-grad)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0
                }}>
                  {room.other_user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15,
                    color: "var(--text)" }}>
                    {room.other_user?.username ?? "Пользователь"}
                  </p>
                  {room.apartment_title && (
                    <p style={{ margin: "2px 0 0", fontSize: 12,
                      color: "var(--text3)" }}>{room.apartment_title}</p>
                  )}
                  {room.last_message && (
                    <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text2)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {room.last_message.text}
                    </p>
                  )}
                </div>
                {room.unread_count > 0 && (
                  <div style={{
                    background: "var(--accent-grad)", color: "#fff", borderRadius: "50%",
                    width: 24, height: 24, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>
                    {room.unread_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      <footer>© 2026 RentEasy. Все права защищены.</footer>
    </div>
  )
}