import random
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login

from users.models import User

from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import UserSerializer

"""============JWT============="""
class LoginAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user:
            code = str(random.randint(100000, 999999))
            # Сохраняем user_id в кеше по временному ключу вместо сессии
            cache.set(f"2fa:{user.id}", code, 300)
            # Возвращаем user_id фронту чтобы передать в verify
            send_mail(
                subject="Your login code",
                message=f"Your code is {code}",
                from_email="noreply@site.com",
                recipient_list=[email]
            )
            return Response({"message": "Code sent successfully!", "user_id": user.id})
        return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)



class Verify2FAAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        code = request.data.get("code")

        if not user_id or not code:
            return Response({"error": "missing data"}, status=status.HTTP_400_BAD_REQUEST)

        stored_code = cache.get(f"2fa:{user_id}")

        if stored_code is None:
            return Response({"error": "code expired"}, status=status.HTTP_400_BAD_REQUEST)
        if stored_code != code:
            return Response({"error": "invalid code"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "user does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Чистим кеш
        cache.delete(f"2fa:{user_id}")

        # Генерируем JWT токены
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        })


"""==============Session============"""""
# class LoginAPI(APIView):
#     permission_classes = [permissions.AllowAny]
#
#     def post(self, request):
#         email = request.data.get('email')
#         password = request.data.get('password')
#
#         if not email or not password:
#             return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
#
#         user = authenticate(request, username=email, password=password)
#         if user:
#             code = str(random.randint(100000, 999999))
#             cache.set(f"2fa:{user.id}", code, 300)
#             request.session["2fa_user_id"] = user.id #!!!
#
#             send_mail(
#                 subject="Your login code",
#                 message=f"Your code is {code}",
#                 from_email="noreply@site.com",
#                 recipient_list=[email]
#             )
#             return Response({"message": "Code sent successfully!"})
#         return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
#
#
#
# class Verify2FAAPIView(APIView):
#
#     def post(self, request):
#         user_id = request.session.get("2fa_user_id")
#         code = request.data.get("code")
#
#         if not user_id or not code:
#             return Response({"error": "missing data"}, status=status.HTTP_400_BAD_REQUEST)
#
#         stored_code = cache.get(f"2fa:{user_id}")
#
#         if stored_code is None:
#             return Response({"error": "code expired"}, status=status.HTTP_400_BAD_REQUEST)
#         if stored_code != code:
#             return Response({"error": "invalid code"}, status=status.HTTP_400_BAD_REQUEST)
#         try:
#             user = User.objects.get(id=user_id)
#         except User.DoesNotExist:
#             return Response({"error": "user does not exist"}, status=status.HTTP_404_NOT_FOUND)
#
#         login(request, user)
#         del request.session["2fa_user_id"]
#
#         return Response({"message": "logged in"})