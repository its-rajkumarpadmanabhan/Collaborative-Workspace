from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Workspace, WorkspaceInvite, WorkspaceMembership, Document
from .serializers import (
    UserSerializer, RegisterSerializer, WorkspaceSerializer, 
    WorkspaceInviteSerializer, DocumentSerializer, UserProfileSerializer, UserUpdateSerializer
)
from django.shortcuts import get_object_or_404

User = get_user_model()

# Auth Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'put', 'delete'])
    def me(self, request):
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            request.user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

class UserProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def retrieve(self, request, pk=None):
        user = get_object_or_404(User, username=pk)
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

class PublicDocumentExportView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def retrieve(self, request, pk=None):
        workspace = get_object_or_404(Workspace, id=pk, is_public=True)
        doc = get_object_or_404(Document, workspace=workspace)
        return Response({
            "title": doc.title,
            "content": doc.content
        })

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # User can see workspaces they own or have accepted an invite to (via membership)
        owned = Workspace.objects.filter(owner=user)
        member_of = Workspace.objects.filter(memberships__user=user)
        return (owned | member_of).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        workspace = serializer.save(owner=self.request.user)
        if workspace.mode == 'room':
            WorkspaceMembership.objects.create(workspace=workspace, user=self.request.user, role='admin')

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        workspace = self.get_object()
        if workspace.owner != request.user:
            return Response({"error": "Only the owner can invite users"}, status=status.HTTP_403_FORBIDDEN)
        
        username = request.data.get('username')
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            receiver = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        invite, created = WorkspaceInvite.objects.get_or_create(
            workspace=workspace,
            receiver=receiver,
            defaults={'sender': request.user, 'status': 'pending'}
        )
        
        if not created:
            if invite.status == 'pending':
                return Response({"error": "Invite is already pending for this user"}, status=status.HTTP_400_BAD_REQUEST)
            elif invite.status == 'accepted':
                return Response({"error": "User is already a member of this room"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # User declined previously, so we resend the invite
                invite.status = 'pending'
                invite.sender = request.user
                invite.save()
                
        return Response(WorkspaceInviteSerializer(invite).data, status=status.HTTP_201_CREATED)

class InviteViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        invites = WorkspaceInvite.objects.filter(receiver=request.user, status='pending')
        return Response(WorkspaceInviteSerializer(invites, many=True).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invite = get_object_or_404(WorkspaceInvite, id=pk, receiver=request.user)
        if invite.status != 'pending':
            return Response({"error": "Invite is not pending"}, status=status.HTTP_400_BAD_REQUEST)
            
        invite.status = 'accepted'
        invite.save()
        WorkspaceMembership.objects.get_or_create(workspace=invite.workspace, user=request.user, defaults={'role': 'member'})
        
        return Response({"message": "Invite accepted, joined workspace"})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        invite = get_object_or_404(WorkspaceInvite, id=pk, receiver=request.user)
        invite.status = 'declined'
        invite.save()
        return Response({"message": "Invite declined"})
