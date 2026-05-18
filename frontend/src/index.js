import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ApartmentList   from "./pages/ApartmentList"
import ApartmentDetail from "./pages/ApartmentDetail"
import Login           from "./pages/Login"
import Register        from "./pages/Register"
import Chat            from "./pages/Chat"
import ChatList        from "./pages/ChatList"
import CreateApartment from "./pages/CreateApartment"
import EditApartment   from "./pages/EditApartment"
import Profile         from "./pages/Profile"
import "./App.css"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                      element={<ApartmentList />} />
          <Route path="/apartments/create"     element={<CreateApartment />} />
          <Route path="/apartments/:id/edit"   element={<EditApartment />} />
          <Route path="/apartments/:id"        element={<ApartmentDetail />} />
          <Route path="/login"                 element={<Login />} />
          <Route path="/register"              element={<Register />} />
          <Route path="/chat"                  element={<ChatList />} />
          <Route path="/chat/:roomId"          element={<Chat />} />
          <Route path="/profile"              element={<Profile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)