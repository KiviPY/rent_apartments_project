import {useState, useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {MapContainer, TileLayer, Marker, useMapEvents} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {api} from "../api"
import {useAuth} from "../context/AuthContext"
import Header from "../components/Header"

// Фикс иконки leaflet (стандартная проблема с webpack)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const PROPERTY_TYPES = ["Apartment", "House", "Studio", "Room"]
const RENT_DURATIONS = [...Array.from({length: 24}, (_, i) => i + 1), 999]

const COUNTRIES = [
    ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"],
    ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"],
    ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BY", "Belarus"],
    ["BE", "Belgium"], ["BA", "Bosnia and Herzegovina"], ["BR", "Brazil"],
    ["BG", "Bulgaria"], ["CA", "Canada"], ["CL", "Chile"],
    ["CN", "China"], ["CO", "Colombia"], ["HR", "Croatia"],
    ["CY", "Cyprus"], ["CZ", "Czech Republic"], ["DK", "Denmark"],
    ["EG", "Egypt"], ["EE", "Estonia"], ["FI", "Finland"],
    ["FR", "France"], ["GE", "Georgia"], ["DE", "Germany"],
    ["GR", "Greece"], ["HU", "Hungary"], ["IN", "India"],
    ["ID", "Indonesia"], ["IE", "Ireland"], ["IL", "Israel"],
    ["IT", "Italy"], ["JP", "Japan"], ["KZ", "Kazakhstan"],
    ["KE", "Kenya"], ["KW", "Kuwait"], ["LV", "Latvia"],
    ["LB", "Lebanon"], ["LT", "Lithuania"], ["LU", "Luxembourg"],
    ["MK", "North Macedonia"], ["MY", "Malaysia"], ["MT", "Malta"],
    ["MX", "Mexico"], ["MD", "Moldova"], ["ME", "Montenegro"],
    ["MA", "Morocco"], ["NL", "Netherlands"], ["NZ", "New Zealand"],
    ["NG", "Nigeria"], ["NO", "Norway"], ["PK", "Pakistan"],
    ["PL", "Poland"], ["PT", "Portugal"], ["QA", "Qatar"],
    ["RO", "Romania"], ["RU", "Russia"], ["SA", "Saudi Arabia"],
    ["RS", "Serbia"], ["SK", "Slovakia"], ["SI", "Slovenia"],
    ["ZA", "South Africa"], ["KR", "South Korea"], ["ES", "Spain"],
    ["SE", "Sweden"], ["CH", "Switzerland"], ["TW", "Taiwan"],
    ["TH", "Thailand"], ["TN", "Tunisia"], ["TR", "Turkey"],
    ["UA", "Ukraine"], ["AE", "United Arab Emirates"],
    ["GB", "United Kingdom"], ["US", "United States"], ["UZ", "Uzbekistan"],
]

const BOOL_FIELDS = [
    {key: "heating", label: "Отопление"},
    {key: "parking", label: "Парковка"},
    {key: "balcony", label: "Балкон"},
    {key: "terrace", label: "Терраса"},
    {key: "pets", label: "Можно с животными"},
    {key: "smoking", label: "Можно курить"},
    {key: "good_for_couples", label: "Для пар"},
    {key: "musical_instruments", label: "Муз. инструменты"},
    {key: "small_kids", label: "Можно с детьми"},
    {key: "is_furnished", label: "С мебелью"},
]

const EMPTY = {
    title: "", description: "", country: "", city: "",
    address: "", house_number: "", postal_code: "",
    property_type: "Apartment",
    price_per_month: "", currency: "EUR",
    min_rent_duration: 1, max_rent_duration: "",
    max_residents: 1, bedrooms: 1, bathrooms: 1, size_of_property: "",
    heating: false, parking: false, balcony: false, terrace: false,
    pets: false, smoking: false, good_for_couples: false,
    musical_instruments: false, small_kids: false, is_furnished: false,
    status: "active",
}

// Компонент — клик по карте перемещает маркер
function MapClickHandler({onLocationSelect}) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
        }
    })
    return null
}

