"""Live WebSocket connection management for the API gateway."""

from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
connected_clients: set[WebSocket] = set()


@router.websocket("/ws/live")
async def live_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)


async def broadcast(event_name: str, payload: dict) -> None:
    event = {
        "event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }
    disconnected_clients: list[WebSocket] = []
    for client in tuple(connected_clients):
        try:
            await client.send_json(event)
        except Exception:
            disconnected_clients.append(client)
    for client in disconnected_clients:
        connected_clients.discard(client)
