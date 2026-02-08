import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// 1. Import the PetProvider from your contexts folder
import { PetProvider } from './PetContext'; // Double check this path!
// Import Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Moniter from "./pages/Moniter";
import Audio from "./pages/Audio";
import BreedFinder from "./pages/BreedFinder";
import Settings from "./pages/Settings";
import CreateProfile from "./pages/CreateProfile";
import RegisterPet from "./pages/RegisterPet";
import Calendar from "./pages/Calendar";
import Stats from "./pages/Stats";
import Community from "./pages/Community";

export default function App() {
  // 1. SHARED STATE: Events (Calendar & Dashboard)
  const [events, setEvents] = useState([
    { id: 1, year: 2026, month: 1, day: 7, title: "Check-in Today", color: "#A78BFA" },
    { id: 2, year: 2026, month: 1, day: 15, title: "Vet Visit 🏥", color: "#F472B6" }
  ]);

  // 2. SHARED STATE: Pet Health (Stats & Dashboard synced)
  const [petStats, setPetStats] = useState({
    hunger: 80,
    happiness: 95,
    health: 100,
    sleepHours: 8,
    activityLevel: 'Active'
  });

  // 3. SHARED STATE: Monitor Alerts
  const [alerts, setAlerts] = useState([
    { id: 1, time: "10:30 AM", msg: "Bark detected in living room" }
  ]);

  return (
    /* --- WRAP EVERYTHING IN PETPROVIDER --- */
    <PetProvider>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/calendar"
              element={<Calendar events={events} setEvents={setEvents} />}
            />

            <Route
              path="/home"
              element={<Home events={events} petStats={petStats} alerts={alerts} />}
            />

            <Route
              path="/stats"
              element={<Stats petStats={petStats} setPetStats={setPetStats} />}
            />

            <Route path="/moniter" element={<Moniter alerts={alerts} setAlerts={setAlerts} />} />
            <Route path="/community" element={<Community />} />
            <Route path="/register-pet" element={<RegisterPet />} />
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/audio" element={<Audio />} />
            <Route path="/breed-finder" element={<BreedFinder />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </PetProvider>
  );
}
