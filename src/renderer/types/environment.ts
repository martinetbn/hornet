// Environment type definitions

export interface Variable {
  id: string;
  key: string;
  value: string;
  workspaceId?: string;
  enabled?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  createdAt: number;
  updatedAt: number;
}
