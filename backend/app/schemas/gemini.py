"""Schemas for Gemini pet analysis response."""

from pydantic import BaseModel, Field


class SpeciesGuess(BaseModel):
    """A possible species with confidence percentage (0-100)."""

    species: str = Field(..., description="Species name (e.g. dog, cat, bird)")
    percentage: float = Field(..., ge=0, le=100, description="Confidence percentage")


class BreedGuess(BaseModel):
    """A possible breed with confidence percentage (0-100)."""

    breed: str = Field(..., description="Breed name")
    percentage: float = Field(..., ge=0, le=100, description="Confidence percentage")


class PetAnalysisResponse(BaseModel):
    """Structured response from Gemini pet image analysis."""

    species: list[SpeciesGuess] = Field(
        default_factory=list,
        description="Species predictions with percentages (e.g. dog 95%, wolf 5%)",
    )
    breeds: list[BreedGuess] = Field(
        default_factory=list,
        description="Breed predictions with percentages when applicable (e.g. Golden Retriever 80%)",
    )
