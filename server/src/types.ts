export interface Channel {
  name: string;
  url: string;
  logo: string;
  group: string;
}

export interface ChannelsResponse {
  channels: Channel[];
  groups: string[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
