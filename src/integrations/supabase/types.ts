export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          related_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string
          blocked_id: string
          blocker_id: string
          id: string
        }
        Insert: {
          blocked_at?: string
          blocked_id: string
          blocker_id: string
          id?: string
        }
        Update: {
          blocked_at?: string
          blocked_id?: string
          blocker_id?: string
          id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          collaboration_request_id: string
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          id: string
          reminder_sent: boolean | null
          start_time: string
          title: string
        }
        Insert: {
          collaboration_request_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          reminder_sent?: boolean | null
          start_time: string
          title: string
        }
        Update: {
          collaboration_request_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          reminder_sent?: boolean | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          agreed_amount: number | null
          collaboration_type: Database["public"]["Enums"]["collaboration_type"]
          created_at: string
          description: string
          duration: string | null
          id: string
          payment_status: string | null
          purpose: string
          requestee_confirmed_completion: boolean | null
          requestee_id: string
          requester_confirmed_completion: boolean | null
          requester_id: string
          skill_needed: string
          status: Database["public"]["Enums"]["collaboration_status"]
          updated_at: string
        }
        Insert: {
          agreed_amount?: number | null
          collaboration_type?: Database["public"]["Enums"]["collaboration_type"]
          created_at?: string
          description: string
          duration?: string | null
          id?: string
          payment_status?: string | null
          purpose: string
          requestee_confirmed_completion?: boolean | null
          requestee_id: string
          requester_confirmed_completion?: boolean | null
          requester_id: string
          skill_needed: string
          status?: Database["public"]["Enums"]["collaboration_status"]
          updated_at?: string
        }
        Update: {
          agreed_amount?: number | null
          collaboration_type?: Database["public"]["Enums"]["collaboration_type"]
          created_at?: string
          description?: string
          duration?: string | null
          id?: string
          payment_status?: string | null
          purpose?: string
          requestee_confirmed_completion?: boolean | null
          requestee_id?: string
          requester_confirmed_completion?: boolean | null
          requester_id?: string
          skill_needed?: string
          status?: Database["public"]["Enums"]["collaboration_status"]
          updated_at?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          push_enabled: boolean | null
          push_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          push_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          collaboration_request_id: string
          created_at: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          resolution_deadline: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
        }
        Insert: {
          collaboration_request_id: string
          created_at?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          resolution_deadline?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Update: {
          collaboration_request_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          resolution_deadline?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          event_id: string
          id: string
          registration_id: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          event_id: string
          id?: string
          registration_id?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          event_id?: string
          id?: string
          registration_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_certificates: {
        Row: {
          certificate_type: string
          certificate_url: string | null
          event_id: string
          id: string
          issued_at: string
          issued_by: string | null
          user_id: string
        }
        Insert: {
          certificate_type?: string
          certificate_url?: string | null
          event_id: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          user_id: string
        }
        Update: {
          certificate_type?: string
          certificate_url?: string | null
          event_id?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_media: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          media_type: string
          media_url: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          media_type?: string
          media_url: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          media_type?: string
          media_url?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          team_members: Json | null
          team_name: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          team_members?: Json | null
          team_name?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          team_members?: Json | null
          team_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          college: string | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_subtype: string | null
          event_type: string
          id: string
          image_url: string | null
          location: string | null
          max_team_size: number
          min_team_size: number
          mode: Database["public"]["Enums"]["event_mode"]
          organizer_id: string | null
          registration_deadline: string | null
          registration_link: string | null
          scope: Database["public"]["Enums"]["event_scope"]
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
          college?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_subtype?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_team_size?: number
          min_team_size?: number
          mode?: Database["public"]["Enums"]["event_mode"]
          organizer_id?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          scope?: Database["public"]["Enums"]["event_scope"]
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          college?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_subtype?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_team_size?: number
          min_team_size?: number
          mode?: Database["public"]["Enums"]["event_mode"]
          organizer_id?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          scope?: Database["public"]["Enums"]["event_scope"]
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          collaboration_request_id: string
          content: string
          id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          collaboration_request_id: string
          content: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          collaboration_request_id?: string
          content?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_messages: {
        Row: {
          collaboration_request_id: string
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string
        }
        Insert: {
          collaboration_request_id: string
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by: string
        }
        Update: {
          collaboration_request_id?: string
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          project_link: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_link?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_link?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_messages_from: string
          created_at: string
          id: string
          profile_visibility: string
          show_college: boolean
          show_earnings: boolean
          show_email: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages_from?: string
          created_at?: string
          id?: string
          profile_visibility?: string
          show_college?: boolean
          show_earnings?: boolean
          show_email?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages_from?: string
          created_at?: string
          id?: string
          profile_visibility?: string
          show_college?: boolean
          show_earnings?: boolean
          show_email?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          college: string | null
          created_at: string
          degree: string | null
          full_name: string | null
          github_url: string | null
          id: string
          is_paid_available: boolean | null
          max_earning_range: number | null
          min_earning_range: number | null
          updated_at: string
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          is_paid_available?: boolean | null
          max_earning_range?: number | null
          min_earning_range?: number | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_paid_available?: boolean | null
          max_earning_range?: number | null
          min_earning_range?: number | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          collaboration_request_id: string
          created_at: string
          feedback: string | null
          id: string
          payment_confirmed: boolean | null
          rated_by_user_id: string
          rated_user_id: string
          score: number
        }
        Insert: {
          collaboration_request_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          payment_confirmed?: boolean | null
          rated_by_user_id: string
          rated_user_id: string
          score: number
        }
        Update: {
          collaboration_request_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          payment_confirmed?: boolean | null
          rated_by_user_id?: string
          rated_user_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          id: string
          user_id: string
          version: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          user_id: string
          version?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      skill_badges: {
        Row: {
          awarded_at: string | null
          badge_level: string
          collaborations_completed: number | null
          id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_level?: string
          collaborations_completed?: number | null
          id?: string
          skill_name: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_level?: string
          collaborations_completed?: number | null
          id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["skill_level"]
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          collaboration_request_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collaboration_request_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collaboration_request_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_availability: {
        Row: {
          created_at: string
          id: string
          interests: string[] | null
          learning: boolean | null
          paid_collaboration: boolean | null
          project: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[] | null
          learning?: boolean | null
          paid_collaboration?: boolean | null
          project?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[] | null
          learning?: boolean | null
          paid_collaboration?: boolean | null
          project?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_earnings: {
        Row: {
          id: string
          total_earnings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          total_earnings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_penalties: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          penalty_type: Database["public"]["Enums"]["penalty_type"]
          reason: string | null
          starts_at: string | null
          user_id: string
          violation_count: number | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          penalty_type: Database["public"]["Enums"]["penalty_type"]
          reason?: string | null
          starts_at?: string | null
          user_id: string
          violation_count?: number | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          penalty_type?: Database["public"]["Enums"]["penalty_type"]
          reason?: string | null
          starts_at?: string | null
          user_id?: string
          violation_count?: number | null
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          badges: string[] | null
          created_at: string
          id: string
          points: number | null
          total_collaborations: number | null
          total_earnings: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          created_at?: string
          id?: string
          points?: number | null
          total_collaborations?: number | null
          total_earnings?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: string[] | null
          created_at?: string
          id?: string
          points?: number | null
          total_collaborations?: number | null
          total_earnings?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_violations: {
        Row: {
          acknowledged: boolean | null
          blocked_content: string | null
          collaboration_request_id: string | null
          created_at: string | null
          id: string
          user_id: string
          violation_type: Database["public"]["Enums"]["violation_type"]
        }
        Insert: {
          acknowledged?: boolean | null
          blocked_content?: string | null
          collaboration_request_id?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          violation_type: Database["public"]["Enums"]["violation_type"]
        }
        Update: {
          acknowledged?: boolean | null
          blocked_content?: string | null
          collaboration_request_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          violation_type?: Database["public"]["Enums"]["violation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_violations_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          workspace_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          workspace_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_milestones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          collaboration_request_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          collaboration_request_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          collaboration_request_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_collaboration_request_id_fkey"
            columns: ["collaboration_request_id"]
            isOneToOne: true
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_workspace: { Args: { ws_id: string }; Returns: boolean }
      get_profile_with_privacy: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          college: string
          degree: string
          full_name: string
          id: string
          is_paid_available: boolean
          max_earning_range: number
          min_earning_range: number
          year: string
        }[]
      }
      get_user_violation_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      has_active_penalty: {
        Args: {
          check_penalty_type?: Database["public"]["Enums"]["penalty_type"]
          target_user_id: string
        }
        Returns: boolean
      }
      has_open_dispute: { Args: { target_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_collaboration_accepted: {
        Args: { request_id: string }
        Returns: boolean
      }
      is_collaboration_completed: {
        Args: { request_id: string }
        Returns: boolean
      }
      is_collaboration_participant: {
        Args: { request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "organizer"
      collaboration_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "ongoing"
        | "completed"
        | "cancelled"
      collaboration_type: "learning" | "project" | "paid"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_favor_reporter"
        | "resolved_favor_reported"
        | "resolved_mutual"
        | "dismissed"
      event_category: "technical" | "non_technical"
      event_mode: "online" | "offline" | "hybrid"
      event_scope: "college" | "national" | "global"
      penalty_type:
        | "warning"
        | "cooldown"
        | "temporary_restriction"
        | "account_review"
        | "permanent_ban"
      skill_level: "beginner" | "intermediate" | "advanced"
      task_status: "todo" | "in_progress" | "completed"
      violation_type:
        | "phone_number"
        | "email_address"
        | "social_media"
        | "external_link"
        | "prohibited_keyword"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "organizer"],
      collaboration_status: [
        "pending",
        "accepted",
        "rejected",
        "ongoing",
        "completed",
        "cancelled",
      ],
      collaboration_type: ["learning", "project", "paid"],
      dispute_status: [
        "open",
        "under_review",
        "resolved_favor_reporter",
        "resolved_favor_reported",
        "resolved_mutual",
        "dismissed",
      ],
      event_category: ["technical", "non_technical"],
      event_mode: ["online", "offline", "hybrid"],
      event_scope: ["college", "national", "global"],
      penalty_type: [
        "warning",
        "cooldown",
        "temporary_restriction",
        "account_review",
        "permanent_ban",
      ],
      skill_level: ["beginner", "intermediate", "advanced"],
      task_status: ["todo", "in_progress", "completed"],
      violation_type: [
        "phone_number",
        "email_address",
        "social_media",
        "external_link",
        "prohibited_keyword",
      ],
    },
  },
} as const
