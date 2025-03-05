export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Define extended types to include the fields that exist in the schema but TypeScript doesn't recognize
interface ExtendedPayment {
  platformFee?: number;
  ownerPaidOut?: boolean;
  ownerPaidOutAmount?: number;
  securityDepositAmount?: number;
  securityDepositReturned?: boolean;
  [key: string]: any;
}

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  
  // Check if user is admin
  if (!user || !user.isAdmin) {
    redirect("/");
  }
  
  // Get payment statistics
  const payments = await db.payment.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) // Last 3 months
      }
    },
    include: {
      rental: true
    }
  });
  
  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => {
    if (payment.status === "COMPLETED") {
      return sum + payment.amount;
    }
    return sum;
  }, 0);
  
  // Calculate platform fees
  const totalPlatformFees = payments.reduce((sum, payment) => {
    if (payment.status === "COMPLETED" && (payment as ExtendedPayment).platformFee) {
      return sum + ((payment as ExtendedPayment).platformFee || 0);
    }
    return sum;
  }, 0);
  
  // Calculate owner payouts
  const totalOwnerPayouts = payments.reduce((sum, payment) => {
    if (payment.status === "COMPLETED" && (payment as ExtendedPayment).ownerPaidOut && (payment as ExtendedPayment).ownerPaidOutAmount) {
      return sum + ((payment as ExtendedPayment).ownerPaidOutAmount || 0);
    }
    return sum;
  }, 0);
  
  // Calculate security deposits
  const totalSecurityDeposits = payments.reduce((sum, payment) => {
    if (payment.status === "COMPLETED" && (payment as ExtendedPayment).securityDepositAmount) {
      return sum + ((payment as ExtendedPayment).securityDepositAmount || 0);
    }
    return sum;
  }, 0);
  
  // Calculate returned security deposits
  const totalReturnedDeposits = payments.reduce((sum, payment) => {
    if (payment.status === "COMPLETED" && (payment as ExtendedPayment).securityDepositReturned && (payment as ExtendedPayment).securityDepositAmount) {
      return sum + ((payment as ExtendedPayment).securityDepositAmount || 0);
    }
    return sum;
  }, 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex space-x-4">
          <Link href="/routes/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Platform Fees</h2>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalPlatformFees)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Owner Payouts</h2>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalOwnerPayouts)}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Security Deposits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium mb-2">Total Security Deposits</h3>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalSecurityDeposits)}</p>
          </div>
          <div>
            <h3 className="text-md font-medium mb-2">Returned Security Deposits</h3>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReturnedDeposits)}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rental ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.slice(0, 10).map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                        payment.status === 'DISPUTED' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <Link href={`/routes/rentals/${payment.rentalId}`}>
                      {payment.rentalId.substring(0, 8)}...
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700">
          Charts are temporarily unavailable. We're working on updating the visualization library to be compatible with the latest React version.
        </p>
      </div>
    </div>
  );
} 