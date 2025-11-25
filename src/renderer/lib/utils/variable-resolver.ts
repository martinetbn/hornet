// Variable resolution utilities

import type { Variable, HttpRequest, WebSocketConfig, SocketIOConfig, SSEConfig, GrpcRequest, KeyValuePair } from '@/types';

/**
 * Resolves [[variableName]] syntax in a string using provided variables
 */
export function resolveVariables(text: string, variables: Variable[]): string {
  if (!text || !variables || variables.length === 0) return text;

  // Handle active workspace filtering if not already done by the caller
  // Note: Usually the caller should pass already filtered variables
  
  return text.replace(/\[\[(\w+)\]\]/g, (match, key) => {
    const variable = variables.find((v) => v.key === key && v.enabled !== false);
    return variable ? variable.value : match;
  });
}

/**
 * Resolves variables in key-value pairs (headers, params)
 */
export function resolveKeyValuePairs(
  pairs: KeyValuePair[] | undefined,
  variables: Variable[]
): KeyValuePair[] {
  if (!pairs || pairs.length === 0) return pairs || [];

  return pairs.map((pair) => ({
    ...pair,
    key: resolveVariables(pair.key, variables),
    value: resolveVariables(pair.value, variables),
  }));
}

/**
 * Resolves variables in an HTTP request
 */
export function resolveHttpRequestVariables(
  request: HttpRequest,
  variables: Variable[]
): HttpRequest {
  if (!variables || variables.length === 0) return request;

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    headers: resolveKeyValuePairs(request.headers, variables),
    params: resolveKeyValuePairs(request.params, variables),
    auth: request.auth
      ? {
          ...request.auth,
          // Basic auth
          username: request.auth.username ? resolveVariables(request.auth.username, variables) : undefined,
          password: request.auth.password ? resolveVariables(request.auth.password, variables) : undefined,
          // Bearer token
          token: request.auth.token ? resolveVariables(request.auth.token, variables) : undefined,
        }
      : undefined,
    body: request.body
      ? {
          ...request.body,
          content: resolveVariables(request.body.content || '', variables),
        }
      : undefined,
  };
}

/**
 * Resolves variables in a WebSocket request
 */
export function resolveWebSocketVariables(
  request: WebSocketConfig,
  variables: Variable[]
): WebSocketConfig {
  if (!variables || variables.length === 0) return request;

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    headers: resolveKeyValuePairs(request.headers, variables),
    params: resolveKeyValuePairs(request.params, variables),
    protocols: request.protocols ? request.protocols.map(p => resolveVariables(p, variables)) : undefined,
    draftMessage: request.draftMessage
      ? {
          ...request.draftMessage,
          content: resolveVariables(request.draftMessage.content, variables),
        }
      : undefined,
  };
}

/**
 * Resolves variables in a Socket.IO request
 */
export function resolveSocketIOVariables(
  request: SocketIOConfig,
  variables: Variable[]
): SocketIOConfig {
  if (!variables || variables.length === 0) return request;

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    path: request.path ? resolveVariables(request.path, variables) : undefined,
    headers: resolveKeyValuePairs(request.headers, variables),
    params: resolveKeyValuePairs(request.params, variables),
    query: resolveKeyValuePairs(request.query, variables),
    draftMessage: request.draftMessage
      ? {
          ...request.draftMessage,
          event: resolveVariables(request.draftMessage.event, variables),
          data: resolveVariables(request.draftMessage.data, variables),
        }
      : undefined,
  };
}

/**
 * Resolves variables in an SSE request
 */
export function resolveSSEVariables(
  request: SSEConfig,
  variables: Variable[]
): SSEConfig {
  if (!variables || variables.length === 0) return request;

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    headers: resolveKeyValuePairs(request.headers, variables),
  };
}

/**
 * Resolves variables in a gRPC request
 */
export function resolveGrpcVariables(
  request: GrpcRequest,
  variables: Variable[]
): GrpcRequest {
  if (!variables || variables.length === 0) return request;

  // Note: protoFile path might contain variables?
  // Method name usually shouldn't, but data might
  
  // Recursively resolve variables in data object
  const resolveData = (data: any): any => {
    if (typeof data === 'string') {
      return resolveVariables(data, variables);
    }
    if (Array.isArray(data)) {
      return data.map(resolveData);
    }
    if (typeof data === 'object' && data !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(data)) {
        resolved[key] = resolveData(value);
      }
      return resolved;
    }
    return data;
  };

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    protoFile: resolveVariables(request.protoFile, variables),
    metadata: request.metadata
      ? Object.entries(request.metadata).reduce((acc, [key, value]) => {
          acc[key] = resolveVariables(value, variables);
          return acc;
        }, {} as Record<string, string>)
      : undefined,
    data: resolveData(request.data),
  };
}
