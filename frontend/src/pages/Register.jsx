import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { useAuth } from "../context/AuthContext"
import Header from "../components/Header"

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [step, setStep]       = useState("register")
  const [form, setForm]       = useState({
    username: "", email: "", password: "",
    birth_date: "", phone_number: "", gender: "", nationality: ""
  })
  const [userId, setUserId]   = useState(null)
  const [code, setCode]       = useState("")
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleRegister = async () => {
    setLoading(true); setError(null)
    try {
      const res  = await api.register(form)
      const data = await res.json()
      if (!res.ok) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ")
        throw new Error(msgs)
      }
      const loginRes  = await api.login({ email: form.email, password: form.password })
      const loginData = await loginRes.json()
      if (!loginRes.ok) throw new Error(loginData.error ?? "Ошибка входа")
      setUserId(loginData.user_id)
      setStep("2fa")
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handle2FA = async () => {
    setLoading(true); setError(null)
    try {
      const res  = await api.verify2fa({ user_id: userId, code })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Неверный код")
      login({ access: data.access, refresh: data.refresh }, data.user)
      navigate("/")
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Header />
      <div className="auth-container">

        {step === "register" && (
          <>
            <h1>Регистрация</h1>
            <label className="auth-field">
              <span>Имя пользователя *</span>
              <input type="text" value={form.username} onChange={set("username")} />
            </label>
            <label className="auth-field">
              <span>Email *</span>
              <input type="email" value={form.email} onChange={set("email")} />
            </label>
            <label className="auth-field">
              <span>Пароль *</span>
              <input type="password" value={form.password} onChange={set("password")} />
            </label>
            <label className="auth-field">
              <span>Дата рождения</span>
              <input type="date" value={form.birth_date} onChange={set("birth_date")} />
            </label>
            <label className="auth-field">
              <span>Номер телефона</span>
              <input type="tel" value={form.phone_number} onChange={set("phone_number")}
                placeholder="+49123456789" />
            </label>
            <label className="auth-field">
              <span>Пол</span>
              <select value={form.gender} onChange={set("gender")}
                style={{ width:"100%", padding:"9px 12px", borderRadius:6, border:"1px solid #bbb", fontSize:15 }}>
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
                <option value="prefer_not">Не хочу указывать</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Национальность</span>
              <input type="text" value={form.nationality} onChange={set("nationality")} />
            </label>
            <button className="btn" style={{width:"100%"}}
              onClick={handleRegister} disabled={loading}>
              {loading ? "Загрузка..." : "Создать аккаунт"}
            </button>
            <p style={{marginTop:16, textAlign:"center"}}>
              Уже есть аккаунт?{" "}
              <span className="auth-link" onClick={() => navigate("/login")}>Войти</span>
            </p>
          </>
        )}

        {step === "2fa" && (
          <>
            <h1>Подтверждение</h1>
            <p style={{marginBottom:16, color:"#555"}}>
              Код отправлен на <strong>{form.email}</strong>
            </p>
            <label className="auth-field">
              <span>Код подтверждения</span>
              <input type="text" value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle2FA()}
                style={{letterSpacing:6, fontSize:22, textAlign:"center"}}
                maxLength={6} placeholder="000000" />
            </label>
            <button className="btn" style={{width:"100%"}}
              onClick={handle2FA} disabled={loading}>
              {loading ? "Проверка..." : "Подтвердить"}
            </button>
            <p style={{marginTop:12, textAlign:"center"}}>
              <span className="auth-link" onClick={() => setStep("register")}>← Назад</span>
            </p>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </div>
      <footer>© 2026 RentEasy. Все права защищены.</footer>
    </div>
  )
}