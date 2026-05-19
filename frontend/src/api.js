const BASE = "http://13.50.199.197"

let accessToken = null

export const setToken = (token) => {
    accessToken = token
    window.__accessToken__ = token
}

export const clearToken = () => {
    accessToken = null
}

const req = (url, options = {}) => {
    const headers = {...(options.headers ?? {})}
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`
    return fetch(BASE + url, {...options, headers})
}

const json = (url, method, data) =>
    req(url, {
        method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    })

export const buildQuery = (params) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined && v !== false) {
            q.append(k, v)
        }
    })
    return q.toString()
}

export const api = {
    // Auth
    me: () => req("/auth/me/"),
    login: (data) => json("/auth/login/", "POST", data),
    verify2fa: (data) => json("/auth/verify/", "POST", data),
    register: (data) => json("/auth/register/", "POST", data),
    logout: () => json("/auth/logout/", "POST", {}),
    refresh: () => json("/api/token/refresh/", "POST",
        {refresh: localStorage.getItem("refresh")}),
    updateProfile: (data) => json("/auth/me/", "PATCH", data),

    // Apartments
    apartments: (params = {}) => req(`/apartments/?${buildQuery(params)}`),
    apartment: (id) => req(`/apartments/${id}/`),
    myApartments: () => req("/my_apartments/"),
    createApartment: (data) => {
        const headers = {}
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`
        return fetch(BASE + "/apartments/", {method: "POST", body: data, headers})
    },
    updateApartment: (id, data) => json(`/my_apartments/${id}/`, "PATCH", data),
    deleteApartment: (id) => req(`/my_apartments/${id}/`, {method: "DELETE"}),

    // Images
    uploadImage: (apartmentId, formData) =>
        req(`/apartments/${apartmentId}/images/`, {method: "POST", body: formData}),
    deleteImage: (imageId) =>
        req(`/images/${imageId}/`, {method: "DELETE"}),

    // Reviews
    reviews: (id) => req(`/apartments/${id}/reviews/`),
    createReview: (id, data) => json(`/apartments/${id}/reviews/`, "POST", data),

    // Renting (bookings)
    myBookings: () => req("/bookings/"),
    requestRenting: (id) => json(`/apartments/${id}/bookings/`, "POST", {}),
    ownerRentings: () => req("/owner/bookings/"),
    updateRentingStatus: (id, status) => json(`/owner/bookings/${id}/`, "PATCH", {status}),

    // Chat
    chatRooms: () => req("/chat/rooms/"),
    chatCreate: (data) => json("/chat/rooms/", "POST", data),
    chatMessages: (roomId) => req(`/chat/rooms/${roomId}/messages/`),
    deleteChat: (roomId) => req(`/chat/rooms/${roomId}/`, {method: "DELETE"}),
}