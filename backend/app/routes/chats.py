from fastapi import APIRouter

router = APIRouter()

@router.get("")
def chats():
    return {"items": []}

@router.post("")
def create_chat():
    return {"message": "chat_created"}

@router.get("/{chat_id}/messages")
def messages(chat_id: str):
    return {"chat_id": chat_id, "items": []}

@router.post("/{chat_id}/messages")
def send_message(chat_id: str):
    return {"message": "sent", "chat_id": chat_id}
