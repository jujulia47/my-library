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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      author: {
        Row: {
          bio: string | null
          birth_year: number | null
          country: Database["public"]["Enums"]["country"] | null
          created_at: string
          death_year: number | null
          id: string
          name: string
          name_normalized: string | null
          nationality: string | null
          photo: string | null
          photo_url: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string
          death_year?: number | null
          id?: string
          name: string
          name_normalized?: string | null
          nationality?: string | null
          photo?: string | null
          photo_url?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string
          death_year?: number | null
          id?: string
          name?: string
          name_normalized?: string | null
          nationality?: string | null
          photo?: string | null
          photo_url?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      author_bibliography: {
        Row: {
          author_id: string
          created_at: string
          id: string
          notes: string | null
          publication_year: number | null
          title: string
          title_normalized: string | null
          user_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          notes?: string | null
          publication_year?: number | null
          title: string
          title_normalized?: string | null
          user_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          publication_year?: number | null
          title?: string
          title_normalized?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_bibliography_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "author"
            referencedColumns: ["id"]
          },
        ]
      }
      book: {
        Row: {
          acquired_at: string | null
          borrowed_at: string | null
          borrowed_from: string | null
          bundled_with: string[]
          comments: string | null
          cover: string | null
          created_at: string
          disposed_date: string | null
          formats_owned: Database["public"]["Enums"]["book_format"][] | null
          id: string
          is_favorite: boolean
          isbn: string | null
          language: Database["public"]["Enums"]["book_language"] | null
          lent_out_at: string | null
          lent_to: string | null
          original_title: string | null
          ownership_status: Database["public"]["Enums"]["ownership_status"]
          pages: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          publication_year: number | null
          publisher: string | null
          purchase_group_id: string | null
          purchase_origin: Database["public"]["Enums"]["purchase_origin"] | null
          purchase_price: number | null
          returned_at: string | null
          returned_to_acervo_at: string | null
          serie_id: string | null
          shelf_id: string | null
          shelf_position: number | null
          slug: string
          subscription_id: string | null
          synopsis: string | null
          table_of_contents: { title: string; page_start: number | null }[]
          title: string
          title_normalized: string | null
          updated_at: string
          user_id: string
          volume: number | null
          wont_read: boolean
        }
        Insert: {
          acquired_at?: string | null
          borrowed_at?: string | null
          borrowed_from?: string | null
          bundled_with?: string[]
          comments?: string | null
          cover?: string | null
          created_at?: string
          disposed_date?: string | null
          formats_owned?: Database["public"]["Enums"]["book_format"][] | null
          id?: string
          is_favorite?: boolean
          isbn?: string | null
          language?: Database["public"]["Enums"]["book_language"] | null
          lent_out_at?: string | null
          lent_to?: string | null
          original_title?: string | null
          ownership_status?: Database["public"]["Enums"]["ownership_status"]
          pages?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          publication_year?: number | null
          publisher?: string | null
          purchase_group_id?: string | null
          purchase_origin?:
            | Database["public"]["Enums"]["purchase_origin"]
            | null
          purchase_price?: number | null
          returned_at?: string | null
          returned_to_acervo_at?: string | null
          serie_id?: string | null
          shelf_id?: string | null
          shelf_position?: number | null
          slug: string
          subscription_id?: string | null
          synopsis?: string | null
          table_of_contents?: { title: string; page_start: number | null }[]
          title: string
          title_normalized?: string | null
          updated_at?: string
          user_id: string
          volume?: number | null
          wont_read?: boolean
        }
        Update: {
          acquired_at?: string | null
          borrowed_at?: string | null
          borrowed_from?: string | null
          bundled_with?: string[]
          comments?: string | null
          cover?: string | null
          created_at?: string
          disposed_date?: string | null
          formats_owned?: Database["public"]["Enums"]["book_format"][] | null
          id?: string
          is_favorite?: boolean
          isbn?: string | null
          language?: Database["public"]["Enums"]["book_language"] | null
          lent_out_at?: string | null
          lent_to?: string | null
          original_title?: string | null
          ownership_status?: Database["public"]["Enums"]["ownership_status"]
          pages?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          publication_year?: number | null
          publisher?: string | null
          purchase_group_id?: string | null
          purchase_origin?:
            | Database["public"]["Enums"]["purchase_origin"]
            | null
          purchase_price?: number | null
          returned_at?: string | null
          returned_to_acervo_at?: string | null
          serie_id?: string | null
          shelf_id?: string | null
          shelf_position?: number | null
          slug?: string
          subscription_id?: string | null
          synopsis?: string | null
          table_of_contents?: { title: string; page_start: number | null }[]
          title?: string
          title_normalized?: string | null
          updated_at?: string
          user_id?: string
          volume?: number | null
          wont_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "book_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "serie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      book_author: {
        Row: {
          author_id: string
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          book_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_author_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_author_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
        ]
      }
      book_category: {
        Row: {
          book_id: string
          category_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          category_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          category_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_category_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      book_status_history: {
        Row: {
          book_id: string
          changed_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["ownership_status"]
          user_id: string
        }
        Insert: {
          book_id: string
          changed_at?: string
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["ownership_status"]
          user_id: string
        }
        Update: {
          book_id?: string
          changed_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["ownership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_status_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          description_normalized: string | null
          end_date: string | null
          goal_count: number | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          name: string
          name_normalized: string | null
          provider: string | null
          provider_normalized: string | null
          slug: string
          start_date: string | null
          type: Database["public"]["Enums"]["collection_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          description_normalized?: string | null
          end_date?: string | null
          goal_count?: number | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          name: string
          name_normalized?: string | null
          provider?: string | null
          provider_normalized?: string | null
          slug: string
          start_date?: string | null
          type: Database["public"]["Enums"]["collection_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          description_normalized?: string | null
          end_date?: string | null
          goal_count?: number | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          name?: string
          name_normalized?: string | null
          provider?: string | null
          provider_normalized?: string | null
          slug?: string
          start_date?: string | null
          type?: Database["public"]["Enums"]["collection_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_item: {
        Row: {
          added_at: string
          book_id: string | null
          collection_id: string
          id: string
          position: number | null
          section: string | null
          user_id: string
          was_wishlist: boolean
          wishlist_id: string | null
        }
        Insert: {
          added_at?: string
          book_id?: string | null
          collection_id: string
          id?: string
          position?: number | null
          section?: string | null
          user_id: string
          was_wishlist?: boolean
          wishlist_id?: string | null
        }
        Update: {
          added_at?: string
          book_id?: string | null
          collection_id?: string
          id?: string
          position?: number | null
          section?: string | null
          user_id?: string
          was_wishlist?: boolean
          wishlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_item_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_item_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_item_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote: {
        Row: {
          author_name: string | null
          author_name_normalized: string | null
          book_id: string | null
          chapter: string | null
          created_at: string
          id: string
          is_favorite: boolean
          note: string | null
          page: number | null
          slug: string
          source: string | null
          text: string
          text_normalized: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          author_name_normalized?: string | null
          book_id?: string | null
          chapter?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          note?: string | null
          page?: number | null
          slug: string
          source?: string | null
          text: string
          text_normalized?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          author_name_normalized?: string | null
          book_id?: string | null
          chapter?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          note?: string | null
          page?: number | null
          slug?: string
          source?: string | null
          text?: string
          text_normalized?: string | null
          updated_at?: string
          user_id?: string
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
      reading: {
        Row: {
          book_id: string
          created_at: string
          current_page: number | null
          finish_date: string | null
          format: Database["public"]["Enums"]["book_format"] | null
          id: string
          rating: number | null
          review: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["reading_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          current_page?: number | null
          finish_date?: string | null
          format?: Database["public"]["Enums"]["book_format"] | null
          id?: string
          rating?: number | null
          review?: string | null
          start_date?: string | null
          status: Database["public"]["Enums"]["reading_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          current_page?: number | null
          finish_date?: string | null
          format?: Database["public"]["Enums"]["book_format"] | null
          id?: string
          rating?: number | null
          review?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["reading_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "book"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_event: {
        Row: {
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["reading_event_type"]
          id: string
          notes: string | null
          reading_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_type: Database["public"]["Enums"]["reading_event_type"]
          id?: string
          notes?: string | null
          reading_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["reading_event_type"]
          id?: string
          notes?: string | null
          reading_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_event_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "reading"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_goal: {
        Row: {
          created_at: string
          goal_count: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          goal_count: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          goal_count?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      reading_progress_log: {
        Row: {
          created_at: string
          id: string
          log_date: string
          pages_delta: number
          reading_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date: string
          pages_delta: number
          reading_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          pages_delta?: number
          reading_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_log_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "reading"
            referencedColumns: ["id"]
          },
        ]
      }
      serie: {
        Row: {
          created_at: string
          description: string | null
          finish_date: string | null
          id: string
          name: string
          name_normalized: string | null
          qty_volumes: number | null
          rating: number | null
          review: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["serie_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: string
          name: string
          name_normalized?: string | null
          qty_volumes?: number | null
          rating?: number | null
          review?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["serie_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          finish_date?: string | null
          id?: string
          name?: string
          name_normalized?: string | null
          qty_volumes?: number | null
          rating?: number | null
          review?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["serie_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shelf: {
        Row: {
          created_at: string
          id: string
          ordering: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordering: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ordering?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription: {
        Row: {
          active: boolean
          created_at: string
          id: string
          monthly_price: number | null
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          monthly_price?: number | null
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          monthly_price?: number | null
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_group: {
        Row: {
          acquired_at: string | null
          created_at: string
          id: string
          isbn: string | null
          name: string
          notes: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          name: string
          notes?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          name?: string
          notes?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          author_name: string | null
          author_name_normalized: string | null
          cover: string | null
          created_at: string
          estimated_price: number | null
          id: string
          isbn: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["wishlist_priority"] | null
          purchase_link: string | null
          slug: string
          title: string
          title_normalized: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          author_name_normalized?: string | null
          cover?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          isbn?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["wishlist_priority"] | null
          purchase_link?: string | null
          slug: string
          title: string
          title_normalized?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          author_name_normalized?: string | null
          cover?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          isbn?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["wishlist_priority"] | null
          purchase_link?: string | null
          slug?: string
          title?: string
          title_normalized?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      immutable_unaccent: { Args: { "": string }; Returns: string }
      seed_default_categories: { Args: never; Returns: undefined }
      seed_default_categories_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      seed_default_subscriptions: { Args: never; Returns: undefined }
      seed_default_subscriptions_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      shift_shelf_positions: {
        Args: {
          p_exclude_book_id: string
          p_from_position: number
          p_shelf_id: string
        }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      book_format: "physical" | "ebook" | "audiobook"
      book_language: "pt_BR" | "en" | "es" | "fr" | "it" | "de" | "ja" | "other"
      collection_type:
        | "challenge"
        | "list"
        | "shelf"
        | "subscription"
        | "wishlist"
      country:
        | "africa_do_sul"
        | "alemanha"
        | "angola"
        | "argentina"
        | "australia"
        | "brasil"
        | "cabo_verde"
        | "canada"
        | "chile"
        | "china"
        | "colombia"
        | "coreia_do_sul"
        | "cuba"
        | "egito"
        | "espanha"
        | "estados_unidos"
        | "franca"
        | "holanda"
        | "hungria"
        | "india"
        | "irlanda"
        | "israel"
        | "italia"
        | "japao"
        | "mexico"
        | "mocambique"
        | "noruega"
        | "peru"
        | "polonia"
        | "portugal"
        | "reino_unido"
        | "republica_tcheca"
        | "russia"
        | "suecia"
        | "turquia"
      ownership_status:
        | "owned"
        | "lent_out"
        | "borrowed"
        | "returned"
        | "donated"
        | "sold"
        | "traded"
        | "lost"
        | "kindle"
        | "audible"
      priority_level: "low" | "medium" | "high"
      purchase_origin:
        | "compra"
        | "assinatura"
        | "kindle_unlimited"
        | "audible"
        | "presente"
        | "troca"
        | "outro"
        | "nao_informado"
      reading_event_type:
        | "started"
        | "paused"
        | "resumed"
        | "finished"
        | "abandoned"
      reading_status: "reading" | "paused" | "finished" | "abandoned"
      serie_status: "tbr" | "reading" | "paused" | "finished" | "abandoned"
      wishlist_priority: "low" | "medium" | "high"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      book_format: ["physical", "ebook", "audiobook"],
      book_language: ["pt_BR", "en", "es", "fr", "it", "de", "ja", "other"],
      collection_type: [
        "challenge",
        "list",
        "shelf",
        "subscription",
        "wishlist",
      ],
      country: [
        "africa_do_sul",
        "alemanha",
        "angola",
        "argentina",
        "australia",
        "brasil",
        "cabo_verde",
        "canada",
        "chile",
        "china",
        "colombia",
        "coreia_do_sul",
        "cuba",
        "egito",
        "espanha",
        "estados_unidos",
        "franca",
        "holanda",
        "hungria",
        "india",
        "irlanda",
        "israel",
        "italia",
        "japao",
        "mexico",
        "mocambique",
        "noruega",
        "peru",
        "polonia",
        "portugal",
        "reino_unido",
        "republica_tcheca",
        "russia",
        "suecia",
        "turquia",
      ],
      ownership_status: [
        "owned",
        "lent_out",
        "borrowed",
        "returned",
        "donated",
        "sold",
        "traded",
        "lost",
        "kindle",
        "audible",
      ],
      priority_level: ["low", "medium", "high"],
      purchase_origin: [
        "compra",
        "assinatura",
        "kindle_unlimited",
        "audible",
        "presente",
        "troca",
        "outro",
        "nao_informado",
      ],
      reading_event_type: [
        "started",
        "paused",
        "resumed",
        "finished",
        "abandoned",
      ],
      reading_status: ["reading", "paused", "finished", "abandoned"],
      serie_status: ["tbr", "reading", "paused", "finished", "abandoned"],
      wishlist_priority: ["low", "medium", "high"],
    },
  },
} as const
