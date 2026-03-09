export interface DiscussionThread {
  id: string;
  courseId: string;
  authorUserId: string;
  authorDisplayName: string;
  title: string;
  content: string;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  threadId: string;
  authorUserId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}
