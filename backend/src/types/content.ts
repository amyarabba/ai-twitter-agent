export type PostType = 'tweet' | 'thread';
export type PostStatus = 'draft' | 'scheduled' | 'posted';

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

export type PostContent = string | string[];

export interface EngagementLog {
  id: number;
  postId: number;
  impressions: number;
  likes: number;
  replies: number;
  retweets: number;
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
