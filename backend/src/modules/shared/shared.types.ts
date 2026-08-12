export type CustomerStatus = "pending" | "approved" | "rejected" | "inactive";

export interface ChatThreadDto {
  id: string;
  ownerId: string;
  advisorId: string;
  subject: string;
  unread: number;
  lastMessageAt: Date;
  owner: { id: string; name: string; avatar: string | null };
  advisor: { id: string; name: string; avatar: string | null };
  messages: { id: string; sender: string; text: string; time: Date }[];
}
