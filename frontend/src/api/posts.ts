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

export async function getPosts(params?: {
  type?: string
  page?: number
  size?: number
}): Promise<PostsPage> {
  const res = await client.get<PostsPage>('/posts', { params })
  return res.data
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
