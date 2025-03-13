export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Estimation: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          isActive: boolean | null
          isEnded: boolean | null
          name: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          isEnded?: boolean | null
          name: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          isEnded?: boolean | null
          name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Estimation_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
        ]
      }
      Player: {
        Row: {
          created_at: string
          email: string | null
          id: string
          pattern: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          pattern: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          pattern?: string
          username?: string
        }
        Relationships: []
      }
      Session: {
        Row: {
          created_at: string
          id: string
          name: string
          pin: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pin?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pin?: string | null
        }
        Relationships: []
      }
      SessionPlayer: {
        Row: {
          created_at: string
          id: number
          player_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          player_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          player_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SessionPlayer_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "Player"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SessionPlayer_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Session"
            referencedColumns: ["id"]
          },
        ]
      }
      Vote: {
        Row: {
          created_at: string
          estimation_id: string | null
          id: string
          player_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          estimation_id?: string | null
          id?: string
          player_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          estimation_id?: string | null
          id?: string
          player_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Vote_estimation_id_fkey"
            columns: ["estimation_id"]
            isOneToOne: false
            referencedRelation: "Estimation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Vote_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "Player"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
