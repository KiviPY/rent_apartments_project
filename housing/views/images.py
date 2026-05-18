from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from housing.models import RegisterApartments, ApartmentImage
from housing.serializers import ApartmentImageSerializer


class ApartmentImageUploadAPI(generics.CreateAPIView):
    serializer_class = ApartmentImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Получаем квартиру по id из URL
        apartment = RegisterApartments.objects.get(pk=self.kwargs['pk'])

        # Проверяем что текущий юзер — владелец
        if apartment.user != self.request.user:
            raise PermissionDenied("Вы не владелец этой квартиры")

        # Сохраняем фото, автоматически привязывая к квартире
        serializer.save(apartment=apartment)


class ApartmentImageDeleteAPI(generics.DestroyAPIView):
    queryset = ApartmentImage.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        image = super().get_object()
        if image.apartment.user != self.request.user:
            raise PermissionDenied("Вы не владелец этой квартиры")
        return image