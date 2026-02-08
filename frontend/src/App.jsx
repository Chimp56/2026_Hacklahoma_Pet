import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Camera from "./pages/Moniter";
import Audio from "./pages/Audio";
import BreedFinder from "./pages/BreedFinder";
import Settings from "./pages/Settings";
import CreateProfile from "./pages/CreateProfile";
import RegisterPet from "./pages/RegisterPet";
import Moniter from "./pages/Moniter";
import Calender from "./pages/Calender";
import Stats from "./pages/Stats";
import Community from "./pages/Community";


export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/community" element= {<Community />} />
        <Route path ="/stats" element= {<Stats />} />
        <Route path ="/calender" element= {<Calender />} />
        <Route path="/moniter" element = {<Moniter />} />
        <Route path="/register-pet" element={<RegisterPet />} />
        <Route path="/create-profile" element={<CreateProfile />} />
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
