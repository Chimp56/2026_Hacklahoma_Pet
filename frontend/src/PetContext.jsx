import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api/api';

const PetContext = createContext();

const emojis = { Dog: '🐶', Cat: '🐱', Bird: '🦜', Other: '🐾' };

/** Map API pet (species, date_of_birth, health_notes, profile_photo_url) to frontend shape (type, age, medical, image). */
function apiPetToFrontend(apiPet) {
  const species = apiPet.species || 'Other';
  const image = apiPet.profile_photo_url || emojis[species] || '🐾';
  return {
    id: apiPet.id,
    name: apiPet.name,
    type: species,
    breed: apiPet.breed ?? '',
    gender: apiPet.gender ?? '',
    age: apiPet.date_of_birth ?? '',
    weight: apiPet.weight ?? '',
    medical: apiPet.health_notes ?? '',
    image,
    profile_photo_url: apiPet.profile_photo_url ?? null,
    stats: apiPet.stats ?? { sleepHours: 8, activityData: [8, 7, 9, 11, 8, 10, 8] },
  };
}

const MOCK_PETS = [
  { id: 2, name: 'Buddy', type: 'Dog', breed: 'Golden Retriever', image: '🐶', stats: { sleepHours: 8, activityData: [8, 7, 9, 11, 8, 10, 8] } },
  { id: 1, name: 'Luna', type: 'Cat', breed: 'Siamese', image: '🐱', stats: { sleepHours: 14, activityData: [12, 15, 13, 14, 16, 14, 15] } },
];

export const PetProvider = ({ children }) => {
  const [pets, setPets] = useState(MOCK_PETS);
  const [activePet, setActivePet] = useState(MOCK_PETS[0]);
  const [petsLoaded, setPetsLoaded] = useState(false);

  useEffect(() => {
    if (petsLoaded) return;

    function applyList(list) {
      if (list && list.length > 0) {
        const mapped = list.map(apiPetToFrontend);
        setPets(mapped);
        setActivePet((prev) => {
          const same = mapped.find((p) => p.id === prev?.id);
          return same || mapped[0];
        });
      }
    }

    const token = api.getToken();
    if (token) {
      api.users
        .getMyPets()
        .then((data) => applyList(Array.isArray(data) ? data : []))
        .catch((err) => {
          if (err?.status === 401) api.clearToken();
          return api.pets.list().then((data) => (Array.isArray(data) ? data : [])).catch(() => []);
        })
        .then((list) => {
          if (list && list.length > 0) applyList(list);
        })
        .finally(() => setPetsLoaded(true));
    } else {
      api.pets
        .list()
        .then((data) => applyList(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setPetsLoaded(true));
    }
  }, [petsLoaded]);

  return (
    <PetContext.Provider value={{ pets, setPets, activePet, setActivePet }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePet must be used within a PetProvider");
  }
  return context;
};