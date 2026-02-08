"""Tests for QR code service."""

import pytest

from app.services.qr_code import generate_qr_png


def test_generate_qr_png_returns_bytes() -> None:
    """generate_qr_png returns PNG bytes."""
    png = generate_qr_png("https://example.com/pet/1")
    assert isinstance(png, bytes)
    assert len(png) > 100
    assert png[:8] == b"\x89PNG\r\n\x1a\n"


def test_generate_qr_png_with_logo() -> None:
    """generate_qr_png with logo_bytes embeds logo."""
    # Minimal valid PNG (1x1 pixel)
    logo = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
        b"\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    png = generate_qr_png("https://example.com", logo_bytes=logo)
    assert isinstance(png, bytes)
    assert len(png) > 100


def test_generate_qr_png_custom_size() -> None:
    """generate_qr_png with custom size."""
    png = generate_qr_png("https://example.com", size=300)
    assert isinstance(png, bytes)
    assert len(png) > 50
