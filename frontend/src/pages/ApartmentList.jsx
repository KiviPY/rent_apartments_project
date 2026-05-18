import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {api} from "../api"
import Header from "../components/Header"

const PROPERTY_TYPES = ["Apartment", "House", "Studio", "Room", "Villa"]

const BOOL_FILTERS = [
    {key: "has_heating", label: "Отопление"},
    {key: "has_parking", label: "Парковка"},
    {key: "has_balcony", label: "Балкон"},
    {key: "has_terrace", label: "Терраса"},
    {key: "permission_for_pets", label: "Можно с животными"},
    {key: "permission_for_smoking", label: "Можно курить"},
    {key: "is_good_for_couples", label: "Для пар"},
    {key: "permission_for_musical_instruments", label: "Муз. инструменты"},
    {key: "permission_for_small_kids", label: "Можно с детьми"},
    {key: "is_furnished", label: "С мебелью"},
]

const EMPTY_FILTERS = {
    city: "", min_price: "", max_price: "", property_type: "",
    min_rent_duration: "", max_rent_duration: "", min_residents: "",
    min_bedrooms: "", min_bathrooms: "", min_size_of_property: "",
    min_average_rating: "", has_heating: false, has_parking: false,
    has_balcony: false, has_terrace: false, permission_for_pets: false,
    permission_for_smoking: false, is_good_for_couples: false,
    permission_for_musical_instruments: false, permission_for_small_kids: false,
    is_furnished: false,
}

