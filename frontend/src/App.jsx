import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Audio from "./pages/Audio";
import BreedFinder from "./pages/BreedFinder";
import Settings from "./pages/Settings";
import CreateProfile from "./pages/CreateProfile";
import RegisterPet from "./pages/RegisterPet";
import Moniter from "./pages/Moniter";
import Calendar from "./pages/Calendar";
import Stats from "./pages/Stats";
import Community from "./pages/Community";
import CreatePost from "./pages/CreatePost";
import Post from "./pages/Post";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/audio" element={<Audio />} />
        <Route path="/breed-finder" element={<BreedFinder />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/moniter" element={<ProtectedRoute><Moniter /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/community/new" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/community/:id" element={<ProtectedRoute><Post /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/register-pet" element={<ProtectedRoute><RegisterPet /></ProtectedRoute>} />

        <Route path="/camera" element={<Navigate to="/moniter" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
