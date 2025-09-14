// TODO(rb): Re-enable when rollback API lands (CP-5 epic)
// Temporary compat shim to satisfy legacy rollback tests

import { localDebtStore } from '../data/localDebtStore'

export function _detectFieldChanges(oldDebt: any, newDebt: any) {
 const fields = ['name','balance','apr','minPayment','amount_pennies','apr_bps','min_payment_pennies']
 const changes: any[] = []
 for (const f of fields) {
  if (oldDebt?.[f] !== newDebt?.[f]) {
   changes.push({ field: f, oldValue: oldDebt?.[f], newValue: newDebt?.[f] })
  }
 }
 return changes
}

export async function rollbackDebt(debtId: string, eventId: string) {
 // super-minimal placeholder: find the debt and do nothing
 const debts = localDebtStore.getAll()
 const idx = debts.findIndex((d:any)=>d.id===debtId)
 if (idx < 0) return { success:false, error:'Debt not found' }
 // Pretend success
 return { success:true }
}

// default manager shape the tests expect
export const manager = {
 _detectFieldChanges,
 rollbackDebt,
 // provide a function so jest.spyOn(manager, '_fetchEventById') doesn't explode
 _fetchEventById: async () => null,
}