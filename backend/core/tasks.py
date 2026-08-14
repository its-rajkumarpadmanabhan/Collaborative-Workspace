import time
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
# Optional: import WeasyPrint or markdown for actual PDF generation

@shared_task(bind=True)
def export_document_task(self, doc_id, format_type='pdf'):
    channel_layer = get_channel_layer()
    room_group_name = f'document_{doc_id}'

    # Notify start
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'task_status',
            'status': 'started',
            'task_id': self.request.id
        }
    )

    # Simulate processing time
    time.sleep(3)

    # In a real app, generate PDF/Markdown here and save to S3/media directory, getting a URL.
    result_url = f"/media/exports/{doc_id}.{format_type}"

    # Notify completion
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'task_status',
            'status': 'completed',
            'task_id': self.request.id,
            'result_url': result_url
        }
    )

    return result_url
