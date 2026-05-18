from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from housing.serializers import ReviewSerializer
from housing.models import Review, Renting
from housing.permissions import IsOwnerOrReadOnly


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        apartment_id = self.kwargs.get('apartment_pk')
        return Review.objects.filter(apartment_id=apartment_id)

    def perform_create(self, serializer):
        apartment_id = self.kwargs.get('apartment_pk')
        user = self.request.user

        # проверка booking
        has_confirmed_booking = Renting.objects.filter(apartment_id=apartment_id, user=user, status='rented').exists()

        if not has_confirmed_booking:
            raise PermissionDenied("You can review only after confirmed booking")

        serializer.save(user=user, apartment_id=apartment_id)


class ReviewRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)