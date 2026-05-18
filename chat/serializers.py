from rest_framework import serializers
from .models import ChatRoom, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model  = Message
        fields = ["id", "room", "sender", "sender_username", "text", "created_at", "is_read"]
        read_only_fields = ["id", "sender", "created_at", "is_read"]


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    apartment_title = serializers.CharField(source="apartment.title", read_only=True)

    class Meta:
        model  = ChatRoom
        fields = ["id", "apartment", "apartment_title", "other_user", "last_message", "unread_count", "created_at"]

    def get_other_user(self, obj):
        request = self.context.get("request")
        other = obj.participants.exclude(id=request.user.id).first()
        if other:
            return {"id": other.id, "username": other.username}
        return None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {"text": msg.text, "created_at": msg.created_at, "sender": msg.sender.username}
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()