export default function CreateApartment() {
    const navigate = useNavigate()
    const {account} = useAuth()

    const [form, setForm] = useState(EMPTY)
    const [images, setImages] = useState([])
    const [previews, setPreviews] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    // Координаты для карты
    const [coords, setCoords] = useState(null)      // { lat, lng }
    const [mapCenter, setMapCenter] = useState([51.5, 10]) // дефолт — центр Европы
    const [geoLoading, setGeoLoading] = useState(false)
    const [geoError, setGeoError] = useState(null)
    const [addressConfirmed, setAddressConfirmed] = useState(false)

    if (!account) {
        navigate("/login");
        return null
    }

    const set = (key, val) => {
        setForm(f => ({...f, [key]: val}))
        // При изменении адресных полей — сбрасываем подтверждение
        if (["country", "city", "address", "house_number", "postal_code"].includes(key)) {
            setAddressConfirmed(false)
            setGeoError(null)
        }
    }
    const setE = key => e => set(key, e.target.value)
    const setB = key => e => setForm(f => ({...f, [key]: e.target.checked}))

    const handleImages = (e) => {
        const files = Array.from(e.target.files)
        setImages(files)
        setPreviews(files.map(f => URL.createObjectURL(f)))
    }

    const removeImage = (i) => {
        setImages(prev => prev.filter((_, idx) => idx !== i))
        setPreviews(prev => prev.filter((_, idx) => idx !== i))
    }

    // Геокодинг через Nominatim (OpenStreetMap) — бесплатно, без ключа
    const geocodeAddress = async () => {
        const {address, house_number, city, postal_code, country} = form
        if (!address || !city || !country) {
            setGeoError("Заполните страну, город и улицу")
            return
        }

        setGeoLoading(true)
        setGeoError(null)

        // Собираем строку адреса для поиска
        const query = [
            house_number ? `${address} ${house_number}` : address,
            city,
            postal_code,
            COUNTRIES.find(([code]) => code === country)?.[1] ?? country
        ].filter(Boolean).join(", ")

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                {headers: {"Accept-Language": "ru"}}
            )
            const data = await res.json()

            if (!data.length) {
                setGeoError("Адрес не найден. Проверьте правильность написания.")
                setAddressConfirmed(false)
                return
            }

            const {lat, lon, display_name} = data[0]
            const newCoords = {lat: parseFloat(lat), lng: parseFloat(lon)}
            setCoords(newCoords)
            setMapCenter([newCoords.lat, newCoords.lng])
            setAddressConfirmed(true)
            setGeoError(null)

            // Сохраняем координаты в форму
            setForm(f => ({...f, latitude: newCoords.lat, longitude: newCoords.lng}))

        } catch {
            setGeoError("Ошибка при проверке адреса. Попробуйте ещё раз.")
        } finally {
            setGeoLoading(false)
        }
    }

    // Клик по карте — обновляем координаты
    const handleMapClick = (lat, lng) => {
        setCoords({lat, lng})
        setForm(f => ({...f, latitude: lat, longitude: lng}))
    }

    const handleSubmit = async () => {
        if (!addressConfirmed) {
            setError("Сначала проверьте адрес на карте")
            return
        }

        setLoading(true);
        setError(null)
        try {
            const fd = new FormData()
            const textFields = [
                "title", "description", "country", "city", "address",
                "house_number", "postal_code", "property_type", "price_per_month",
                "currency", "min_rent_duration", "max_rent_duration",
                "max_residents", "bedrooms", "bathrooms", "size_of_property",
                "status", "latitude", "longitude"
            ]
            textFields.forEach(k => {
                if (form[k] !== "" && form[k] !== null && form[k] !== undefined)
                    fd.append(k, form[k])
            })
            const boolFields = [
                "heating", "parking", "balcony", "terrace", "pets",
                "smoking", "good_for_couples", "musical_instruments",
                "small_kids", "is_furnished"
            ]
            boolFields.forEach(k => fd.append(k, form[k] ? "true" : "false"))

            const res = await api.createApartment(fd)
            const data = await res.json()
            if (!res.ok) {
                const msgs = Object.entries(data)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                    .join(" | ")
                throw new Error(msgs)
            }

            if (images.length > 0) {
                await Promise.all(images.map(file => {
                    const imgFd = new FormData()
                    imgFd.append("image", file)
                    return api.uploadImage(data.id, imgFd)
                }))
            }

            navigate(`/apartments/${data.id}`)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const section = (title) => (
        <h3 style={{
            marginTop: 24, marginBottom: 12, color: "#333",
            borderBottom: "1px solid #bbb", paddingBottom: 6
        }}>
            {title}
        </h3>
    )

    const field = (label, key, type = "text", props = {}) => (
        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
            <span>{label}</span>
            <input type={type} value={form[key]} onChange={setE(key)} {...props} />
        </label>
    )

    const row = (...children) => (
        <div style={{display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4}}>
            {children}
        </div>
    )

    return (
        <div>
            <Header/>
            <div className="container" style={{maxWidth: 800}}>
                <h1 style={{color: "#fff", marginBottom: 24}}>Добавить жильё</h1>

                <div style={{background: "#ddd", borderRadius: 12, padding: 28}}>

                    {section("Основная информация")}
                    {row(field("Название *", "title"))}
                    <label className="auth-field">
                        <span>Описание *</span>
                        <textarea value={form.description} onChange={setE("description")}
                                  rows={4} style={{
                            width: "100%", padding: "9px 12px", borderRadius: 6,
                            border: "1px solid #bbb", fontSize: 15, resize: "vertical"
                        }}/>
                    </label>

                    {section("Адрес")}
                    {row(
                        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                            <span>Страна *</span>
                            <select value={form.country} onChange={setE("country")}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 6,
                                        border: "1px solid #bbb", fontSize: 15
                                    }}>
                                <option value="">Выберите страну</option>
                                {COUNTRIES.map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                        </label>,
                        field("Город *", "city")
                    )}
                    {row(field("Улица *", "address"), field("Номер дома", "house_number", "number"))}
                    {row(field("Почтовый индекс", "postal_code"))}

                    {/* Кнопка проверки адреса */}
                    <div style={{marginTop: 8, marginBottom: 4}}>
                        <button
                            className="btn"
                            onClick={geocodeAddress}
                            disabled={geoLoading}
                            type="button"
                            style={{background: addressConfirmed ? "#17a589" : "#1abc9c"}}
                        >
                            {geoLoading ? "Проверяем..." : addressConfirmed ? "✓ Адрес подтверждён" : "Проверить адрес на карте"}
                        </button>
                    </div>

                    {geoError && <p className="error-msg" style={{marginTop: 8}}>{geoError}</p>}

                    {/* Карта — показывается после проверки адреса */}
                    {coords && (
                        <div style={{
                            marginTop: 16, borderRadius: 10, overflow: "hidden",
                            border: "2px solid #1abc9c"
                        }}>
                            <p style={{
                                background: "#1abc9c", color: "#fff", padding: "6px 12px",
                                margin: 0, fontSize: 13
                            }}>
                                📍 Можно уточнить позицию — кликни по карте
                            </p>
                            <MapContainer
                                center={mapCenter}
                                zoom={16}
                                style={{height: 300, width: "100%"}}
                                key={`${mapCenter[0]}-${mapCenter[1]}`}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                />
                                <Marker position={[coords.lat, coords.lng]}/>
                                <MapClickHandler onLocationSelect={handleMapClick}/>
                            </MapContainer>
                        </div>
                    )}

                    {section("Тип и аренда")}
                    {row(
                        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                            <span>Тип жилья</span>
                            <select value={form.property_type} onChange={setE("property_type")}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 6,
                                        border: "1px solid #bbb", fontSize: 15
                                    }}>
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>,
                        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                            <span>Статус</span>
                            <select value={form.status} onChange={setE("status")}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 6,
                                        border: "1px solid #bbb", fontSize: 15
                                    }}>
                                <option value="active">Активно</option>
                                <option value="inactive">Неактивно</option>
                            </select>
                        </label>
                    )}
                    {row(
                        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                            <span>Мин. срок аренды</span>
                            <select value={form.min_rent_duration} onChange={setE("min_rent_duration")}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 6,
                                        border: "1px solid #bbb", fontSize: 15
                                    }}>
                                {RENT_DURATIONS.map(n => (
                                    <option key={n} value={n}>{n === 999 ? "Более 24 мес." : `${n} мес.`}</option>
                                ))}
                            </select>
                        </label>,
                        <label className="auth-field" style={{flex: 1, minWidth: 180}}>
                            <span>Макс. срок аренды</span>
                            <select value={form.max_rent_duration} onChange={setE("max_rent_duration")}
                                    style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 6,
                                        border: "1px solid #bbb", fontSize: 15
                                    }}>
                                <option value="">Не ограничен</option>
                                {RENT_DURATIONS.map(n => (
                                    <option key={n} value={n}>{n === 999 ? "Более 24 мес." : `${n} мес.`}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {section("Цена")}
                    {row(
                        field("Цена в месяц *", "price_per_month", "number", {min: 1}),
                        field("Валюта", "currency")
                    )}

                    {section("Характеристики")}
                    {row(
                        field("Макс. жильцов", "max_residents", "number", {min: 1}),
                        field("Спальни", "bedrooms", "number", {min: 0}),
                        field("Ванные", "bathrooms", "number", {min: 0}),
                        field("Площадь (м²) *", "size_of_property", "number", {min: 1}),
                    )}

                    {section("Удобства и правила")}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 10
                    }}>
                        {BOOL_FIELDS.map(({key, label}) => (
                            <label key={key} style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}}>
                                <input type="checkbox" checked={form[key]} onChange={setB(key)}
                                       style={{width: 16, height: 16, accentColor: "#1abc9c"}}/>
                                <span style={{fontSize: 14}}>{label}</span>
                            </label>
                        ))}
                    </div>

                    {section("Фото")}
                    <input type="file" accept="image/*" multiple onChange={handleImages}/>
                    {previews.length > 0 && (
                        <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12}}>
                            {previews.map((src, i) => (
                                <div key={i} style={{position: "relative"}}>
                                    <img src={src} alt=""
                                         style={{
                                             width: 120, height: 90, objectFit: "cover",
                                             borderRadius: 6, display: "block"
                                         }}/>
                                    <button onClick={() => removeImage(i)} style={{
                                        position: "absolute", top: 4, right: 4,
                                        background: "rgba(0,0,0,0.6)", color: "#fff",
                                        border: "none", borderRadius: "50%",
                                        width: 22, height: 22, cursor: "pointer", fontSize: 14,
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <p className="error-msg" style={{marginTop: 16}}>{error}</p>}

                    <button className="btn" onClick={handleSubmit} disabled={loading}
                            style={{marginTop: 24, width: "100%", fontSize: 16}}>
                        {loading ? "Сохранение..." : "Опубликовать"}
                    </button>
                </div>
            </div>
            <footer>© 2026 RentEasy. Все права защищены.</footer>
        </div>
    )
}