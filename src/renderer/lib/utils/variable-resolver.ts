// Variable resolution utilities

import type { Variable, HttpRequest, KeyValuePair } from '@/types';

/**
 * Resolves [[variableName]] syntax in a string using provided variables
 */
export function resolveVariables(text: string, variables: Variable[]): string {
  if (!text || !variables || variables.length === 0) return text;

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
export function resolveRequestVariables(
  request: HttpRequest,
  variables: Variable[]
): HttpRequest {
  if (!variables || variables.length === 0) return request;

  return {
    ...request,
    url: resolveVariables(request.url, variables),
    headers: resolveKeyValuePairs(request.headers, variables),
    params: resolveKeyValuePairs(request.params, variables),
    body: request.body
      ? {
          ...request.body,
          content: resolveVariables(request.body.content || '', variables),
        }
      : undefined,
  };
}
