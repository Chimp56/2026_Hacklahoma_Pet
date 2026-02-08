import React, { createContext, useState, useContext } from 'react';

const PetContext = createContext();

export const PetProvider = ({ children }) => {
  // Merged your pets state to include the unique stats for each pet
  const [pets, setPets] = useState([
    { 
      id: 2, 
      name: "Buddy", 
      type: "Dog", 
      breed: "Golden Retriever", 
      image: "🐶",
      stats: { sleepHours: 8, activityData: [8, 7, 9, 11, 8, 10, 8] } 
    },
    { 
      id: 1, 
      name: "Luna", 
      type: "Cat", 
      breed: "Siamese", 
      image: "🐱",
      stats: { sleepHours: 14, activityData: [12, 15, 13, 14, 16, 14, 15] } 
    }
  ]);

  // We initialize activePet with the first pet in our array (Buddy)
  const [activePet, setActivePet] = useState(pets[0]);

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