import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Header({ search, onSearch }) {
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header>
      <div className="logo" onClick={() => navigate("/")}>RentEasy</div>

      {onSearch !== undefined && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Город, название или описание"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      )}

      <nav>
        {account === undefined ? null : account ? (
          <>
            <span onClick={() => navigate("/apartments/create")}>+ Добавить</span>
            <span onClick={() => navigate("/chat")}>Чаты</span>
            <span onClick={() => navigate("/profile")}
              style={{
                background: "#1abc9c", color: "#fff",
                borderRadius: "50%", width: 36, height: 36,
                display: "inline-flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: 16
              }}>
              {account.username?.[0]?.toUpperCase()}
            </span>
          </>
        ) : (
          <>
            <span onClick={() => navigate("/login")}>Войти</span>
            <span onClick={() => navigate("/register")}
              style={{
                background: "#1abc9c", color: "#fff",
                borderRadius: 10, padding: "8px 16px"
              }}>
              Регистрация
            </span>
          </>
        )}
      </nav>
    </header>
  )
}