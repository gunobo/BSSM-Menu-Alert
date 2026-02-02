import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import MyPage from "./pages/MyPage.jsx";
import AdminRoute from "./Routes/AdminRoute.jsx"
import AdminPage from "./pages/AdminPage.jsx";
import Announcements from "./pages/Announcements.jsx";
import AnnouncementDetail from "./pages/AnnouncementDetail.jsx";
import NotFound from "./pages/NOTFOUND.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/announcements/:id" element={<AnnouncementDetail />} />
      <Route 
        path="/adminpages" 
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
