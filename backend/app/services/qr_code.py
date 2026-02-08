"""QR code generation with optional center logo (pet photo or paw)."""

import io
from typing import Optional

import qrcode
from PIL import Image


# Simple paw icon as 32x32 RGBA: dark circle with lighter "toes" (placeholder when no pet photo)
def _default_paw_image(size: int = 120) -> Image.Image:
    """Generate a simple paw-shaped icon (circle with smaller circles for toes)."""
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    # Draw with PIL (no extra deps): one main circle (pad) + three small circles (toes)
    try:
        from PIL import ImageDraw
    except ImportError:
        return Image.new("RGB", (size, size), (200, 200, 200))
    draw = ImageDraw.Draw(img)
    r = size // 2
    fill = (80, 80, 80, 255)
    # Main pad
    draw.ellipse([r - r // 2, r - r // 3, r + r // 2, r + r // 2 + r // 3], fill=fill)
    # Toes (three small circles above the pad)
    toe_r = r // 4
    for dx in (-r // 3, 0, r // 3):
        draw.ellipse([r + dx - toe_r, r // 3 - toe_r, r + dx + toe_r, r // 3 + toe_r], fill=fill)
    return img.convert("RGB")


def generate_qr_png(
    url: str,
    logo_bytes: Optional[bytes] = None,
    size: int = 500,
    logo_fraction: float = 0.25,
) -> bytes:
    """
    Generate a QR code PNG that links to url, with an optional center logo.
    If logo_bytes is None, use a default paw icon.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High so we can overlay logo
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_img = qr_img.resize((size, size), Image.Resampling.LANCZOS)

    if logo_bytes is not None:
        try:
            logo = Image.open(io.BytesIO(logo_bytes)).convert("RGB")
        except Exception:
            logo = _default_paw_image(int(size * logo_fraction))
    else:
        logo = _default_paw_image(int(size * logo_fraction))

    logo_size = int(size * logo_fraction)
    logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    pos = ((size - logo_size) // 2, (size - logo_size) // 2)
    qr_img.paste(logo, pos)

    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    return buf.getvalue()
