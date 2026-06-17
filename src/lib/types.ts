export interface User {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'manager' | 'user' | 'pending'
  approved: boolean
  department: string | null
  position: string | null
  created_at: string
  last_login: string | null
}

export interface FiscalYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Project {
  id: string
  fiscal_year_id: string | null
  name: string
  budget: number
  work_group: 'academic' | 'budget' | 'hr' | 'general' | 'other'
  responsible_person: string
  description: string | null
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'suspended'
  used_budget: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Computed
  total_budget?: number
  remaining_budget?: number
  budget_categories?: BudgetCategory[]
  created_by_name?: string
}

export interface CategoryType {
  id: string
  category_key: string
  category_name: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface BudgetCategory {
  id: string
  project_id: string
  category_type_id: string
  budget_amount: number
  category_key?: string
  category_name?: string
  remaining_balance?: number
  initial_amount?: number
}

export interface Transaction {
  id: string
  project_id: string
  category_type_id: string | null
  amount: number
  transaction_type: 'income' | 'expense' | 'transfer_in' | 'transfer_out'
  description: string | null
  transaction_date: string
  reference_number: string | null
  transfer_from_project_id: string | null
  transfer_to_project_id: string | null
  is_transfer: boolean
  created_by: string | null
  created_at: string
  // Joined
  project_name?: string
  category_name?: string
  created_by_name?: string
  type?: string
}

export interface BudgetTransfer {
  id: string
  project_id: string
  from_category_id: string
  to_category_id: string
  amount: number
  description: string | null
  transfer_date: string
  created_by: string | null
  created_at: string
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string | null
  setting_type: 'text' | 'number' | 'boolean' | 'file'
  description: string | null
}

export interface SiteConfig {
  site_name: string
  organization_name: string
  site_title: string
  site_icon: string
  enable_pwa: boolean
  year_label_type: 'fiscal_year' | 'academic_year' | 'budget_year'
}
