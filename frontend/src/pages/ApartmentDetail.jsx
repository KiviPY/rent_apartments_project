import {useEffect, useState} from "react"
import {useParams, useNavigate} from "react-router-dom"
import {MapContainer, TileLayer, Marker} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {api} from "../api"
import {useAuth} from "../context/AuthContext"
import Header from "../components/Header"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const FEATURES = [{key: "heating", label: "Отопление", icon: "🔥"}, {
    key: "parking",
    label: "Парковка",
    icon: "🚗"
}, {key: "balcony", label: "Балкон", icon: "🌿"}, {key: "terrace", label: "Терраса", icon: "☀️"}, {
    key: "is_furnished",
    label: "С мебелью",
    icon: "🛋️"
},]

const RULES = [{key: "pets", label: "Животные", icon: "🐾"}, {
    key: "smoking",
    label: "Курение",
    icon: "🚬"
}, {key: "good_for_couples", label: "Для пар", icon: "💑"}, {
    key: "musical_instruments",
    label: "Муз. инструменты",
    icon: "🎵"
}, {key: "small_kids", label: "Дети", icon: "👶"},]

export default function ApartmentDetail() {
    const {id} = useParams()
    const navigate = useNavigate()
    const {account} = useAuth()

    const [ap, setAp] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activePhoto, setActivePhoto] = useState(0)
    const [chatLoading, setChatLoading] = useState(false)

    // Проверяем есть ли у жильца подтверждённая аренда этой квартиры
    const [canReview, setCanReview] = useState(false)
    // Уже оставил ли отзыв
    const [hasReview, setHasReview] = useState(false)

    // Форма отзыва
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [reviewLoading, setReviewLoading] = useState(false)
    const [reviewError, setReviewError] = useState(null)
    const [reviewOk, setReviewOk] = useState(false)

    const [hasRenting, setHasRenting] = useState(false)

    useEffect(() => {
        setLoading(true)
        Promise.all([api.apartment(id).then(r => r.ok ? r.json() : Promise.reject(r.status)), api.reviews(id).then(r => r.ok ? r.json() : []),])
            .then(([apData, reviewsData]) => {
                setAp(apData)
                const revList = reviewsData.results ?? reviewsData
                setReviews(revList)

                // Проверяем оставил ли текущий юзер уже отзыв
                if (account) {
                    setHasReview(revList.some(r => r.user === account.username))
                }
            })
            .catch(err => setError(`Ошибка загрузки: ${err}`))
            .finally(() => setLoading(false))
    }, [id, account])

    // Проверяем есть ли подтверждённая аренда
    // GET /bookings/ возвращает аренды жильца — ищем rented для этой квартиры
    useEffect(() => {
        if (!account) return
        api.myBookings()
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = data.results ?? data
                // есть ли уже любой запрос для этой квартиры
                const existing = list.some(b => String(b.apartment) === String(id))
                setHasRenting(existing)
                // есть ли подтверждённая аренда
                const confirmed = list.some(b => b.status === "rented" && String(b.apartment) === String(id))
                setCanReview(confirmed)
            })
            .catch(() => {
            })
    }, [id, account])

    const handleChat = async () => {
        setChatLoading(true)
        try {
            // создаём запрос только если его ещё нет
            if (!hasRenting) {
                await api.requestRenting(ap.id).catch(() => {
                })
                setHasRenting(true)
            }
            const res = await api.chatCreate({other_user_id: ap.user, apartment_id: ap.id})
            const data = await res.json()
            navigate(`/chat/${data.id}`)
        } finally {
            setChatLoading(false)
        }
    }

    const handleReview = async () => {
        setReviewLoading(true);
        setReviewError(null)
        try {
            const res = await api.createReview(id, {rating, comment})
            const data = await res.json()
            if (!res.ok) throw new Error(Object.values(data).flat().join(", "))

            // Добавляем отзыв в список без перезагрузки страницы
            setReviews(prev => [{...data, user: account.username}, ...prev])
            setReviewOk(true)
            setHasReview(true)
            setComment("")
        } catch (e) {
            setReviewError(e.message)
        } finally {
            setReviewLoading(false)
        }
    }

    if (loading) return <><Header/><p className="loading-msg" style={{padding: 32}}>Загрузка...</p></>
    if (error) return <><Header/><p className="error-msg" style={{padding: 32}}>{error}</p></>
    if (!ap) return null

    const photos = ap.images ?? []
    const isOwner = account?.id === ap.user

    return (<div>
            <Header/>
            <div className="container" style={{maxWidth: 900}}>

                <button className="btn" onClick={() => navigate(-1)}
                        style={{
                            marginBottom: 20,
                            background: "var(--glass)",
                            color: "var(--text2)",
                            border: "1px solid var(--glass-border)"
                        }}>
                    ← Назад
                </button>

                {/* Галерея */}
                {photos.length > 0 ? (<>
                        <img className="detail-gallery-main" src={photos[activePhoto]?.image} alt={ap.title}/>
                        {photos.length > 1 && (<div className="detail-gallery-thumbs">
                                {photos.map((ph, i) => (<img key={i} src={ph.image} alt=""
                                                             className={i === activePhoto ? "active" : ""}
                                                             onClick={() => setActivePhoto(i)}/>))}
                            </div>)}
                    </>) : (<div className="detail-gallery-main"
                                 style={{
                                     height: 320,
                                     display: "flex",
                                     alignItems: "center",
                                     justifyContent: "center",
                                     fontSize: 64,
                                     color: "var(--text3)"
                                 }}>
                        🏠
                    </div>)}

                {/* Заголовок */}
                <h1 className="detail-title">{ap.title}</h1>
                <p className="detail-meta">
                    📍 {ap.city}, {ap.country} — {ap.address}
                    {ap.house_number ? `, ${ap.house_number}` : ""}
                </p>
                {ap.postal_code && <p className="detail-meta">Индекс: {ap.postal_code}</p>}

                <div style={{
                    display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 8
                }}>
                    <p className="detail-price">{ap.price_per_month} {ap.currency} / месяц</p>
                    {ap.average_rating > 0 && (<p style={{color: "#f0a500", fontSize: 18}}>
                            {"★".repeat(Math.round(ap.average_rating))}
                            {"☆".repeat(5 - Math.round(ap.average_rating))}
                            {" "}<strong>{ap.average_rating.toFixed(1)}</strong>
                            <span style={{color: "var(--text3)", fontSize: 14}}>
                {" · "}{ap.reviews_count} отзывов
              </span>
                        </p>)}
                </div>

                {ap.description && <p className="detail-description">{ap.description}</p>}

                {/* Параметры */}
                <div className="info-grid">
                    {[{label: "Тип", value: ap.property_type}, {
                        label: "Площадь",
                        value: `${ap.size_of_property} м²`
                    }, {label: "Спальни", value: ap.bedrooms}, {
                        label: "Ванные",
                        value: ap.bathrooms
                    }, {label: "Жильцов макс", value: ap.max_residents}, {
                        label: "Мин. аренда",
                        value: `${ap.min_rent_duration} мес.`
                    }, {
                        label: "Макс. аренда",
                        value: ap.max_rent_duration ? `${ap.max_rent_duration} мес.` : "∞"
                    }, {label: "Валюта", value: ap.currency},].map(({label, value}) => (
                        <div key={label} className="info-grid-item">
                            <div className="label">{label}</div>
                            <div className="value">{value}</div>
                        </div>))}
                </div>

                {/* Удобства */}
                <div className="features-box">
                    <h3>Удобства</h3>
                    <div className="features-grid">
                        {FEATURES.map(({key, label, icon}) => (
                            <div key={key} className={`feature-item ${ap[key] ? "yes" : "no"}`}>
                                <span>{icon}</span>
                                <span>{label}</span>
                                <span style={{marginLeft: "auto", fontWeight: 700}}>
                  {ap[key] ? "✓" : "✗"}
                </span>
                            </div>))}
                    </div>
                </div>

                {/* Правила */}
                <div className="features-box">
                    <h3>Правила проживания</h3>
                    <div className="features-grid">
                        {RULES.map(({key, label, icon}) => (
                            <div key={key} className={`feature-item ${ap[key] ? "yes" : "no"}`}>
                                <span>{icon}</span>
                                <span>{label}</span>
                                <span style={{marginLeft: "auto", fontWeight: 700}}>
                  {ap[key] ? "✓" : "✗"}
                </span>
                            </div>))}
                    </div>
                </div>

                {/* Карта */}
                {ap.latitude && ap.longitude && (<div style={{marginTop: 24}}>
                        <h3 style={{
                            marginBottom: 12, fontWeight: 700, fontSize: 18, color: "var(--text)"
                        }}>Расположение</h3>
                        <div style={{borderRadius: 16, overflow: "hidden"}}>
                            <MapContainer center={[ap.latitude, ap.longitude]} zoom={16}
                                          style={{height: 320, width: "100%"}} scrollWheelZoom={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                           attribution='&copy; OpenStreetMap'/>
                                <Marker position={[ap.latitude, ap.longitude]}/>
                            </MapContainer>
                        </div>
                    </div>)}

                {/* Контакт / действия */}
                <div className="booking-box">
                    {!account ? (<>
                            <h2>Связаться с владельцем</h2>
                            <p style={{color: "var(--text2)"}}>
                                <span className="auth-link" onClick={() => navigate("/login")}>Войдите</span>
                                {" "}чтобы написать владельцу
                            </p>
                        </>) : isOwner ? (<>
                            <h2>Управление</h2>
                            <button className="btn" onClick={() => navigate(`/apartments/${ap.id}/edit`)}>
                                ✏️ Редактировать квартиру
                            </button>
                        </>) : (<>
                            <h2>Связаться с владельцем</h2>
                            <p style={{color: "var(--text2)", marginBottom: 16, fontSize: 14}}>
                                После нажатия кнопки вы попадёте в чат с владельцем,
                                а ваш запрос на аренду будет отправлен автоматически.
                            </p>
                            <button className="btn" onClick={handleChat} disabled={chatLoading}
                                    style={{fontSize: 15, padding: "12px 28px"}}>
                                {chatLoading ? "Открываем чат..." : "💬 Написать владельцу"}
                            </button>
                        </>)}
                </div>

                {/* Форма отзыва — только если аренда подтверждена и отзыв ещё не оставлен */}
                {account && !isOwner && canReview && !hasReview && (
                    <div className="booking-box" style={{marginTop: 16}}>
                        <h2>Оставить отзыв</h2>

                        {/* Выбор рейтинга — кликаем по звёздам */}
                        <div style={{display: "flex", gap: 6, marginBottom: 16}}>
                            {[1, 2, 3, 4, 5].map(n => (<span key={n} onClick={() => setRating(n)}
                                                             style={{
                                                                 fontSize: 28,
                                                                 cursor: "pointer",
                                                                 color: n <= rating ? "#f0a500" : "var(--text3)",
                                                                 transition: "color 0.15s"
                                                             }}>
                  ★
                </span>))}
                            <span style={{
                                color: "var(--text2)", fontSize: 14, alignSelf: "center", marginLeft: 8
                            }}>
                {rating} из 5
              </span>
                        </div>

                        <label className="auth-field">
                            <span>Комментарий</span>
                            <textarea value={comment} onChange={e => setComment(e.target.value)}
                                      rows={4} placeholder="Расскажите о своём опыте проживания..."
                                      style={{
                                          width: "100%",
                                          padding: "10px 14px",
                                          borderRadius: 10,
                                          border: "1px solid var(--glass-border)",
                                          fontSize: 15,
                                          resize: "vertical",
                                          background: "var(--bg3)",
                                          color: "var(--text)",
                                          fontFamily: "inherit"
                                      }}/>
                        </label>

                        {reviewError && <p className="error-msg">{reviewError}</p>}
                        {reviewOk && <p className="success-msg">✓ Отзыв опубликован!</p>}

                        <button className="btn" onClick={handleReview} disabled={reviewLoading}
                                style={{marginTop: 8}}>
                            {reviewLoading ? "Публикуем..." : "Опубликовать отзыв"}
                        </button>
                    </div>)}

                {/* Уже оставил отзыв */}
                {account && !isOwner && canReview && hasReview && (<div className="booking-box" style={{marginTop: 16}}>
                        <p className="success-msg" style={{margin: 0}}>
                            ✓ Вы уже оставили отзыв на эту квартиру
                        </p>
                    </div>)}

                {/* Отзывы */}
                <div className="reviews">
                    <h2>Отзывы {reviews.length > 0 && `(${reviews.length})`}</h2>
                    {reviews.length === 0 ? <p className="empty-msg">Отзывов пока нет</p> : reviews.map(r => (
                        <div className="review-item" key={r.id}>
                            <div style={{display: "flex", alignItems: "center", gap: 12}}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "var(--accent-grad)",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 16
                                }}>
                                    {(r.user ?? "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <span className="review-author">{r.user ?? "Пользователь"}</span>
                                    {r.rating && (<span className="review-rating">
                        {" "}{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>)}
                                    {r.created_at && (<p className="review-date">
                                            {new Date(r.created_at).toLocaleDateString("ru-RU")}
                                        </p>)}
                                </div>
                            </div>
                            <p className="review-text">{r.comment ?? r.text ?? r.body}</p>
                        </div>))}
                </div>

            </div>
            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>)
}