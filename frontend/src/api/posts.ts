import { client } from './client'

export interface PostView {
  id: string
  type: 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'
  title: string
  slug: string
  body: string | null
  youtubeUrl: string | null
  authorName: string
  publishedAt: string
}

export interface PostsPage {
  content: PostView[]
  total: number
  page: number
  size: number
}

export interface PostRequest {
  type: string
  title: string
  slug?: string
  body?: string
  youtubeUrl?: string
}

// Spring Page response shape from the backend
interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function getPosts(params?: {
  type?: string
  page?: number
  size?: number
}): Promise<PostsPage> {
  const res = await client.get<SpringPage<PostView>>('/posts', { params })
  const data = res.data
  return {
    content: data.content,
    total: data.totalElements,
    page: data.number,
    size: data.size,
  }
}

export async function getPost(slug: string): Promise<PostView> {
  const res = await client.get<PostView>(`/posts/${slug}`)
  return res.data
}

export async function createPost(req: PostRequest): Promise<PostView> {
  const res = await client.post<PostView>('/posts', req)
  return res.data
}

export async function updatePost(id: string, req: PostRequest): Promise<PostView> {
  const res = await client.put<PostView>(`/posts/${id}`, req)
  return res.data
}

export async function deletePost(id: string): Promise<void> {
  await client.delete(`/posts/${id}`)
}
