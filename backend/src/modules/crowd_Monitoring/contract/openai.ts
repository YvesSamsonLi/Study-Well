import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  CrowdMonitoringResponseSchema,
  LocationCrowdDataSchema,
  LocationParamsSchema,
  SubscribeBodySchema,
  LibraryParamsSchema,
  LibrariesCrowdResponseSchema,
  LibraryCrowdSchema,
} from '../schema';

export function registerCrowdMonitoringPaths(registry: OpenAPIRegistry) {
  // -------------------- Carpark endpoints --------------------
  registry.registerPath({
    method: 'get',
    path: '/v1/crowd',
    description: 'Get current crowd levels for all carparks',
    tags: ['Crowd Monitoring'],
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: CrowdMonitoringResponseSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/crowd/{locationId}',
    description: 'Get crowd level for a specific carpark',
    tags: ['Crowd Monitoring'],
    request: { params: LocationParamsSchema },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: LocationCrowdDataSchema } },
      },
      404: { description: 'Carpark not found' },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/v1/crowd/subscribe',
    description: 'Subscribe to notifications when a carpark reaches a target crowd level',
    tags: ['Crowd Monitoring'],
    request: { body: { content: { 'application/json': { schema: SubscribeBodySchema } } } },
    responses: { 204: { description: 'Subscription saved' } },
  });

  // -------------------- Library endpoints --------------------
  registry.registerPath({
    method: 'get',
    path: '/v1/crowd/libraries',
    description: 'Get current crowd levels aggregated per library (least→most crowded)',
    tags: ['Crowd Monitoring - Libraries'],
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: LibrariesCrowdResponseSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/crowd/libraries/{libraryId}',
    description: 'Get crowd level for a specific library',
    tags: ['Crowd Monitoring - Libraries'],
    request: { params: LibraryParamsSchema },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: LibraryCrowdSchema } },
      },
      404: { description: 'Library not found' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/v1/crowd/libraries/summary',
    description: 'Get human-readable summary text for all libraries',
    tags: ['Crowd Monitoring - Libraries'],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              text: z.string(),
              libraries: LibrariesCrowdResponseSchema.shape.libraries,
              timestamp: z.string(),
            }),
          },
        },
      },
    },
  });

  //  library-level subscription
  registry.registerPath({
    method: 'post',
    path: '/v1/crowd/libraries/subscribe',
    description: 'Subscribe to notifications when a library reaches a target crowd level',
    tags: ['Crowd Monitoring - Libraries'],
    request: { body: { content: { 'application/json': { schema: SubscribeBodySchema } } } },
    responses: { 204: { description: 'Library subscription saved' } },
  });
}
