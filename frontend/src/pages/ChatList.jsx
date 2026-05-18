import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {api} from "../api"
import Header from "../components/Header"

export default function ChatList() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        api.chatRooms()
            .then(r => r.ok ? r.json() : [])
            .then(data => setRooms(data.results ?? data))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <Header/>
            <div className="container">
                <h1 style={{color: "#fff", marginBottom: 24}}>Мои чаты</h1>

                {loading && <p className="loading-msg">Загрузка...</p>}
                {!loading && rooms.length === 0 && (
                    <p className="empty-msg">Чатов пока нет</p>
                )}

                {rooms.map(room => (
                    <div key={room.id} className="card"
                         onClick={() => navigate(`/chat/${room.id}`)}
                         style={{cursor: "pointer", alignItems: "center"}}>

                        <div style={{
                            width: 50, height: 50, borderRadius: "50%",
                            background: "#1abc9c", display: "flex", alignItems: "center",
                            justifyContent: "center", color: "#fff", fontWeight: "bold",
                            fontSize: 20, flexShrink: 0
                        }}>
                            {room.other_user?.username?.[0]?.toUpperCase() ?? "?"}
                        </div>

                        <div className="info">
                            <h2 className="title" style={{fontSize: 16}}>
                                {room.other_user?.username ?? "Пользователь"}
                            </h2>
                            {room.apartment_title && (
                                <p style={{fontSize: 13, color: "#888"}}>{room.apartment_title}</p>
                            )}
                            {room.last_message && (
                                <p style={{fontSize: 14, marginTop: 4}}>{room.last_message.text}</p>
                            )}
                        </div>

                        {room.unread_count > 0 && (
                            <div style={{
                                background: "#1abc9c", color: "#fff", borderRadius: "50%",
                                width: 22, height: 22, display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 12, fontWeight: "bold", flexShrink: 0
                            }}>
                                {room.unread_count}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>
    )
}