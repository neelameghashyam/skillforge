export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          theme: "light" | "dark" | "system";
          daily_digest_time: string;
          notification_prefs: { push: boolean; email: boolean; in_app: boolean };
          xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      skills: {
        Row: {
          id: string; user_id: string; name: string; category: string; description: string | null;
          level: "beginner" | "novice" | "intermediate" | "advanced" | "expert" | "master";
          progress: number; target_hours: number; logged_hours: number; color: string; icon: string;
          archived: boolean; curriculum_id: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skills"]["Row"]> & { user_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
      };
      skill_topic_progress: {
        Row: {
          id: string; skill_id: string; user_id: string; curriculum_topic_id: string;
          is_complete: boolean; completed_at: string | null; created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_topic_progress"]["Row"]> & { skill_id: string; user_id: string; curriculum_topic_id: string };
        Update: Partial<Database["public"]["Tables"]["skill_topic_progress"]["Row"]>;
      };
      skill_curriculums: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          generated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_curriculums"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["skill_curriculums"]["Row"]>;
      };
      skill_curriculum_categories: {
        Row: {
          id: string;
          curriculum_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_curriculum_categories"]["Row"]> & { curriculum_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["skill_curriculum_categories"]["Row"]>;
      };
      skill_curriculum_topics: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          difficulty: "beginner" | "intermediate" | "advanced";
          description: string | null;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_curriculum_topics"]["Row"]> & { category_id: string; name: string; difficulty: "beginner" | "intermediate" | "advanced" };
        Update: Partial<Database["public"]["Tables"]["skill_curriculum_topics"]["Row"]>;
      };
      skill_curriculum_topic_resources: {
        Row: {
          id: string;
          topic_id: string;
          type: string;
          title: string;
          url: string;
          notes: string | null;
          estimated_hours: number | null;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_curriculum_topic_resources"]["Row"]> & { topic_id: string; type: string; title: string; url: string };
        Update: Partial<Database["public"]["Tables"]["skill_curriculum_topic_resources"]["Row"]>;
      };
      skill_logs: {
        Row: { id: string; skill_id: string; user_id: string; hours: number; note: string | null; logged_at: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["skill_logs"]["Row"]> & { skill_id: string; user_id: string; hours: number };
        Update: Partial<Database["public"]["Tables"]["skill_logs"]["Row"]>;
      };
      tasks: {
        Row: {
          id: string; user_id: string; title: string; description: string | null;
          status: "todo" | "in_progress" | "done" | "archived";
          priority: "low" | "medium" | "high" | "urgent";
          scheduled_date: string | null; scheduled_time: string | null; duration_minutes: number | null;
          skill_id: string | null; project_id: string | null; position: number;
          completed_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & { user_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      };
      events: {
        Row: { id: string; user_id: string; title: string; description: string | null; location: string | null; start_time: string; end_time: string; all_day: boolean; color: string; recurrence_rule: string | null; source_type: string; source_id: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & { user_id: string; title: string; start_time: string; end_time: string };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
      projects: {
        Row: { id: string; user_id: string; title: string; description: string | null; status: "planning" | "active" | "on_hold" | "completed" | "cancelled"; skill_id: string | null; start_date: string | null; deadline: string | null; progress: number; reminder_days_before: number[]; color: string; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & { user_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      project_milestones: {
        Row: { id: string; project_id: string; title: string; is_complete: boolean; due_date: string | null; position: number; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["project_milestones"]["Row"]> & { project_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["project_milestones"]["Row"]>;
      };
      notes: {
        Row: { id: string; user_id: string; title: string; content: string; tags: string[]; skill_id: string | null; pinned: boolean; archived: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
      resources: {
        Row: { id: string; user_id: string; title: string; url: string | null; type: "article" | "video" | "course" | "book" | "documentation" | "tool" | "other"; skill_id: string | null; tags: string[]; notes: string | null; is_favorite: boolean; completed: boolean; rating: number | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["resources"]["Row"]> & { user_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["resources"]["Row"]>;
      };
      badges: {
        Row: { id: string; code: string; name: string; description: string; icon: string; rarity: "common" | "rare" | "epic" | "legendary"; xp_reward: number; criteria: Json; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["badges"]["Row"]> & { code: string; name: string; description: string };
        Update: Partial<Database["public"]["Tables"]["badges"]["Row"]>;
      };
      user_badges: {
        Row: { id: string; user_id: string; badge_id: string; earned_at: string };
        Insert: Partial<Database["public"]["Tables"]["user_badges"]["Row"]> & { user_id: string; badge_id: string };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Row"]>;
      };
      xp_events: {
        Row: { id: string; user_id: string; amount: number; reason: string; source_type: string | null; source_id: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["xp_events"]["Row"]> & { user_id: string; amount: number; reason: string };
        Update: Partial<Database["public"]["Tables"]["xp_events"]["Row"]>;
      };
      push_subscriptions: {
        Row: { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; user_agent: string | null; created_at: string; last_used_at: string | null };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & { user_id: string; endpoint: string; p256dh: string; auth: string };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; channel: string; title: string; body: string; link: string | null; data: Json; is_read: boolean; sent_at: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & { user_id: string; type: string; title: string; body: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
    Views: {
      v_daily_activity: { Row: { user_id: string; day: string; tasks_done: number; skill_sessions: number } };
      v_weekly_summary: { Row: { user_id: string; week_start: string; tasks_done: number; skill_sessions: number } };
      v_skill_distribution: { Row: { user_id: string; category: string; skill_count: number; total_hours: number; avg_progress: number } };
    };
    Functions: {
      award_xp: {
        Args: { p_user_id: string; p_amount: number; p_reason: string; p_source_type?: string; p_source_id?: string };
        Returns: void;
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
