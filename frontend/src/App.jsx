import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Camera from "./pages/Camera";
import Audio from "./pages/Audio";
import BreedFinder from "./pages/BreedFinder";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/audio" element={<Audio />} />
        <Route path="/breed-finder" element={<BreedFinder />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}
