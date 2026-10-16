import { useState } from 'react'
import { ReceiptText, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useRole } from '@/features/auth/hooks/useRole'
import {
  emptyTransactionFilters,
  PAGE_SIZE,
  type TransactionFilters as Filters,
} from '@/features/transactions/api'
import { Pagination } from '@/features/transactions/components/Pagination'
import { TransactionDetails } from '@/features/transactions/components/TransactionDetails'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'

// Cashiers see only their own sales (database security rules); admins see all.
export default function TransactionsPage() {
  const { isAdmin } = useRole()
  const [filters, setFilters] = useState<Filters>(emptyTransactionFilters)
  const [page, setPage] = useState(0)
  const [openSaleId, setOpenSaleId] = useState<number | null>(null)
  const transactions = useTransactions(filters, page)

  function changeFilters(changes: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...changes }))
    setPage(0)
  }

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(emptyTransactionFilters)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={isAdmin ? 'Transactions' : 'My transactions'} />

      <TransactionFilters filters={filters} onChange={changeFilters} showCashierFilter={isAdmin} />

      {transactions.isPending ? (
        <ListSkeleton rows={8} />
      ) : transactions.isError ? (
        <ErrorState
          message="Could not load the transactions."
          onRetry={() => void transactions.refetch()}
        />
      ) : transactions.data.transactions.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : ReceiptText}
          message={hasFilters ? 'No transactions match the filters.' : 'No transactions yet.'}
        />
      ) : (
        <>
          <TransactionTable transactions={transactions.data.transactions} onOpen={setOpenSaleId} />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={transactions.data.total}
            isLoading={transactions.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <TransactionDetails saleId={openSaleId} onClose={() => setOpenSaleId(null)} />
    </div>
  )
}
