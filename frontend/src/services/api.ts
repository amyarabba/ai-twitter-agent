import type {
  AiTopicsResponse,
  CompetitorRadarResponse,
  DashboardMetrics,
  GenerateContentPayload,
  GenerateContentResponse,
  PostMutationResponse,
  PostsResponse,
  SaveDraftPayload,
  SchedulePostPayload,
  TrendResponse,
  ViralHooksPayload,
  ViralHooksResponse,
} from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getDashboard(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>('/dashboard');
  },
  getTrends(): Promise<TrendResponse> {
    return request<TrendResponse>('/trends');
  },
  getAiTopics(): Promise<AiTopicsResponse> {
    return request<AiTopicsResponse>('/ai/topics');
  },
  getAiCompetitors(): Promise<CompetitorRadarResponse> {
    return request<CompetitorRadarResponse>('/ai/competitors');
  },
  generateHooks(payload: ViralHooksPayload): Promise<ViralHooksResponse> {
    return request<ViralHooksResponse>('/ai/hooks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  generateContent(
    payload: GenerateContentPayload,
  ): Promise<GenerateContentResponse> {
    return request<GenerateContentResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getPosts(): Promise<PostsResponse> {
    return request<PostsResponse>('/posts');
  },
  saveDraft(payload: SaveDraftPayload): Promise<PostMutationResponse> {
    return request<PostMutationResponse>('/posts/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  schedulePost(payload: SchedulePostPayload): Promise<PostMutationResponse> {
    return request<PostMutationResponse>('/posts/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deletePost(id: number): Promise<void> {
    return request<void>(`/posts/${id}`, {
      method: 'DELETE',
    });
  },
};
