import {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import {api} from "../api"
import {useAuth} from "../context/AuthContext"
import Header from "../components/Header"

const PROPERTY_TYPES = ["Apartment", "House", "Studio", "Room"]
const RENT_DURATIONS = [...Array.from({length: 24}, (_, i) => i + 1), 999]

const COUNTRIES = [["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"], ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BY", "Belarus"], ["BE", "Belgium"], ["BA", "Bosnia and Herzegovina"], ["BR", "Brazil"], ["BG", "Bulgaria"], ["CA", "Canada"], ["CL", "Chile"], ["CN", "China"], ["CO", "Colombia"], ["HR", "Croatia"], ["CY", "Cyprus"], ["CZ", "Czech Republic"], ["DK", "Denmark"], ["EG", "Egypt"], ["EE", "Estonia"], ["FI", "Finland"], ["FR", "France"], ["GE", "Georgia"], ["DE", "Germany"], ["GR", "Greece"], ["HU", "Hungary"], ["IN", "India"], ["ID", "Indonesia"], ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"], ["JP", "Japan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"], ["KW", "Kuwait"], ["LV", "Latvia"], ["LB", "Lebanon"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MK", "North Macedonia"], ["MY", "Malaysia"], ["MT", "Malta"], ["MX", "Mexico"], ["MD", "Moldova"], ["ME", "Montenegro"], ["MA", "Morocco"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NG", "Nigeria"], ["NO", "Norway"], ["PK", "Pakistan"], ["PL", "Poland"], ["PT", "Portugal"], ["QA", "Qatar"], ["RO", "Romania"], ["RU", "Russia"], ["SA", "Saudi Arabia"], ["RS", "Serbia"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["ZA", "South Africa"], ["KR", "South Korea"], ["ES", "Spain"], ["SE", "Sweden"], ["CH", "Switzerland"], ["TW", "Taiwan"], ["TH", "Thailand"], ["TN", "Tunisia"], ["TR", "Turkey"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"], ["GB", "United Kingdom"], ["US", "United States"], ["UZ", "Uzbekistan"],]

const BOOL_FIELDS = [{key: "heating", label: "Отопление"}, {key: "parking", label: "Парковка"}, {
    key: "balcony",
    label: "Балкон"
}, {key: "terrace", label: "Терраса"}, {key: "pets", label: "Можно с животными"}, {
    key: "smoking",
    label: "Можно курить"
}, {key: "good_for_couples", label: "Для пар"}, {
    key: "musical_instruments",
    label: "Муз. инструменты"
}, {key: "small_kids", label: "Можно с детьми"}, {key: "is_furnished", label: "С мебелью"},]

export default function EditApartment() {
    const {id} = useParams()
    const navigate = useNavigate()
    const {account} = useAuth()

    const [form, setForm] = useState(null)
    const [existingImages, setExistingImages] = useState([]) // уже загруженные фото
    const [newImages, setNewImages] = useState([])           // новые файлы
    const [newPreviews, setNewPreviews] = useState([])       // превью новых
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!account) {
            navigate("/login");
            return
        }
        api.apartment(id)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                setForm({
                    title: data.title ?? "",
                    description: data.description ?? "",
                    country: data.country ?? "",
                    city: data.city ?? "",
                    address: data.address ?? "",
                    house_number: data.house_number ?? "",
                    postal_code: data.postal_code ?? "",
                    property_type: data.property_type ?? "Apartment",
                    price_per_month: data.price_per_month ?? "",
                    currency: data.currency ?? "EUR",
                    min_rent_duration: data.min_rent_duration ?? 1,
                    max_rent_duration: data.max_rent_duration ?? "",
                    max_residents: data.max_residents ?? 1,
                    bedrooms: data.bedrooms ?? 1,
                    bathrooms: data.bathrooms ?? 1,
                    size_of_property: data.size_of_property ?? "",
                    heating: data.heating ?? false,
                    parking: data.parking ?? false,
                    balcony: data.balcony ?? false,
                    terrace: data.terrace ?? false,
                    pets: data.pets ?? false,
                    smoking: data.smoking ?? false,
                    good_for_couples: data.good_for_couples ?? false,
                    musical_instruments: data.musical_instruments ?? false,
                    small_kids: data.small_kids ?? false,
                    is_furnished: data.is_furnished ?? false,
                    status: data.status ?? "active",
                })
                // Загружаем существующие фото из ApartmentImage
                setExistingImages(data.images ?? [])
            })
            .catch(() => setError("Не удалось загрузить квартиру"))
            .finally(() => setLoading(false))
    }, [id, account, navigate])

    const set = (key, val) => setForm(f => ({...f, [key]: val}))
    const setE = key => e => set(key, e.target.value)
    const setB = key => e => set(key, e.target.checked)

    // Выбор новых фото
    const handleNewImages = (e) => {
        const files = Array.from(e.target.files)
        setNewImages(files)
        setNewPreviews(files.map(f => URL.createObjectURL(f)))
    }

    // Удалить существующее фото
    const deleteExisting = async (imageId) => {
        await api.deleteImage(imageId)
        setExistingImages(prev => prev.filter(img => img.id !== imageId))
    }

    // Удалить новое превью до сохранения
    const removeNew = (i) => {
        setNewImages(prev => prev.filter((_, idx) => idx !== i))
        setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
    }

    const handleSubmit = async () => {
        setSaving(true);
        setError(null)
        try {
            // Шаг 1 — обновляем данные квартиры
            const fd = new FormData()
            const textFields = ["title", "description", "country", "city", "address", "house_number", "postal_code", "property_type", "price_per_month", "currency", "min_rent_duration", "max_rent_duration", "max_residents", "bedrooms", "bathrooms", "size_of_property", "status"]
            textFields.forEach(k => {
                if (form[k] !== "" && form[k] !== null && form[k] !== undefined) fd.append(k, form[k])
            })
            const boolFields = ["heating", "parking", "balcony", "terrace", "pets", "smoking", "good_for_couples", "musical_instruments", "small_kids", "is_furnished"]
            boolFields.forEach(k => fd.append(k, form[k] ? "true" : "false"))

            const headers = {}
            if (window.__accessToken__) headers["Authorization"] = `Bearer ${window.__accessToken__}`

            const res = await fetch(`http://13.50.199.197/my_apartments/${id}/`, {
                method: "PATCH", body: fd, headers
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(Object.entries(data)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                    .join(" | "))
            }

            // Шаг 2 — загружаем новые фото параллельно
            if (newImages.length > 0) {
                await Promise.all(newImages.map(file => {
                    const imgFd = new FormData()
                    imgFd.append("image", file)
                    return api.uploadImage(id, imgFd)
                }))
            }

            navigate(`/apartments/${id}`)
        } catch (e) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const section = (title) => (<h3 style={{
            marginTop: 24,
            marginBottom: 12,
            color: "var(--text)",
            borderBottom: "1px solid var(--glass-border)",
            paddingBottom: 6
        }}>
            {title}
        </h3>)

    const field = (label, key, type = "text", props = {}) => (
        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
            <span>{label}</span>
            <input type={type} value={form[key] ?? ""} onChange={setE(key)} {...props} />
        </label>)

    const row = (...children) => (<div style={{display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4}}>
            {children}
        </div>)

    if (loading) return <><Header/><p className="loading-msg" style={{padding: 24}}>Загрузка...</p></>
    if (!form) return <><Header/><p className="error-msg" style={{padding: 24}}>{error}</p></>

    return (<div>
            <Header/>
            <div className="container" style={{maxWidth: 800}}>
                <h1 style={{color: "var(--text)", marginBottom: 24, fontSize: 26, fontWeight: 800}}>
                    Редактировать квартиру
                </h1>

                <div style={{
                    background: "var(--bg2)", borderRadius: 16, padding: 28, border: "1px solid var(--glass-border)"
                }}>

                    {section("Основная информация")}
                    {row(field("Название *", "title"))}
                    <label className="auth-field">
                        <span>Описание *</span>
                        <textarea value={form.description} onChange={setE("description")} rows={4}
                                  style={{
                                      width: "100%",
                                      padding: "9px 12px",
                                      borderRadius: 10,
                                      border: "1px solid var(--glass-border)",
                                      fontSize: 15,
                                      resize: "vertical",
                                      background: "var(--bg3)",
                                      color: "var(--text)",
                                      fontFamily: "inherit"
                                  }}/>
                    </label>

                    {section("Адрес")}
                    {row(<label className="auth-field" style={{flex: 1, minWidth: 180}}>
                        <span>Страна *</span>
                        <select value={form.country} onChange={setE("country")}>
                            <option value="">Выберите страну</option>
                            {COUNTRIES.map(([code, name]) => (<option key={code} value={code}>{name}</option>))}
                        </select>
                    </label>, field("Город *", "city"))}
                    {row(field("Улица *", "address"), field("Номер дома", "house_number", "number"))}
                    {row(field("Почтовый индекс *", "postal_code"))}

                    {section("Тип и аренда")}
                    {row(<label className="auth-field" style={{flex: 1, minWidth: 180}}>
                        <span>Тип жилья</span>
                        <select value={form.property_type} onChange={setE("property_type")}>
                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>, <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                        <span>Статус</span>
                        <select value={form.status} onChange={setE("status")}>
                            <option value="active">Активно</option>
                            <option value="inactive">Неактивно</option>
                        </select>
                    </label>)}
                    {row(<label className="auth-field" style={{flex: 1, minWidth: 180}}>
                        <span>Мин. срок аренды</span>
                        <select value={form.min_rent_duration} onChange={setE("min_rent_duration")}>
                            {RENT_DURATIONS.map(n => (
                                <option key={n} value={n}>{n === 999 ? "Более 24 мес." : `${n} мес.`}</option>))}
                        </select>
                    </label>, <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                        <span>Макс. срок аренды</span>
                        <select value={form.max_rent_duration} onChange={setE("max_rent_duration")}>
                            <option value="">Не ограничен</option>
                            {RENT_DURATIONS.map(n => (
                                <option key={n} value={n}>{n === 999 ? "Более 24 мес." : `${n} мес.`}</option>))}
                        </select>
                    </label>)}

                    {section("Цена")}
                    {row(field("Цена в месяц *", "price_per_month", "number", {min: 1}), field("Валюта", "currency"))}

                    {section("Характеристики")}
                    {row(field("Макс. жильцов", "max_residents", "number", {min: 1}), field("Спальни", "bedrooms", "number", {min: 0}), field("Ванные", "bathrooms", "number", {min: 0}), field("Площадь (м²) *", "size_of_property", "number", {min: 1}),)}

                    {section("Удобства и правила")}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10
                    }}>
                        {BOOL_FIELDS.map(({key, label}) => (<label key={key} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                                fontSize: 14,
                                color: "var(--text2)"
                            }}>
                                <input type="checkbox" checked={form[key]} onChange={setB(key)}
                                       style={{width: 16, height: 16, accentColor: "var(--accent)"}}/>
                                {label}
                            </label>))}
                    </div>

                    {section("Фото")}

                    {/* Существующие фото */}
                    {existingImages.length > 0 && (<div style={{marginBottom: 16}}>
                            <p style={{fontSize: 13, color: "var(--text2)", marginBottom: 8}}>
                                Текущие фото — нажми × чтобы удалить:
                            </p>
                            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                                {existingImages.map(img => (<div key={img.id} style={{position: "relative"}}>
                                        <img src={img.image} alt=""
                                             style={{
                                                 width: 120,
                                                 height: 90,
                                                 objectFit: "cover",
                                                 borderRadius: 8,
                                                 display: "block",
                                                 border: "1px solid var(--glass-border)"
                                             }}/>
                                        <button onClick={() => deleteExisting(img.id)} style={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            background: "rgba(231,76,60,0.85)",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: 22,
                                            height: 22,
                                            cursor: "pointer",
                                            fontSize: 14,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>×
                                        </button>
                                    </div>))}
                            </div>
                        </div>)}

                    {/* Новые фото */}
                    <label style={{
                        display: "block", marginBottom: 8, fontSize: 13, color: "var(--text2)"
                    }}>
                        Добавить новые фото:
                    </label>
                    <input type="file" accept="image/*" multiple onChange={handleNewImages}
                           style={{color: "var(--text2)"}}/>

                    {newPreviews.length > 0 && (<div style={{display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12}}>
                            {newPreviews.map((src, i) => (<div key={i} style={{position: "relative"}}>
                                    <img src={src} alt=""
                                         style={{
                                             width: 120,
                                             height: 90,
                                             objectFit: "cover",
                                             borderRadius: 8,
                                             display: "block",
                                             border: "1px solid var(--accent)"
                                         }}/>
                                    <button onClick={() => removeNew(i)} style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        background: "rgba(0,0,0,0.6)",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: 22,
                                        height: 22,
                                        cursor: "pointer",
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>×
                                    </button>
                                </div>))}
                        </div>)}

                    {error && <p className="error-msg" style={{marginTop: 16}}>{error}</p>}

                    <div style={{display: "flex", gap: 12, marginTop: 28}}>
                        <button className="btn" onClick={handleSubmit} disabled={saving}
                                style={{flex: 1, fontSize: 15}}>
                            {saving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                        <button className="btn" onClick={() => navigate(`/apartments/${id}`)}
                                style={{
                                    background: "var(--glass)",
                                    color: "var(--text2)",
                                    border: "1px solid var(--glass-border)"
                                }}>
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>)
}