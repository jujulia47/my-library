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
      book: {
        Row: {
          acquisition_date: string | null
          author: string
          category: string | null
          comments: string | null
          cover: string
          created_at: string
          current_page: number | null
          finish_date: string | null
          id: number
          init_date: string | null
          is_single_book: boolean
          language: string
          library: boolean
          pages: number | null
          rating: number | null
          serie_id: number | null
          status: string
          title: string
          version: string[] | null
          volume: number | null
        }
        Insert: {
          acquisition_date?: string | null
          author: string
          category?: string | null
          comments?: string | null
          cover: string
          created_at?: string
          current_page?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          is_single_book: boolean
          language: string
          library: boolean
          pages?: number | null
          rating?: number | null
          serie_id?: number | null
          status: string
          title: string
          version?: string[] | null
          volume?: number | null
        }
        Update: {
          acquisition_date?: string | null
          author?: string
          category?: string | null
          comments?: string | null
          cover?: string
          created_at?: string
          current_page?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          is_single_book?: boolean
          language?: string
          library?: boolean
          pages?: number | null
          rating?: number | null
          serie_id?: number | null
          status?: string
          title?: string
          version?: string[] | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "serie"
            referencedColumns: ["id"]
          },
        ]
      }
      collection: {
        Row: {
          collection_name: string | null
          created_at: string
          description: string | null
          finish_date: string | null
          id: number
          init_date: string | null
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
        }
        Relationships: []
      }
      collection_book: {
        Row: {
          book_id: number | null
          collection_id: number | null
          created_at: string
          id: number
        }
        Insert: {
          book_id?: number | null
          collection_id?: number | null
          created_at?: string
          id?: number
        }
        Update: {
          book_id?: number | null
          collection_id?: number | null
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_book_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_book_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_serie: {
        Row: {
          collection_id: number | null
          created_at: string
          id: number
          serie_id: number | null
        }
        Insert: {
          collection_id?: number | null
          created_at?: string
          id?: number
          serie_id?: number | null
        }
        Update: {
          collection_id?: number | null
          created_at?: string
          id?: number
          serie_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_serie_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_serie_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "serie"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_wishlist: {
        Row: {
          collection_id: number | null
          created_at: string
          id: number
          wishlist_id: number | null
        }
        Insert: {
          collection_id?: number | null
          created_at?: string
          id?: number
          wishlist_id?: number | null
        }
        Update: {
          collection_id?: number | null
          created_at?: string
          id?: number
          wishlist_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_wishlist_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_wishlist_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
      quote: {
        Row: {
          book_id: number | null
          created_at: string
          id: number
          page: number | null
          quote: string | null
        }
        Insert: {
          book_id?: number | null
          created_at?: string
          id?: number
          page?: number | null
          quote?: string | null
        }
        Update: {
          book_id?: number | null
          created_at?: string
          id?: number
          page?: number | null
          quote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
        ]
      }
      serie: {
        Row: {
          created_at: string
          current_book_id: number | null
          finish_date: string | null
          id: number
          init_date: string | null
          library_collection: boolean | null
          qty_volumes: number | null
          rating: number | null
          serie_name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          current_book_id?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          library_collection?: boolean | null
          qty_volumes?: number | null
          rating?: number | null
          serie_name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          current_book_id?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          library_collection?: boolean | null
          qty_volumes?: number | null
          rating?: number | null
          serie_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serie_current_book_id_fkey"
            columns: ["current_book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          author: string | null
          book_name: string | null
          created_at: string
          id: number
          is_single_book: boolean | null
          serie_id: number | null
          volume: number | null
        }
        Insert: {
          author?: string | null
          book_name?: string | null
          created_at?: string
          id?: number
          is_single_book?: boolean | null
          serie_id?: number | null
          volume?: number | null
        }
        Update: {
          author?: string | null
          book_name?: string | null
          created_at?: string
          id?: number
          is_single_book?: boolean | null
          serie_id?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "serie"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
