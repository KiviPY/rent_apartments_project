import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../api"
import { useAuth } from "../context/AuthContext"

export default function Chat() {
  const { roomId }  = useParams()
  const { account } = useAuth()
  const navigate    = useNavigate()

  const [messages, setMessages] = useState([])
  const [text, setText]         = useState("")
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const wsRef     = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.chatMessages(roomId)
      .then(r => r.ok ? r.json() : [])
      .then(data => setMessages(data.results ?? data))
      .finally(() => setLoading(false))
  }, [roomId])

  useEffect(() => {
    const accessToken = window.__accessToken__
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${roomId}/?token=${accessToken ?? ""}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      setMessages(prev => [...prev, msg])
    }
    ws.onerror = () => console.error("WS error")
    return () => ws.close()
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!text.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ text }))
    setText("")
  }

  const handleDelete = async () => {
    if (!window.confirm("Удалить чат? Все сообщения будут удалены.")) return
    setDeleting(true)
    try {
      await api.deleteChat(roomId)
      navigate("/chat")
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "var(--bg)"
    }}>

      {/* Хедер */}
      <div style={{
        background: "rgba(15,15,26,0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", gap: 14,
        position: "sticky", top: 0, zIndex: 10
      }}>
        <span onClick={() => navigate(-1)} style={{
          cursor: "pointer", color: "var(--text2)", fontSize: 20,
          width: 36, height: 36, display: "flex",
          alignItems: "center", justifyContent: "center",
          borderRadius: 10, transition: "background 0.15s"
        }}>←</span>

        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "var(--accent-grad)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18
        }}>💬</div>

        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Чат</span>

        {/* Кнопка удаления */}
        <button onClick={handleDelete} disabled={deleting} style={{
          marginLeft: "auto",
          background: "rgba(248,113,113,0.12)",
          color: "#f87171",
          border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: 8, padding: "6px 14px",
          cursor: "pointer", fontSize: 13, fontWeight: 600,
          transition: "opacity 0.15s"
        }}>
          {deleting ? "Удаление..." : "🗑 Удалить чат"}
        </button>
      </div>

      {/* Сообщения */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 10
      }}>
        {loading && <p className="loading-msg">Загрузка...</p>}

        {messages.map((msg, i) => {
          const isMine = msg.sender === account?.id ||
                         msg.sender_username === account?.username
          return (
            <div key={msg.id ?? i} style={{
              display: "flex",
              justifyContent: isMine ? "flex-end" : "flex-start",
              alignItems: "flex-end", gap: 8
            }}>
              {!isMine && (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "var(--accent-grad)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0
                }}>
                  {msg.sender_username?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div style={{
                maxWidth: "60%",
                padding: "10px 14px",
                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMine
                  ? "linear-gradient(135deg, #7c6ef7, #a78bfa)"
                  : "var(--bg2)",
                border: isMine ? "none" : "1px solid var(--glass-border)",
                color: "#fff",
                boxShadow: isMine
                  ? "0 4px 16px rgba(124,110,247,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {!isMine && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, marginBottom: 4,
                    background: "var(--accent-grad)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}>
                    {msg.sender_username}
                  </div>
                )}
                <div style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.text}</div>
                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: "right" }}>
                  {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                    hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Инпут */}
      <div style={{
        display: "flex", gap: 10, padding: "14px 24px",
        background: "rgba(15,15,26,0.9)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--glass-border)"
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Написать сообщение..."
          style={{
            flex: 1, padding: "12px 18px",
            borderRadius: 28,
            border: "1px solid var(--glass-border)",
            fontSize: 15, outline: "none",
            background: "var(--bg2)",
            color: "var(--text)",
            fontFamily: "inherit",
            transition: "border 0.2s"
          }}
        />
        <button className="btn" onClick={sendMessage}
          style={{ borderRadius: 28, padding: "12px 22px", fontSize: 18 }}>
          ➤
        </button>
      </div>
    </div>
  )
}