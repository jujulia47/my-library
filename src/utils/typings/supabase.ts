export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      book: {
        Row: {
          acquisition_date: string | null
          author: string
          category: string | null
          comments: string | null
          cover: string | null
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
          slug: string | null
          status: string
          title: string
          version: Database["public"]["Enums"]["versions"][] | null
          volume: number | null
        }
        Insert: {
          acquisition_date?: string | null
          author: string
          category?: string | null
          comments?: string | null
          cover?: string | null
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
          slug?: string | null
          status: string
          title: string
          version?: Database["public"]["Enums"]["versions"][] | null
          volume?: number | null
        }
        Update: {
          acquisition_date?: string | null
          author?: string
          category?: string | null
          comments?: string | null
          cover?: string | null
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
          slug?: string | null
          status?: string
          title?: string
          version?: Database["public"]["Enums"]["versions"][] | null
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
          slug: string | null
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          slug?: string | null
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          slug?: string | null
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
          slug: string | null
        }
        Insert: {
          book_id?: number | null
          created_at?: string
          id?: number
          page?: number | null
          quote?: string | null
          slug?: string | null
        }
        Update: {
          book_id?: number | null
          created_at?: string
          id?: number
          page?: number | null
          quote?: string | null
          slug?: string | null
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
          collection_complete: boolean | null
          created_at: string
          current_book_id: number | null
          finish_date: string | null
          id: number
          init_date: string | null
          qty_volumes: number | null
          rating: number | null
          serie_name: string | null
          slug: string | null
          status: string | null
        }
        Insert: {
          collection_complete?: boolean | null
          created_at?: string
          current_book_id?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          qty_volumes?: number | null
          rating?: number | null
          serie_name?: string | null
          slug?: string | null
          status?: string | null
        }
        Update: {
          collection_complete?: boolean | null
          created_at?: string
          current_book_id?: number | null
          finish_date?: string | null
          id?: number
          init_date?: string | null
          qty_volumes?: number | null
          rating?: number | null
          serie_name?: string | null
          slug?: string | null
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
          slug: string | null
          volume: number | null
        }
        Insert: {
          author?: string | null
          book_name?: string | null
          created_at?: string
          id?: number
          is_single_book?: boolean | null
          serie_id?: number | null
          slug?: string | null
          volume?: number | null
        }
        Update: {
          author?: string | null
          book_name?: string | null
          created_at?: string
          id?: number
          is_single_book?: boolean | null
          serie_id?: number | null
          slug?: string | null
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
      versions: "physical" | "audiobook" | "ebook"
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
      versions: ["physical", "audiobook", "ebook"],
    },
  },
} as const
