export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category_id: number
          cost_price: number
          created_at: string
          id: number
          is_active: boolean
          low_stock_level: number
          name: string
          selling_price: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id: number
          cost_price?: number
          created_at?: string
          id?: never
          is_active?: boolean
          low_stock_level?: number
          name: string
          selling_price: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: number
          cost_price?: number
          created_at?: string
          id?: never
          is_active?: boolean
          low_stock_level?: number
          name?: string
          selling_price?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          approval_pin_hash: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          pin_failed_attempts: number
          pin_locked_until: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
          username: string
        }
        Insert: {
          approval_pin_hash?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          pin_failed_attempts?: number
          pin_locked_until?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          username: string
        }
        Update: {
          approval_pin_hash?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          pin_failed_attempts?: number
          pin_locked_until?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: number
          line_total: number
          product_id: number
          product_name: string
          quantity: number
          sale_id: number
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          id?: never
          line_total: number
          product_id: number
          product_name: string
          quantity: number
          sale_id: number
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          id?: never
          line_total?: number
          product_id?: number
          product_name?: string
          quantity?: number
          sale_id?: number
          unit_cost?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sale_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_items_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
        ]
      }
      sale_voids: {
        Row: {
          approved_by: string
          created_at: string
          id: number
          reason: string
          requested_by: string | null
          sale_id: number
          shift_id: number | null
          type: Database['public']['Enums']['void_type']
        }
        Insert: {
          approved_by: string
          created_at?: string
          id?: never
          reason: string
          requested_by?: string | null
          sale_id: number
          shift_id?: number | null
          type: Database['public']['Enums']['void_type']
        }
        Update: {
          approved_by?: string
          created_at?: string
          id?: never
          reason?: string
          requested_by?: string | null
          sale_id?: number
          shift_id?: number | null
          type?: Database['public']['Enums']['void_type']
        }
        Relationships: [
          {
            foreignKeyName: 'sale_voids_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_voids_requested_by_fkey'
            columns: ['requested_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_voids_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: true
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_voids_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shifts'
            referencedColumns: ['id']
          },
        ]
      }
      sales: {
        Row: {
          cash_received: number
          cashier_id: string
          change: number
          created_at: string
          discount: number
          id: number
          receipt_no: string
          shift_id: number
          status: Database['public']['Enums']['sale_status']
          subtotal: number
          total: number
          vat_amount: number
        }
        Insert: {
          cash_received: number
          cashier_id: string
          change: number
          created_at?: string
          discount?: number
          id?: never
          receipt_no?: string
          shift_id: number
          status?: Database['public']['Enums']['sale_status']
          subtotal: number
          total: number
          vat_amount?: number
        }
        Update: {
          cash_received?: number
          cashier_id?: string
          change?: number
          created_at?: string
          discount?: number
          id?: never
          receipt_no?: string
          shift_id?: number
          status?: Database['public']['Enums']['sale_status']
          subtotal?: number
          total?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sales_cashier_id_fkey'
            columns: ['cashier_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sales_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shifts'
            referencedColumns: ['id']
          },
        ]
      }
      shifts: {
        Row: {
          actual_cash: number | null
          cashier_id: string
          closed_at: string | null
          difference: number | null
          expected_cash: number | null
          id: number
          opened_at: string
          starting_cash: number
        }
        Insert: {
          actual_cash?: number | null
          cashier_id?: string
          closed_at?: string | null
          difference?: number | null
          expected_cash?: number | null
          id?: never
          opened_at?: string
          starting_cash: number
        }
        Update: {
          actual_cash?: number | null
          cashier_id?: string
          closed_at?: string | null
          difference?: number | null
          expected_cash?: number | null
          id?: never
          opened_at?: string
          starting_cash?: number
        }
        Relationships: [
          {
            foreignKeyName: 'shifts_cashier_id_fkey'
            columns: ['cashier_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string
          created_at: string
          id: number
          product_id: number
          quantity_change: number
          reason: string
        }
        Insert: {
          adjusted_by: string
          created_at?: string
          id?: never
          product_id: number
          quantity_change: number
          reason: string
        }
        Update: {
          adjusted_by?: string
          created_at?: string
          id?: never
          product_id?: number
          quantity_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_adjustments_adjusted_by_fkey'
            columns: ['adjusted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_adjustments_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      stock_in_items: {
        Row: {
          id: number
          product_id: number
          quantity: number
          stock_in_id: number
          unit_cost: number
        }
        Insert: {
          id?: never
          product_id: number
          quantity: number
          stock_in_id: number
          unit_cost: number
        }
        Update: {
          id?: never
          product_id?: number
          quantity?: number
          stock_in_id?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: 'stock_in_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_in_items_stock_in_id_fkey'
            columns: ['stock_in_id']
            isOneToOne: false
            referencedRelation: 'stock_ins'
            referencedColumns: ['id']
          },
        ]
      }
      stock_ins: {
        Row: {
          created_at: string
          id: number
          notes: string | null
          received_at: string
          received_by: string | null
          supplier_name: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          notes?: string | null
          received_at?: string
          received_by?: string | null
          supplier_name?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          notes?: string | null
          received_at?: string
          received_by?: string | null
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_ins_received_by_fkey'
            columns: ['received_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          product_id: number
          quantity_change: number
          reference_id: number | null
          type: Database['public']['Enums']['movement_type']
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          product_id: number
          quantity_change: number
          reference_id?: number | null
          type: Database['public']['Enums']['movement_type']
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          product_id?: number
          quantity_change?: number
          reference_id?: number | null
          type?: Database['public']['Enums']['movement_type']
        }
        Relationships: [
          {
            foreignKeyName: 'stock_movements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      store_settings: {
        Row: {
          address: string
          contact_no: string
          default_low_stock_level: number
          id: number
          receipt_footer: string
          receipt_paper_width: number
          store_name: string
          updated_at: string
          vat_enabled: boolean
          vat_rate: number
        }
        Insert: {
          address?: string
          contact_no?: string
          default_low_stock_level?: number
          id?: number
          receipt_footer?: string
          receipt_paper_width?: number
          store_name?: string
          updated_at?: string
          vat_enabled?: boolean
          vat_rate?: number
        }
        Update: {
          address?: string
          contact_no?: string
          default_low_stock_level?: number
          id?: number
          receipt_footer?: string
          receipt_paper_width?: number
          store_name?: string
          updated_at?: string
          vat_enabled?: boolean
          vat_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_product_id: number
          p_quantity_change: number
          p_reason: string
        }
        Returns: number
      }
      check_admin_approval: {
        Args: { p_pin: string; p_username: string }
        Returns: Record<string, unknown>
      }
      check_report_range: {
        Args: { p_from: string; p_to: string }
        Returns: undefined
      }
      close_shift: {
        Args: { p_actual_cash: number; p_shift_id: number }
        Returns: {
          actual_cash: number | null
          cashier_id: string
          closed_at: string | null
          difference: number | null
          expected_cash: number | null
          id: number
          opened_at: string
          starting_cash: number
        }
        SetofOptions: {
          from: '*'
          to: 'shifts'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_sale: {
        Args: { p_cash_received: number; p_discount?: number; p_items: Json }
        Returns: {
          cash_received: number
          cashier_id: string
          change: number
          created_at: string
          discount: number
          id: number
          receipt_no: string
          shift_id: number
          status: Database['public']['Enums']['sale_status']
          subtotal: number
          total: number
          vat_amount: number
        }
        SetofOptions: {
          from: '*'
          to: 'sales'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      next_receipt_no: { Args: never; Returns: string }
      record_stock_in: {
        Args: {
          p_items: Json
          p_notes?: string
          p_received_at?: string
          p_supplier_name?: string
        }
        Returns: number
      }
      refund_sale: {
        Args: {
          p_admin_pin: string
          p_admin_username: string
          p_reason: string
          p_sale_id: number
        }
        Returns: Json
      }
      report_best_sellers: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          product_id: number
          product_name: string
          quantity: number
          sales: number
        }[]
      }
      report_daily_sales: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          total_sales: number
          transaction_count: number
        }[]
      }
      report_entries: {
        Args: { p_from: string; p_to: string }
        Returns: {
          entry_day: string
          sale_id: number
          sign: number
        }[]
      }
      report_low_stock: {
        Args: never
        Returns: {
          category_name: string
          low_stock_level: number
          product_id: number
          product_name: string
          stock_qty: number
        }[]
      }
      report_shift_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          actual_cash: number
          cashier_name: string
          closed_at: string
          difference: number
          expected_cash: number
          opened_at: string
          shift_id: number
          starting_cash: number
        }[]
      }
      report_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          average_sale: number
          gross_profit: number
          items_sold: number
          low_stock_count: number
          refunds: number
          sales_without_cost: number
          total_sales: number
          transaction_count: number
        }[]
      }
      reverse_sale: {
        Args: {
          p_admin_pin: string
          p_admin_username: string
          p_reason: string
          p_sale_id: number
          p_type: Database['public']['Enums']['void_type']
        }
        Returns: Json
      }
      set_approval_pin: { Args: { p_pin: string }; Returns: undefined }
      shift_cash_summary: {
        Args: { p_shift_id: number }
        Returns: {
          cash_sales: number
          expected_cash: number
          refunds: number
          starting_cash: number
        }[]
      }
      void_sale: {
        Args: {
          p_admin_pin: string
          p_admin_username: string
          p_reason: string
          p_sale_id: number
        }
        Returns: Json
      }
    }
    Enums: {
      movement_type: 'stock_in' | 'sale' | 'adjustment' | 'void' | 'refund'
      sale_status: 'completed' | 'voided' | 'refunded'
      user_role: 'admin' | 'cashier'
      void_type: 'void' | 'refund'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      movement_type: ['stock_in', 'sale', 'adjustment', 'void', 'refund'],
      sale_status: ['completed', 'voided', 'refunded'],
      user_role: ['admin', 'cashier'],
      void_type: ['void', 'refund'],
    },
  },
} as const
