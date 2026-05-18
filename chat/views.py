from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class ChatRoomListCreateApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Список всех чатов текущего пользователя"""
        rooms = ChatRoom.objects.filter(participants=self.request.user).prefetch_related('participants', 'messages') # Он заранее подгружает связанные объекты
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Создать или получить чат с другим юзером по квартире"""
        other_user_id = request.data.get('other_user_id')
        apartment_id = request.data.get('apartment_id')

        if not other_user_id:
            return Response({"error": "other_user_id required"}, status=status.HTTP_400_BAD_REQUEST)

        room = ChatRoom.objects.filter(participants=request.user).filter(participants=other_user_id).filter(apartment_id=apartment_id).first()

        if not room:
            room = ChatRoom.objects.create(apartment_id=apartment_id)
            room.participants.add(request.user.id, other_user_id)

        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, room_id):
        """Удалить чат — только участник может удалить"""
        try:
            room = ChatRoom.objects.get(id=room_id, participants=request.user)
            room.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)


class MessageListApiView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs['room_id']

        # Помечаем сообщения как прочитанные
        Message.objects.filter(room_id=room_id, is_read=False).exclude(sender=self.request.user).update(is_read=True)
        return Message.objects.filter(room_id=room_id)
