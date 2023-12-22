export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          assistant_id: string
          chat_id: string
          created_at: string
          file_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_id: string
          chat_id?: string
          created_at?: string
          file_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_id?: string
          chat_id?: string
          created_at?: string
          file_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      document_sections: {
        Row: {
          content: string
          document_id: number
          embedding: string | null
          id: number
        }
        Insert: {
          content: string
          document_id: number
          embedding?: string | null
          id?: never
        }
        Update: {
          content?: string
          document_id?: number
          embedding?: string | null
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents_with_storage_path"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          id: number
          name: string
          storage_object_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: never
          name: string
          storage_object_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: never
          name?: string
          storage_object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_storage_object_id_fkey"
            columns: ["storage_object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          created_at: string
          file_id: string
          openai_id: string
          original_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          openai_id: string
          original_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          openai_id?: string
          original_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          direction: string
          message_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          direction: string
          message_id?: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          direction?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["chat_id"]
          }
        ]
      }
    }
    Views: {
      documents_with_storage_path: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number | null
          name: string | null
          storage_object_id: string | null
          storage_object_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_storage_object_id_fkey"
            columns: ["storage_object_id"]
            isOneToOne: false
            referencedRelation: "objects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      match_document_sections: {
        Args: {
          embedding: string
          match_threshold: number
        }
        Returns: {
          content: string
          document_id: number
          embedding: string | null
          id: number
        }[]
      }
      supabase_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
