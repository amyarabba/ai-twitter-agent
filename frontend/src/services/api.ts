import type {
  AiTopicsResponse,
  AnalyticsPostsResponse,
  CompetitorRadarResponse,
  DashboardMetrics,
  GenerateContentPayload,
  GenerateContentResponse,
  GrowthReplyPayload,
  GrowthReplyResponse,
  GrowthTargetsResponse,
  PostMutationResponse,
  PostsResponse,
  ReplyDraftMutationResponse,
  ReplyDraftsResponse,
  ReplyDraftStatus,
  SaveDraftPayload,
  SchedulePostPayload,
  TopPostsResponse,
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
  getGrowthTargets(): Promise<GrowthTargetsResponse> {
    return request<{
      generated_at: string;
      items: Array<{
        tweet_id: string;
        author: string;
        text: string;
        likes: number;
        reposts: number;
        replies: number;
        created_at: string;
      }>;
    }>('/growth/targets').then((response) => ({
      generatedAt: response.generated_at,
      items: response.items.map((item) => ({
        tweetId: item.tweet_id,
        author: item.author,
        text: item.text,
        likes: item.likes,
        reposts: item.reposts,
        replies: item.replies,
        createdAt: item.created_at,
      })),
    }));
  },
  generateGrowthReply(
    payload: GrowthReplyPayload,
  ): Promise<GrowthReplyResponse> {
    return request<{ reply_text: string }>('/growth/reply', {
      method: 'POST',
      body: JSON.stringify({
        tweet_text: payload.tweetText,
        author: payload.author,
      }),
    }).then((response) => ({
      replyText: response.reply_text,
    }));
  },
  getReplyDrafts(): Promise<ReplyDraftsResponse> {
    return request<{
      generated_at: string;
      items: Array<{
        id: number;
        tweet_id: string;
        tweet_text: string;
        reply_text: string;
        created_at: string;
        status: ReplyDraftStatus;
      }>;
    }>('/growth/replies').then((response) => ({
      generatedAt: response.generated_at,
      items: response.items.map((item) => ({
        id: item.id,
        tweetId: item.tweet_id,
        tweetText: item.tweet_text,
        replyText: item.reply_text,
        createdAt: item.created_at,
        status: item.status,
      })),
    }));
  },
  updateReplyDraftStatus(
    id: number,
    status: Exclude<ReplyDraftStatus, 'draft'>,
  ): Promise<ReplyDraftMutationResponse> {
    return request<{
      draft: {
        id: number;
        tweet_id: string;
        tweet_text: string;
        reply_text: string;
        created_at: string;
        status: ReplyDraftStatus;
      };
    }>(`/growth/replies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then((response) => ({
      draft: {
        id: response.draft.id,
        tweetId: response.draft.tweet_id,
        tweetText: response.draft.tweet_text,
        replyText: response.draft.reply_text,
        createdAt: response.draft.created_at,
        status: response.draft.status,
      },
    }));
  },
  runReplyHunter(): Promise<{ created: number }> {
    return request<{ created: number }>('/growth/run', {
      method: 'POST',
    });
  },
  getPostAnalytics(): Promise<AnalyticsPostsResponse> {
    return request<AnalyticsPostsResponse>('/analytics/posts');
  },
  getTopPosts(): Promise<TopPostsResponse> {
    return request<TopPostsResponse>('/analytics/top');
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
