export interface WebStackProBusiness {
  id: string;
  name: string;
  plan: string;
  planActive: boolean;
  trialEnds?: string | null;
}

export interface WebStackProContact {
  id: string;
  businessId: string;
  name: string;
  channel: string;
  externalId?: string | null;
  phone?: string | null;
  email?: string | null;
  tags?: WebStackProTag[];
}

export interface WebStackProMessage {
  id: string;
  conversationId: string;
  role: "user" | "ai" | "human";
  text: string;
  channel: string;
  createdAt: string;
}

export interface WebStackProNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface WebStackProConversation {
  id: string;
  businessId: string;
  contactId?: string;
  channel: string;
  status: "ai" | "human" | "resolved";
  assignedTo?: string | null;
  unread: boolean;
  lastMessageAt: string;
  contact?: WebStackProContact;
  messages?: WebStackProMessage[];
  notes?: WebStackProNote[];
  preview?: string;
}

export interface WebStackProTag {
  id: string;
  name: string;
  color: string;
}

export interface WebStackProAgent {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  active: boolean;
}

export interface ChannelRecord {
  id: string;
  type: string;
  label: string;
  connected: boolean;
  config?: Record<string, unknown>;
  configMasked?: Record<string, string>;
  webhookUrl?: string | null;
}

export interface BusinessHours {
  enabled: boolean;
  days: string[];
  open: string;
  close: string;
  timezone: string;
  awayMessage: string;
}

export interface WidgetConfig {
  name: string;
  greeting: string;
  primaryColor: string;
  accentColor: string;
  showPoweredBy: boolean;
  collectLead: boolean;
  businessHours: BusinessHours;
}

export interface CannedReply {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export type InboxFilter =
  | "all"
  | "open"
  | "resolved"
  | "unread"
  | "ai"
  | "human"
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "web";