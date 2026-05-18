import {useState} from "react"
import {useNavigate} from "react-router-dom"
import {api} from "../api"
import {useAuth} from "../context/AuthContext"
import Header from "../components/Header"

export default function Login() {
    const navigate = useNavigate()
    const {login} = useAuth()

    const [step, setStep] = useState("login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [userId, setUserId] = useState(null)
    const [code, setCode] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true);
        setError(null)
        try {
            const res = await api.login({email, password})
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? JSON.stringify(data))
            setUserId(data.user_id)
            setStep("2fa")
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handle2FA = async () => {
        setLoading(true);
        setError(null)
        try {
            const res = await api.verify2fa({user_id: userId, code})
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? "Неверный код")
            login({access: data.access, refresh: data.refresh}, data.user)
            navigate("/")
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Header/>
            <div className="auth-container">

                {step === "login" && (
                    <>
                        <h1>Вход</h1>
                        <label className="auth-field">
                            <span>Email</span>
                            <input type="email" value={email}
                                   onChange={e => setEmail(e.target.value)}/>
                        </label>
                        <label className="auth-field">
                            <span>Пароль</span>
                            <input type="password" value={password}
                                   onChange={e => setPassword(e.target.value)}
                                   onKeyDown={e => e.key === "Enter" && handleLogin()}/>
                        </label>
                        <button className="btn" style={{width: "100%"}}
                                onClick={handleLogin} disabled={loading}>
                            {loading ? "Загрузка..." : "Войти"}
                        </button>
                        <p style={{marginTop: 16, textAlign: "center"}}>
                            Нет аккаунта?{" "}
                            <span className="auth-link" onClick={() => navigate("/register")}>
                Зарегистрироваться
              </span>
                        </p>
                    </>
                )}

                {step === "2fa" && (
                    <>
                        <h1>Подтверждение</h1>
                        <p style={{marginBottom: 16, color: "#555"}}>
                            Код отправлен на <strong>{email}</strong>
                        </p>
                        <label className="auth-field">
                            <span>Код подтверждения</span>
                            <input type="text" value={code}
                                   onChange={e => setCode(e.target.value)}
                                   onKeyDown={e => e.key === "Enter" && handle2FA()}
                                   style={{letterSpacing: 6, fontSize: 22, textAlign: "center"}}
                                   maxLength={6} placeholder="000000"/>
                        </label>
                        <button className="btn" style={{width: "100%"}}
                                onClick={handle2FA} disabled={loading}>
                            {loading ? "Проверка..." : "Подтвердить"}
                        </button>
                        <p style={{marginTop: 12, textAlign: "center"}}>
                            <span className="auth-link" onClick={() => setStep("login")}>← Назад</span>
                        </p>
                    </>
                )}

                {error && <p className="error-msg">{error}</p>}
            </div>
            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>
    )
}