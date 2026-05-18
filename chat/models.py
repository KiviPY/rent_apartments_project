from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """Комната между двумя пользователями по конкретной квартире"""
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chat_rooms")
    apartment = models.ForeignKey("housing.RegisterApartments", on_delete=models.CASCADE, related_name="chat_rooms", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Room {self.id}"




class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender} -> Room {self.room_id}: {self.text[:30]}"