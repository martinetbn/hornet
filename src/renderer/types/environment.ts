// Environment type definitions

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled?: boolean;
  description?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}
