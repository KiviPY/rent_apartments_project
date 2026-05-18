import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group = f"chat_{self.room_id}"
        self.user = self.scope["user"]

        # Проверяем что юзер участник комнаты
        if not await self.is_participant():
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = data.get("text", "").strip()
        if not text:
            return

        message = await self.save_message(text)

        await self.channel_layer.group_send(self.room_group, {
            "type": "chat_message",
            "id": message.id,
            "text": message.text,
            "sender": self.user.id,
            "sender_username": self.user.username,
            "created_at": message.created_at.isoformat(),
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def is_participant(self):
        return ChatRoom.objects.filter(id=self.room_id, participants=self.user).exists()

    @database_sync_to_async
    def save_message(self, text):
        return Message.objects.create(
            room_id=self.room_id,
            sender=self.user,
            text=text
        )