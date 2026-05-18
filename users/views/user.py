import random

from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import generics, permissions, status
from django.contrib.auth import authenticate, login, logout
from rest_framework.response import Response
from rest_framework.views import APIView

from housing.permissions import IsOwner

from users.models import User
from users.serializers import UserSerializer



class UserAPICreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]



class MeAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)  # удаляет сессию
        return Response({"message": "Logged out successfully."})