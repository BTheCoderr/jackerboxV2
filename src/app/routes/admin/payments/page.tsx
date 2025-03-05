export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, ExtendedUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProcessPayoutButton } from "@/components/admin/process-payout-button";
import { RefundSecurityDepositButton } from "@/components/admin/refund-security-deposit-button";

// Define extended types to include the fields that exist in the schema but TypeScript doesn't recognize
interface ExtendedPayment {
  ownerPaidOut?: boolean;
  securityDepositAmount?: number;
  securityDepositReturned?: boolean;
  rental?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PaymentsPageProps {
  searchParams: {
    status?: string;
    page?: string;
  };
}

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  const user = await getCurrentUser();
  
  // Check if user is admin
  if (!user || !user.isAdmin) {
    redirect("/");
  }
  
  // Parse query parameters
  const status = searchParams.status || "all";
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  
  // Build the query
  const where = status !== "all" ? { status: status.toUpperCase() } : {};
  
  // Get payments with pagination
  const payments = await db.payment.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      rental: {
        include: {
          equipment: true,
          renter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  // Get total count for pagination
  const totalPayments = await db.payment.count({ where });
  const totalPages = Math.ceil(totalPayments / pageSize);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // When rendering the security deposit refund button, use a helper function to check conditions
  function shouldShowRefundButton(payment: any): boolean {
    const extPayment = payment as ExtendedPayment;
    return (
      payment.status === "COMPLETED" &&
      extPayment.securityDepositAmount !== undefined &&
      extPayment.securityDepositAmount > 0 &&
      extPayment.securityDepositReturned === false &&
      payment.rental !== undefined &&
      payment.rental.id !== undefined
    );
  }

  // When rendering the process payout button, use a helper function to check conditions
  function shouldShowPayoutButton(payment: any): boolean {
    const extPayment = payment as ExtendedPayment;
    return (
      payment.status === "COMPLETED" &&
      extPayment.ownerPaidOut === false &&
      payment.rental !== undefined &&
      payment.rental.id !== undefined
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <Link href="/routes/admin" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b">
          <div className="flex space-x-2">
            <Link
              href="/routes/admin/payments"
              className={`px-3 py-1 rounded-md ${
                status === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
              }`}
            >
              All
            </Link>
            <Link
              href="/routes/admin/payments?status=pending"
              className={`px-3 py-1 rounded-md ${
                status === "pending" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
              }`}
            >
              Pending
            </Link>
            <Link
              href="/routes/admin/payments?status=completed"
              className={`px-3 py-1 rounded-md ${
                status === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
              }`}
            >
              Completed
            </Link>
            <Link
              href="/routes/admin/payments?status=failed"
              className={`px-3 py-1 rounded-md ${
                status === "failed" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
              }`}
            >
              Failed
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Renter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/routes/equipment/${payment.rental.equipment.id}`} className="hover:underline">
                      {payment.rental.equipment.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.user.name || payment.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status === "COMPLETED" ? (
                      (payment as ExtendedPayment).ownerPaidOut ? (
                        <span className="text-green-600">Paid</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/routes/rentals/${payment.rental.id}`} className="text-blue-600 hover:underline mr-3">
                      View Rental
                    </Link>
                    
                    {shouldShowPayoutButton(payment) && (
                      <ProcessPayoutButton 
                        rentalId={payment.rental.id}
                        paymentId={payment.id}
                      />
                    )}

                    {shouldShowRefundButton(payment) && (
                      <>
                        {shouldShowPayoutButton(payment) && <span className="mx-2">|</span>}
                        <RefundSecurityDepositButton 
                          rentalId={payment.rental.id}
                          securityDepositAmount={(payment as ExtendedPayment).securityDepositAmount || 0}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
              
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 flex justify-between items-center border-t">
            <div>
              <p className="text-sm text-gray-500">
                Showing {skip + 1}-{Math.min(skip + pageSize, totalPayments)} of {totalPayments} payments
              </p>
            </div>
            <div className="flex space-x-2">
              {page > 1 && (
                <Link
                  href={`/routes/admin/payments?status=${status}&page=${page - 1}`}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/routes/admin/payments?status=${status}&page=${page + 1}`}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 