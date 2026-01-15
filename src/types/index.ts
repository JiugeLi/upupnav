export interface Group {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  created_at?: string;
}

export interface Website {
  id: number;
  group_id: number;
  name: string;
  url: string;
  logo_url?: string;
  logo_type?: string;
  description?: string;
  username?: string;
  password?: string;
  sort_order: number;
  click_count?: number;
  last_clicked_at?: string;
  created_at?: string;
}
