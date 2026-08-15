from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    WorkspaceViewSet, UserViewSet, InviteViewSet, register_user, login_user,
    UserProfileViewSet, PublicDocumentExportView
)

router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'users', UserViewSet, basename='user')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'invites', InviteViewSet, basename='invite')
router.register(r'public-documents', PublicDocumentExportView, basename='public-document')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
