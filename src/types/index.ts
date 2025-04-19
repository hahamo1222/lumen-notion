export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string;
  bullet_points: {
    text: string;
    source_url: string;
  }[];
  tags: string[];
  voting_options: {
    id: string;
    text: string;
    votes: number;
  }[];
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}