import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { APP_NAME, APP_VERSION } from '@apdevflow/shared';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: APP_NAME,
      version: APP_VERSION,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }),
  };
}
