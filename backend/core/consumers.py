import json
import urllib.parse
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Document, Workspace, WorkspaceMembership

User = get_user_model()

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['doc_id']
        self.room_group_name = f'workspace_{self.workspace_id}'
        self.user = await self.get_user_from_token()

        if self.user.is_anonymous:
            await self.close()
            return

        # Perform access control check based on workspace
        has_access = await self.check_workspace_access()
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Broadcast presence
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'action': 'join',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'avatar': getattr(self.user, 'avatar', None),
                'sender_channel_name': self.channel_name
            }
        )

        # Load document from database and send to client
        @database_sync_to_async
        def get_or_create_doc_content():
            workspace = Workspace.objects.get(id=self.workspace_id)
            doc, created = Document.objects.get_or_create(
                workspace=workspace,
                defaults={'title': 'Untitled', 'content': {'type': 'doc', 'content': []}}
            )
            return doc.content

        content = await get_or_create_doc_content()
        if content:
            await self.send(text_data=json.dumps({
                'type': 'initial_state',
                'update': content
            }))

    @database_sync_to_async
    def get_user_from_token(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = urllib.parse.parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        if not token:
            return AnonymousUser()
            
        try:
            access_token = AccessToken(token)
            user = User.objects.get(id=access_token['user_id'])
            return user
        except Exception:
            return AnonymousUser()
            
    @database_sync_to_async
    def check_workspace_access(self):
        try:
            workspace = Workspace.objects.get(id=self.workspace_id)
            
            if workspace.owner == self.user:
                return True
                
            if workspace.mode == 'individual':
                return False
                
            # If room, check membership
            is_member = WorkspaceMembership.objects.filter(workspace=workspace, user=self.user).exists()
            return is_member
            
        except Workspace.DoesNotExist:
            return False

    async def disconnect(self, close_code):
        if not getattr(self, 'user', AnonymousUser()).is_anonymous:
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # Broadcast presence
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'action': 'leave',
                    'user_id': str(self.user.id),
                    'sender_channel_name': self.channel_name
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        if event_type == 'document_update':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'document_update_event',
                    'update': data.get('update'),
                    'version': data.get('version'),
                    'sender_channel_name': self.channel_name
                }
            )
        elif event_type == 'cursor_update':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'cursor_update_event',
                    'user_id': str(self.user.id),
                    'position': data.get('position'),
                    'sender_channel_name': self.channel_name
                }
            )
        elif event_type == 'presence_sync':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'action': 'sync',
                    'user_id': str(self.user.id),
                    'username': self.user.username,
                    'avatar': getattr(self.user, 'avatar', None),
                    'sender_channel_name': self.channel_name
                }
            )
        elif event_type == 'save_state':
            @database_sync_to_async
            def save_doc(update_array):
                Document.objects.filter(workspace_id=self.workspace_id).update(content=update_array)
            await save_doc(data.get('update'))

    async def document_update_event(self, event):
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'type': 'document_update',
                'update': event['update'],
                'version': event['version']
            }))

    async def cursor_update_event(self, event):
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'type': 'cursor_update',
                'user_id': event['user_id'],
                'position': event['position']
            }))

    async def presence_update(self, event):
        if self.channel_name != event.get('sender_channel_name'):
            payload = {
                'type': 'presence_update',
                'action': event['action'],
                'user_id': event['user_id']
            }
            if event['action'] in ['join', 'sync']:
                payload['username'] = event['username']
                payload['avatar'] = event['avatar']
            await self.send(text_data=json.dumps(payload))

    async def task_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_status',
            'status': event['status'],
            'task_id': event['task_id'],
            'result_url': event.get('result_url')
        }))
