from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions
from rest_framework.filters import SearchFilter
from rest_framework.generics import get_object_or_404

from housing.filters import BookingFilter
from housing.permissions import IsOwner, IsApartmentOwner

from housing.models import RegisterApartments, Renting
from housing.serializers.renting import RentingStatusSerializer, RentingApartmentsSerializer, send_booking_email


# Create your views here.





class BookingAPICreate(generics.CreateAPIView):
    queryset = Renting.objects.all()
    serializer_class = RentingApartmentsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Берёт apartment_pk из URL (/apartments/1/book/ -> apartment_pk = 1)
                   Находит объект RegisterApartments с этим id
                   Сохраняет booking, привязывая его к апартаменту
                   user берётся автоматически через Hidden поле в сериализаторе"""
        apartment_id = self.kwargs.get('apartment_pk')
        apartment = get_object_or_404(RegisterApartments, id=apartment_id)

        booking = serializer.save(apartment=apartment)

        # выполнится только если транзакция прошла успешно
        transaction.on_commit(lambda: send_booking_email(booking))

class BookingAPIRetrieveDestroy(generics. RetrieveDestroyAPIView):
    serializer_class = RentingApartmentsSerializer
    permission_classes = [IsOwner]
    def get_queryset(self):
        """фильтрует все объекты Booking, оставляя только те, которые принадлежат текущему пользователю"""
        return Renting.objects.filter(user=self.request.user)



class BookingAPIList(generics.ListAPIView):
    serializer_class = RentingApartmentsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter,]
    filterset_class = BookingFilter
    search_fields = ['status']

    def get_queryset(self):
        return Renting.objects.filter(user=self.request.user)



class BookingAPIViewApartmentOwnerList(generics.ListAPIView):
    serializer_class = RentingStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookingFilter

    def get_queryset(self):
        # возвращаем все бронирования для квартир текущего пользователя
        return Renting.objects.filter(apartment__user=self.request.user)


class RetrieveUpdateBookingStatusAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = RentingStatusSerializer  # сериализатор только для поля status
    permission_classes = [IsApartmentOwner]  # владелец квартиры может менять статус

    def get_queryset(self):
        # возвращаем все бронирования для квартир текущего пользователя
        return Renting.objects.filter(apartment__user=self.request.user)

