# Webhook Module

This module handles incoming webhooks from Linear to synchronize project and issue data.

## Environment Variables

### Required

- `WEBHOOK_SECRET`: Secret key for validating webhook signatures from Linear
- `DATABASE_URL`: PostgreSQL connection string for Prisma

### Optional

- `UNASSIGNED_PROJECT_ID`: Custom ID for the fallback "Unassigned" project (default: "unassigned-project-default")
- `LOG_LEVEL`: Logging level (default: "info")

## Security

The webhook endpoint is protected by:

1. **Signature validation**: HMAC-SHA256 verification using `WEBHOOK_SECRET`
2. **Type checking**: Runtime validation of webhook payload structure
3. **Fail-fast**: Immediate rejection of invalid requests

## Webhook Types Supported

### Project Webhooks

- `create`: Creates new projects
- `update`: Updates existing projects
- `remove`: Deletes projects

### Issue Webhooks

- `create`: Creates new issues with automatic project assignment
- `update`: Updates existing issues or creates if missing
- `remove`: Deletes issues

## Architecture

```
WebhookController
  ↓ (validates signature)
WebhookService
  ↓ (routes by type)
WebhookProjectService | WebhookIssueService
  ↓ (processes data)
Database + Real-time Updates
```

## Error Handling

- Comprehensive logging at all levels
- Graceful fallbacks for missing data
- Transaction safety for data consistency
- Real-time WebSocket notifications
