'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  DEMO_PROJECTS, DEMO_TRANSACTIONS, DEMO_CATEGORIES, DEMO_FISCAL_YEARS,
  DEMO_WORK_GROUPS, DEMO_SETTINGS, DEMO_PROFILES, DEMO_ORGANIZATIONS,
  DEMO_ORG_ID
} from '@/lib/mock-data'

interface DemoSandbox {
  projects: any[]
  transactions: any[]
  categories: any[]
  fiscalYears: any[]
  workGroups: any[]
  settings: Record<string, string>
  profiles: any[]
  organizations: any[]
  // Mutations
  addProject: (p: any) => void
  updateProject: (id: string, updates: any) => void
  deleteProject: (id: string) => void
  addTransaction: (tx: any) => void
  updateTransaction: (id: string, updates: any) => void
  deleteTransaction: (id: string) => void
  addCategory: (cat: any) => void
  updateCategory: (id: string, updates: any) => void
  deleteCategory: (id: string) => void
  addFiscalYear: (fy: any) => void
  updateFiscalYear: (id: string, updates: any) => void
  deleteFiscalYear: (id: string) => void
  updateWorkGroup: (id: string, updates: any) => void
  deleteWorkGroup: (id: string) => void
  addWorkGroup: (wg: any) => void
  updateSetting: (key: string, value: string) => void
  updateProfile: (id: string, updates: any) => void
  deleteProfile: (id: string) => void
}

const DemoSandboxContext = createContext<DemoSandbox | null>(null)

let _idCounter = 100

export function DemoSandboxProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_PROJECTS)))
  const [transactions, setTransactions] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_TRANSACTIONS)))
  const [categories, setCategories] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_CATEGORIES)))
  const [fiscalYears, setFiscalYears] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_FISCAL_YEARS)))
  const [workGroups, setWorkGroups] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_WORK_GROUPS)))
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    DEMO_SETTINGS.forEach(s => { m[s.setting_key] = s.setting_value })
    return m
  })
  const [profiles, setProfiles] = useState<any[]>(() => JSON.parse(JSON.stringify(DEMO_PROFILES)))

  const nextId = () => `demo-${++_idCounter}`

  // Projects
  const addProject = useCallback((p: any) => {
    setProjects(prev => [{ ...p, id: nextId(), txCount: 0, pct: 0, used: 0, remaining: Number(p.budget) }, ...prev])
  }, [])
  const updateProject = useCallback((id: string, updates: any) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])
  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  // Transactions
  const addTransaction = useCallback((tx: any) => {
    const newTx = { ...tx, id: nextId(), created_at: new Date().toISOString() }
    setTransactions(prev => [newTx, ...prev])
    // Update project used/remaining
    setProjects(prev => prev.map(p => {
      if (p.id !== tx.project_id) return p
      const amt = Number(tx.amount)
      const isIn = tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in'
      const newUsed = isIn ? p.used : p.used + Math.abs(amt)
      const newRemaining = Number(p.budget) - newUsed
      const newPct = Number(p.budget) > 0 ? (newUsed / Number(p.budget)) * 100 : 0
      return { ...p, used: newUsed, remaining: newRemaining, pct: newPct, txCount: (p.txCount || 0) + 1 }
    }))
  }, [])
  const updateTransaction = useCallback((id: string, updates: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])
  const deleteTransaction = useCallback((id: string) => {
    const tx = transactions.find(t => t.id === id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    if (tx) {
      setProjects(prev => prev.map(p => {
        if (p.id !== tx.project_id) return p
        const amt = Math.abs(Number(tx.amount))
        const isIn = tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in'
        const newUsed = isIn ? p.used : Math.max(0, p.used - amt)
        const newRemaining = Number(p.budget) - newUsed
        const newPct = Number(p.budget) > 0 ? (newUsed / Number(p.budget)) * 100 : 0
        return { ...p, used: newUsed, remaining: newRemaining, pct: newPct, txCount: Math.max(0, (p.txCount || 1) - 1) }
      }))
    }
  }, [transactions])

  // Categories
  const addCategory = useCallback((cat: any) => {
    setCategories(prev => [...prev, { ...cat, id: nextId() }])
  }, [])
  const updateCategory = useCallback((id: string, updates: any) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])
  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  // Fiscal Years
  const addFiscalYear = useCallback((fy: any) => {
    setFiscalYears(prev => [...prev, { ...fy, id: nextId() }])
  }, [])
  const updateFiscalYear = useCallback((id: string, updates: any) => {
    setFiscalYears(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])
  const deleteFiscalYear = useCallback((id: string) => {
    setFiscalYears(prev => prev.filter(f => f.id !== id))
  }, [])

  // Work Groups
  const addWorkGroup = useCallback((wg: any) => {
    setWorkGroups(prev => [...prev, { ...wg, id: nextId() }])
  }, [])
  const updateWorkGroup = useCallback((id: string, updates: any) => {
    setWorkGroups(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
  }, [])
  const deleteWorkGroup = useCallback((id: string) => {
    setWorkGroups(prev => prev.filter(w => w.id !== id))
  }, [])

  // Settings
  const updateSetting = useCallback((key: string, value: string) => {
    setSettingsMap(prev => ({ ...prev, [key]: value }))
  }, [])

  // Profiles
  const updateProfile = useCallback((id: string, updates: any) => {
    setProfiles(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])
  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(u => u.id !== id))
  }, [])

  return (
    <DemoSandboxContext.Provider value={{
      projects, transactions, categories, fiscalYears, workGroups,
      settings: settingsMap, profiles,
      organizations: DEMO_ORGANIZATIONS,
      addProject, updateProject, deleteProject,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addFiscalYear, updateFiscalYear, deleteFiscalYear,
      addWorkGroup, updateWorkGroup, deleteWorkGroup,
      updateSetting, updateProfile, deleteProfile,
    }}>
      {children}
    </DemoSandboxContext.Provider>
  )
}

export function useDemoSandbox() {
  const ctx = useContext(DemoSandboxContext)
  // Return a no-op sandbox when not inside provider (non-demo mode)
  if (!ctx) {
    const noop = () => {}
    return {
      projects: DEMO_PROJECTS, transactions: DEMO_TRANSACTIONS, categories: DEMO_CATEGORIES,
      fiscalYears: DEMO_FISCAL_YEARS, workGroups: DEMO_WORK_GROUPS, settings: {} as Record<string, string>,
      profiles: DEMO_PROFILES, organizations: DEMO_ORGANIZATIONS,
      addProject: noop, updateProject: noop, deleteProject: noop,
      addTransaction: noop, updateTransaction: noop, deleteTransaction: noop,
      addCategory: noop, updateCategory: noop, deleteCategory: noop,
      addFiscalYear: noop, updateFiscalYear: noop, deleteFiscalYear: noop,
      addWorkGroup: noop, updateWorkGroup: noop, deleteWorkGroup: noop,
      updateSetting: noop, updateProfile: noop, deleteProfile: noop,
    } as DemoSandbox
  }
  return ctx
}

export { DEMO_ORG_ID }
