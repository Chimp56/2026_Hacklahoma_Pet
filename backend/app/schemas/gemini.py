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


class GenerateTextRequest(BaseModel):
    """Request for Llama text generation (Hugging Face)."""

    prompt: str = Field(..., min_length=1, description="Text prompt")
    max_new_tokens: int = Field(512, ge=1, le=2048, description="Max tokens to generate")


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


class ActivityAnalysisResponse(BaseModel):
    """Response from monitor/camera image analysis (inferred activity)."""

    sleep_minutes: int = Field(0, ge=0, description="Estimated sleep/rest minutes")
    meals_count: int = Field(0, ge=0, description="Estimated number of meals")
    activity: str = Field(
        default="Unknown",
        description="Activity level: Low, Normal, High, or Unknown",
    )


class PetVideoAnalysisResponse(BaseModel):
    """Structured response from Gemini pet video analysis (activity summary, sleep, active time, eating)."""

    activity_summary: str = Field(
        default="",
        description="Summary of what the pet did in the video (activities, behaviors)",
    )
    hours_slept_per_day: float = Field(
        default=0.0,
        ge=0.0,
        le=24.0,
        description="Estimated hours of sleep per day (0–24)",
    )
    hours_active: float = Field(
        default=0.0,
        ge=0.0,
        le=24.0,
        description="Estimated hours active per day (0–24)",
    )
    eating_habits: str = Field(
        default="",
        description="Observed or inferred eating habits (e.g. meal times, appetite, grazing)",
    )


class AudioAnalysisResponse(BaseModel):
    """Normalized response from pet audio analysis (e.g. barking, meowing)."""

    mood: str = Field(
        default="",
        description="Inferred mood or state (e.g. excited, anxious, playful, distressed)",
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence in the analysis (0.0–1.0)",
    )
    species: list[SpeciesGuess] = Field(
        default_factory=list,
        description="Species guesses from the sound",
    )
    breeds: list[BreedGuess] = Field(
        default_factory=list,
        description="Breed guesses when applicable",
    )
    description: str | None = Field(
        default=None,
        description="Short free-form description of the sound",
    )
