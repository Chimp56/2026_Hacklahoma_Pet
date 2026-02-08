"""Tests for stream API endpoints."""

from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_stream_url_no_streams(client: AsyncClient) -> None:
    """GET /api/v1/stream/url when stream resolution fails returns 404."""
    with patch("app.api.v1.endpoints.stream._resolve_stream_url") as mock_resolve:
        mock_resolve.side_effect = ValueError("No streams found for channel")
        resp = await client.get("/api/v1/stream/url", params={"channel": "offline_channel"})
        assert resp.status_code == 404
        assert "No streams" in resp.json()["detail"]
