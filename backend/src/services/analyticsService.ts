import { getAllPosts, resolvePostEngagement } from './postRepository.js';
import type {
  AnalyticsPost,
  AnalyticsPostsResponse,
  QueuePost,
  TopPostsResponse,
} from '../types/content.js';

function toAnalyticsPost(post: QueuePost): AnalyticsPost {
  const engagement = resolvePostEngagement(post);
  const impressions = engagement?.impressions ?? 0;
  const likes = engagement?.likes ?? 0;
  const replies = engagement?.replies ?? 0;
  const reposts = engagement?.reposts ?? 0;
  const totalEngagement = likes + replies + reposts;

  return {
    id: post.id,
    content: post.content,
    type: post.type,
    xPostId: post.xPostId,
    createdAt: post.createdAt,
    impressions,
    likes,
    replies,
    reposts,
    engagementRate: engagement?.engagementRate ?? 0,
    totalEngagement,
  };
}

export function getPostAnalytics(): AnalyticsPostsResponse {
  const items = getAllPosts()
    .filter((post) => post.status === 'posted')
    .map(toAnalyticsPost)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

  return {
    generatedAt: new Date().toISOString(),
    items,
  };
}

export function getTopPerformingPosts(limit = 10): TopPostsResponse {
  const items = getPostAnalytics()
    .items.slice()
    .sort((left, right) => {
      if (right.engagementRate !== left.engagementRate) {
        return right.engagementRate - left.engagementRate;
      }

      if (right.totalEngagement !== left.totalEngagement) {
        return right.totalEngagement - left.totalEngagement;
      }

      return right.impressions - left.impressions;
    })
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    items,
  };
}