export default function ApartmentList() {
    const [apartments, setApartments] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState(EMPTY_FILTERS)
    const [applied, setApplied] = useState(EMPTY_FILTERS)
    const [ordering, setOrdering] = useState("")
    const navigate = useNavigate()

    const activeCount = Object.entries(applied).filter(([, v]) => v !== "" && v !== false).length

    useEffect(() => {
        const controller = new AbortController()
        const delay = setTimeout(() => {
            setLoading(true);
            setError(null)
            api.apartments({search, ordering, ...applied})
                .then(res => {
                    if (!res.ok) throw new Error(`Ошибка ${res.status}`);
                    return res.json()
                })
                .then(data => setApartments(data.results ?? data))
                .catch(err => {
                    if (err.name !== "AbortError") setError(err.message)
                })
                .finally(() => setLoading(false))
        }, 500)
        return () => {
            clearTimeout(delay);
            controller.abort()
        }
    }, [search, applied, ordering])

    const setF = (key, value) => setFilters(f => ({...f, [key]: value}))
    const applyFilters = () => {
        setApplied(filters);
        setShowFilters(false)
    }
    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setApplied(EMPTY_FILTERS)
    }

    return (
        <div>
            <Header search={search} onSearch={setSearch}/>

            <div className="container">

                {/* Панель управления */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: 20, flexWrap: "wrap"
                }}>
                    <button className="btn" onClick={() => setShowFilters(v => !v)}
                            style={{background: showFilters ? "var(--accent)" : "var(--accent-grad)"}}>
                        ⚙ {showFilters ? "Скрыть" : `Фильтры${activeCount > 0 ? ` (${activeCount})` : ""}`}
                    </button>

                    {/* Сортировка */}
                    <select value={ordering} onChange={e => setOrdering(e.target.value)}
                            style={{
                                padding: "9px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                                border: "1px solid var(--glass-border)", background: "var(--bg2)",
                                color: "var(--text)", cursor: "pointer", outline: "none"
                            }}>
                        <option value="">Сортировка</option>
                        <option value="price_per_month">Цена ↑</option>
                        <option value="-price_per_month">Цена ↓</option>
                        <option value="-average_rating">Рейтинг ↓</option>
                        <option value="average_rating">Рейтинг ↑</option>
                        <option value="-created_at">Новые</option>
                        <option value="created_at">Старые</option>
                        <option value="-views_count">Популярные</option>
                    </select>

                    {activeCount > 0 && (
                        <span className="auth-link" onClick={resetFilters}>Сбросить всё</span>
                    )}
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 16,
                            marginBottom: 20
                        }}>
                            <label className="auth-field">
                                <span>Город</span>
                                <input type="text" value={filters.city} onChange={e => setF("city", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Тип жилья</span>
                                <select value={filters.property_type}
                                        onChange={e => setF("property_type", e.target.value)}>
                                    <option value="">Любой</option>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>
                            <label className="auth-field">
                                <span>Цена от (€)</span>
                                <input type="number" min="0" value={filters.min_price}
                                       onChange={e => setF("min_price", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Цена до (€)</span>
                                <input type="number" min="0" value={filters.max_price}
                                       onChange={e => setF("max_price", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Аренда от (мес.)</span>
                                <input type="number" min="1" value={filters.min_rent_duration}
                                       onChange={e => setF("min_rent_duration", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Аренда до (мес.)</span>
                                <input type="number" min="1" value={filters.max_rent_duration}
                                       onChange={e => setF("max_rent_duration", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Жильцов минимум</span>
                                <input type="number" min="1" value={filters.min_residents}
                                       onChange={e => setF("min_residents", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Спален минимум</span>
                                <input type="number" min="0" value={filters.min_bedrooms}
                                       onChange={e => setF("min_bedrooms", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Ванных минимум</span>
                                <input type="number" min="0" value={filters.min_bathrooms}
                                       onChange={e => setF("min_bathrooms", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Площадь от (м²)</span>
                                <input type="number" min="0" value={filters.min_size_of_property}
                                       onChange={e => setF("min_size_of_property", e.target.value)}/>
                            </label>
                            <label className="auth-field">
                                <span>Рейтинг от</span>
                                <select value={filters.min_average_rating}
                                        onChange={e => setF("min_average_rating", e.target.value)}>
                                    <option value="">Любой</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{"★".repeat(n)} {n}+</option>)}
                                </select>
                            </label>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                            gap: 10,
                            marginBottom: 20
                        }}>
                            {BOOL_FILTERS.map(({key, label}) => (
                                <label key={key} style={{
                                    display: "flex", alignItems: "center",
                                    gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text2)"
                                }}>
                                    <input type="checkbox" checked={filters[key]}
                                           onChange={e => setF(key, e.target.checked)}
                                           style={{width: 16, height: 16, accentColor: "var(--accent)"}}/>
                                    {label}
                                </label>
                            ))}
                        </div>

                        <div style={{display: "flex", gap: 12}}>
                            <button className="btn" onClick={applyFilters}>Применить</button>
                            <button className="btn" onClick={resetFilters}
                                    style={{
                                        background: "var(--glass)", color: "var(--text2)",
                                        border: "1px solid var(--glass-border)"
                                    }}>
                                Сбросить
                            </button>
                        </div>
                    </div>
                )}

                {loading && <p className="loading-msg">Загрузка...</p>}
                {error && <p className="error-msg">{error}</p>}
                {!loading && !error && apartments.length === 0 && (
                    <p className="empty-msg">Квартиры не найдены</p>
                )}

                <div className="cards-grid">
                    {apartments.map(ap => (
                        <div className="card" key={ap.id} onClick={() => navigate(`/apartments/${ap.id}`)}>
                            {ap.images?.[0]
                                ? <img className="image" src={ap.images[0].image} alt={ap.title}/>
                                : <div className="image" style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "var(--text3)", fontSize: 40
                                }}>🏠</div>
                            }
                            <div className="info">
                                <h2 className="title">{ap.title}</h2>
                                <p className="meta">📍 {ap.city}, {ap.country}</p>
                                <p className="price">{ap.price_per_month} € / мес</p>
                                <div style={{display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4}}>
                                    <span className="badge">{ap.property_type}</span>
                                    <span className="badge">от {ap.min_rent_duration} мес.</span>
                                </div>
                                {ap.average_rating > 0 && (
                                    <p style={{color: "#f0a500", fontSize: 13, marginTop: 6}}>
                                        {"★".repeat(Math.round(ap.average_rating))} {ap.average_rating.toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>
    )
}