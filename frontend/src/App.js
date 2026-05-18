export default function App() {
  return null
}
//
// import { useEffect, useState } from "react"
// import "./App.css"
//
// function App() {
//   const [apartments, setApartments] = useState([])
//   const [search, setSearch] = useState("")
//   const [account, setAccount] = useState(null)  // null, не ""
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//
//   useEffect(() => {
//     const controller = new AbortController()
//
//     const delay = setTimeout(() => {
//       setLoading(true)
//       setError(null)
//
//       fetch(`http://127.0.0.1:8000/apartments/?search=${search}`, {
//         signal: controller.signal,
//       })
//         .then(res => {
//           if (!res.ok) throw new Error(`Error ${res.status}`)
//           return res.json()
//         })
//         .then(data => setApartments(data.results ?? data))
//         .catch(err => {
//           if (err.name !== "AbortError") setError(err.message)
//         })
//         .finally(() => setLoading(false))
//     }, 500)
//
//     return () => {
//       clearTimeout(delay)
//       controller.abort()  // отменяем запрос при новом вводе
//     }
//   }, [search])
//
//   return (
//     <div>
//       <header>
//         <div className="logo">RentEasy</div>
//
//         <div className="search-bar">
//           <input
//             type="text"
//             placeholder="City, name or description"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//
//         <nav>
//           <a href="/">Главная</a>
//           {account ? (
//             <span>{account.username}</span>
//           ) : (
//             <>
//               <a href="/auth/login/">Войти</a>
//               <a href="/auth/register/">Регистрация</a>
//             </>
//           )}
//         </nav>
//       </header>
//
//       <div className="container">
//         {loading && <p>Загрузка...</p>}
//         {error && <p className="error">{error}</p>}
//         {!loading && !error && apartments.length === 0 && (
//           <p>Квартиры не найдены</p>
//         )}
//         {apartments.map(ap => (
//           <div className="card" key={ap.id}>
//             <div className="image" />
//             <div className="info">
//               <h2 className="title">{ap.title}</h2>
//               <p>{ap.city}, {ap.country}</p>
//               <p className="price">{ap.price_per_month} €</p>
//               <p>{ap.address}</p>
//               <p>{ap.property_type}</p>
//               <p>{ap.min_rent_duration} months</p>
//             </div>
//           </div>
//         ))}
//       </div>
//
//       <footer>
//         © 2026 RentEasy. Все права защищены.
//       </footer>
//     </div>
//   )
// }
//
// export default App
