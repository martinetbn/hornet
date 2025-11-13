// Common types used across the application

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ProtocolType = 'http' | 'websocket' | 'socketio' | 'grpc' | 'sse';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
  description?: string;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';

export interface AuthConfig {
  type: AuthType;
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    value: string;
    in: 'header' | 'query';
  };
  oauth2?: {
    accessToken: string;
    tokenType?: string;
  };
}

export type BodyType = 'none' | 'json' | 'xml' | 'html' | 'text' | 'form-data' | 'urlencoded';
