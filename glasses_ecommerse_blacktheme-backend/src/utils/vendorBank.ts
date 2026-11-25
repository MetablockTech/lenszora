// A vendor can be paid only once real bank details (or a UPI id) are saved.
// Vendors created without them get 'TBD' placeholders, which don't count.
const filled = (v: any) => {
  const s = String(v ?? '').trim()
  return s !== '' && s.toUpperCase() !== 'TBD'
}

export function hasValidBankDetails(vendor: any): boolean {
  const b = vendor?.bankDetails || {}
  const bankAccount = filled(b.accountHolderName) && filled(b.accountNumber) && filled(b.bankName) && filled(b.ifscCode)
  return bankAccount || filled(b.upiId)
}

/** Bank details safe to show in the vendor dashboard (account number masked), or null when not set */
export function maskedBankDetails(vendor: any) {
  if (!hasValidBankDetails(vendor)) return null
  const b = vendor.bankDetails || {}
  const acc = String(b.accountNumber || '')
  return {
    accountHolderName: filled(b.accountHolderName) ? b.accountHolderName : '',
    bankName: filled(b.bankName) ? b.bankName : '',
    accountNumber: filled(acc) ? `****${acc.slice(-4)}` : '',
    ifscCode: filled(b.ifscCode) ? b.ifscCode : '',
    upiId: filled(b.upiId) ? b.upiId : ''
  }
}

export const NO_BANK_DETAILS_MESSAGE = 'Add your bank account (or UPI ID) in Profile → Payout Settings before requesting a payout.'
