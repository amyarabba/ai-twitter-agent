export type QueuePostType = 'tweet' | 'thread';
export type QueuePostStatus = 'draft' | 'scheduled' | 'posted';
export type ReplyDraftStatus = 'draft' | 'approved' | 'rejected' | 'posted';

export interface GrowthPoint {
  label: string;
  followers: number;
  impressions: number;
}

export interface ScheduleSlot {
  label: string;
  time: string;
  theme: string;
  status: 'optimal' | 'watch' | 'experimental';
}

export interface TrendTopic {
  id: string;
  title: string;
  category: string;
  momentum: 'Exploding' | 'Rising' | 'Watchlist';
  angle: string;
  suggestedPost: string;
}

export interface DashboardMetrics {
  accountHandle: string;
  followerCount: number;
  engagementRate: number;
  impressions: number;
  postsPerDay: number;
  followerDelta: number;
  avgLikes: number;
  responseWindow: string;
  growthSeries: GrowthPoint[];
  schedule: ScheduleSlot[];
  trendSignals: TrendTopic[];
}

export interface TrendResponse {
  generatedAt: string;
  items: TrendTopic[];
}

export interface GenerateContentPayload {
  topic: string;
}

export interface GenerateContentResponse {
  tweet: string;
  thread: string[];
  replies: string[];
}

export type AiTopicCategory =
  | 'AI breakthroughs'
  | 'New models'
  | 'AI startups'
  | 'Robotics'
  | 'Open source AI'
  | 'AI agents'
  | 'AI tools';

export interface AiTopicIdea {
  id: string;
  title: string;
  category: AiTopicCategory;
  insight: string;
  suggestedAngle: string;
}

export interface AiTopicsResponse {
  generatedAt: string;
  items: AiTopicIdea[];
}

export interface ViralHooksPayload {
  topic: string;
}

export interface ViralHooksResponse {
  topic: string;
  generatedAt: string;
  hooks: string[];
}

export type CompetitorRadarType =
  | 'Large AI account'
  | 'Viral discussion'
  | 'Popular thread';

export interface CompetitorRadarItem {
  id: string;
  label: string;
  handle: string | null;
  type: CompetitorRadarType;
  reason: string;
  angle: string;
  audience: string;
}

export interface CompetitorRadarResponse {
  generatedAt: string;
  items: CompetitorRadarItem[];
}

export interface GrowthTarget {
  tweetId: string;
  author: string;
  text: string;
  likes: number;
  reposts: number;
  replies: number;
  createdAt: string;
}

export interface GrowthTargetsResponse {
  generatedAt: string;
  items: GrowthTarget[];
}

export interface GrowthReplyPayload {
  tweetText: string;
  author: string;
}

export interface GrowthReplyResponse {
  replyText: string;
}

export interface ReplyDraft {
  id: number;
  tweetId: string;
  tweetText: string;
  replyText: string;
  createdAt: string;
  status: ReplyDraftStatus;
  replyPostId: string | null;
  postedAt: string | null;
}

export interface ReplyDraftsResponse {
  generatedAt: string;
  items: ReplyDraft[];
}

export type QueueContent = string | string[];

export interface QueueEngagementLog {
  id: number;
  postId: number;
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  engagementRate: number;
  timestamp: string;
}

export interface QueuePost {
  id: number;
  content: QueueContent;
  type: QueuePostType;
  status: QueuePostStatus;
  scheduledTime: string | null;
  createdAt: string;
  xPostId: string | null;
  engagement: QueueEngagementLog | null;
}

export interface PostsResponse {
  items: QueuePost[];
}

export interface SaveDraftPayload {
  content: QueueContent;
  type: QueuePostType;
}

export interface SchedulePostPayload {
  scheduledTime: string;
  postId?: number;
  content?: QueueContent;
  type?: QueuePostType;
}

export interface PostMutationResponse {
  post: QueuePost;
}

export interface ReplyDraftMutationResponse {
  draft: ReplyDraft;
}

export interface AnalyticsPost {
  id: number;
  content: QueueContent;
  type: QueuePostType;
  xPostId: string | null;
  createdAt: string;
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  engagementRate: number;
  totalEngagement: number;
}

export interface AnalyticsPostsResponse {
  generatedAt: string;
  items: AnalyticsPost[];
}

export interface TopPostsResponse {
  generatedAt: string;
  items: AnalyticsPost[];
}
