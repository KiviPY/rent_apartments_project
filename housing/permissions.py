from rest_framework.permissions import BasePermission, SAFE_METHODS, DjangoModelPermissions


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, 'user', None)
        return owner == request.user


class IsApartmentOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.apartment.user == request.user