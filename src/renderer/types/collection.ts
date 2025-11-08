// Collection type definitions

import { Request } from './request';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  folders: CollectionFolder[];
  requests: Request[];
}

export interface CollectionFolder {
  id: string;
  name: string;
  type: 'folder';
  children: CollectionItem[];
}

export type CollectionItem = CollectionFolder | Request;

export interface Tab<T = Request> {
  id: string;
  name: string;
  path: string[];
  request: T;
  isDirty?: boolean;
}
