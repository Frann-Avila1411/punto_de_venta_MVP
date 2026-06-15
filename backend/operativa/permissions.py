from rest_framework.permissions import BasePermission


class HasAnyRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or getattr(user, 'rol', None) == 'Administrador':
            return True

        return getattr(user, 'rol', None) in self.allowed_roles


class IsAdministrator(HasAnyRole):
    allowed_roles = ('Administrador',)


class IsReceptionOrAdmin(HasAnyRole):
    allowed_roles = ('Recepcion',)


class IsWorkshopOrAdmin(HasAnyRole):
    allowed_roles = ('Taller',)