from rest_framework import serializers
from .models import User, Workspace, WorkspaceMembership, Document, DocumentComment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'avatar']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'owner', 'mode', 'is_public', 'created_at']

class UserProfileSerializer(serializers.ModelSerializer):
    public_workspaces = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'public_workspaces']

    def get_public_workspaces(self, obj):
        workspaces = Workspace.objects.filter(owner=obj, is_public=True)
        return WorkspaceSerializer(workspaces, many=True).data

from .models import WorkspaceInvite

class WorkspaceInviteSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    workspace = WorkspaceSerializer(read_only=True)

    class Meta:
        model = WorkspaceInvite
        fields = ['id', 'workspace', 'sender', 'receiver', 'status', 'created_at']

class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = WorkspaceMembership
        fields = ['id', 'user', 'role', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'workspace', 'title', 'content', 'version', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class DocumentCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = DocumentComment
        fields = ['id', 'document', 'user', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']
