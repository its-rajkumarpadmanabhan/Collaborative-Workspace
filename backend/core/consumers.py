import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope['url_route']['kwargs']['doc_id']
        self.room_group_name = f'document_{self.doc_id}'
        self.user = self.scope.get('user', AnonymousUser())

        if self.user.is_anonymous:
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

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
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
                    'content': data.get('content'),
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

    async def document_update_event(self, event):
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'type': 'document_update',
                'content': event['content'],
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
            if event['action'] == 'join':
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
