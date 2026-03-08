export type PostType = 'tweet' | 'thread';
export type PostStatus = 'draft' | 'scheduled' | 'posted';
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

export interface GenerateTopicInput {
  topic: string;
}

export interface GeneratePostResponse {
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

export interface ViralHooksInput {
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

export interface GrowthReplyInput {
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

export interface SaveReplyDraftInput {
  tweetId: string;
  tweetText: string;
  replyText: string;
}

export interface UpdateReplyDraftStatusInput {
  id: number;
  status: Exclude<ReplyDraftStatus, 'draft' | 'posted'>;
}

export type PostContent = string | string[];

export interface EngagementLog {
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
  content: PostContent;
  type: PostType;
  status: PostStatus;
  scheduledTime: string | null;
  createdAt: string;
  xPostId: string | null;
  engagement: EngagementLog | null;
}

export interface SaveDraftInput {
  content: PostContent;
  type: PostType;
}

export interface SchedulePostInput {
  postId?: number;
  content?: PostContent;
  type?: PostType;
  scheduledTime: string;
}

export interface PublishPostResult {
  rootTweetId: string;
  tweetIds: string[];
}

export interface PostingEvent {
  timestamp: string;
  tweetCount: number;
}

export interface AnalyticsPost {
  id: number;
  content: PostContent;
  type: PostType;
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

export interface ContentInsight {
  topic: string;
  avgEngagement: number;
  bestHookStyle: string;
  bestPostTime: string;
  lastUpdated: string;
}

export interface HookStyleInsight {
  style: string;
  avgEngagementRate: number;
  postCount: number;
}

export interface PostingTimeInsight {
  label: string;
  avgEngagementRate: number;
  avgImpressions: number;
  postCount: number;
}

export interface EngagementTrendPoint {
  label: string;
  date: string;
  avgEngagementRate: number;
  impressions: number;
  posts: number;
}

export interface AnalyticsInsightsResponse {
  generatedAt: string;
  bestPostingTime: string;
  bestPerformingTopics: ContentInsight[];
  bestPerformingHookStyles: HookStyleInsight[];
  bestPostingTimes: PostingTimeInsight[];
  averageEngagementRate: number;
  recommendedContentStrategy: string[];
  engagementTrends: EngagementTrendPoint[];
}
