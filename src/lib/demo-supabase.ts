'use client'

// Demo Supabase client — returns mock data immediately when Supabase URL is not configured.
import { 
  DEMO_PROJECTS, DEMO_TRANSACTIONS, DEMO_FISCAL_YEARS, 
  DEMO_CATEGORIES, DEMO_WORK_GROUPS, DEMO_SETTINGS, DEMO_PROFILES,
  DEMO_ORGANIZATIONS, DEMO_ORGANIZATION_MEMBERS, DEMO_BUDGET_CATEGORIES
} from '@/lib/mock-data'

type QueryResult = { data: any[] | any | null; error: null; count?: number }

const MOCK_TABLES: Record<string, any[]> = {
    'projects': DEMO_PROJECTS,
    'transactions': DEMO_TRANSACTIONS,
    'fiscal_years': DEMO_FISCAL_YEARS,
    'category_types': DEMO_CATEGORIES,
    'work_groups': DEMO_WORK_GROUPS,
    'system_settings': DEMO_SETTINGS,
    'profiles': DEMO_PROFILES,
    'organizations': DEMO_ORGANIZATIONS,
    'organization_members': DEMO_ORGANIZATION_MEMBERS,
    'budget_categories': DEMO_BUDGET_CATEGORIES,
    'invitations': [],
    'activity_log': [],
  }

function matchFilter(row: any, filter: string): boolean {
  // filter format: "operator:field:value"
  const parts = filter.split(':')
  const op = parts[0]
  const field = parts[1]
  const value = parts.slice(2).join(':')

  const rowVal = row[field]
  if (rowVal === undefined || rowVal === null) return false

  switch (op) {
    case 'eq': return String(rowVal) === String(value)
    case 'neq': return String(rowVal) !== String(value)
    case 'in': try {
      const vals = JSON.parse(value)
      return vals.includes(rowVal)
    } catch { return false }
    default: return true
  }
}

function applyFilters(data: any[], filters: string[]): any[] {
  for (const f of filters) {
    data = data.filter(row => matchFilter(row, f))
  }
  return data
}

// Chainable query builder
function createQueryChain(tableName: string): any {
  let filters: string[] = []
  let orderField: string | null = null
  let orderAsc = true
  let limitCount: number | null = null
  let selectMode: 'all' | 'head' = 'all'
  let _single = false

  const buildResult = (): QueryResult => {
    let data = [...(MOCK_TABLES[tableName] || [])]
    data = applyFilters(data, filters)

    if (orderField) {
      data.sort((a, b) => {
        const va = a[orderField!], vb = b[orderField!]
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        if (va < vb) return orderAsc ? -1 : 1
        if (va > vb) return orderAsc ? 1 : -1
        return 0
      })
    }

    if (limitCount !== null) {
      data = data.slice(0, limitCount)
    }

    if (selectMode === 'head') {
      return { data: null, error: null, count: data.length }
    }

    if (_single && data.length > 0) {
      return { data: data[0], error: null }
    }

    return { data, error: null }
  }

  const chain: any = {}

  // Make chain thenable
  chain.then = (resolve: any) => Promise.resolve(resolve(buildResult()))
  chain.catch = (_reject: any) => chain

  chain.select = (...args: any[]) => {
    if (args[1] && typeof args[1] === 'object' && (args[1] as any).head) {
      selectMode = 'head'
    }
    return chain
  }

  chain.eq = (field: string, value: any) => {
    filters.push(`eq:${field}:${value}`)
    return chain
  }

  chain.neq = (field: string, value: any) => {
    filters.push(`neq:${field}:${value}`)
    return chain
  }

  chain.in = (field: string, values: any[]) => {
    filters.push(`in:${field}:${JSON.stringify(values)}`)
    return chain
  }

  chain.order = (field: string, opts?: { ascending?: boolean }) => {
    orderField = field
    orderAsc = opts?.ascending ?? true
    return chain
  }

  chain.limit = (n: number) => {
    limitCount = n
    return chain
  }

  chain.single = () => { _single = true; return chain }

  // No-op builder methods — return chain as-is
  const noop = () => chain
  chain.gt = noop; chain.gte = noop; chain.lt = noop; chain.lte = noop
  chain.like = noop; chain.ilike = noop; chain.is = noop
  chain.contains = noop; chain.or = noop; chain.not = noop
  chain.filter = noop; chain.match = noop; chain.range = noop
  chain.maybeSingle = noop; chain.set = noop; chain.override = noop
  chain.textSearch = noop; chain.insert = noop; chain.update = noop
  chain.delete = noop; chain.upsert = noop

  return chain
}

export function createDemoClient() {
  return {
    from: (table: string) => createQueryChain(table),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
  }
}

export function isDemo(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url === 'https://your-project.supabase.co' || url === 'your-project') {
    return true
  }
  return false
}
