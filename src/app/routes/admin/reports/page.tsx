import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, ExtendedUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  
  // Group payments by month
  const paymentsByMonth: Record<string, number> = {};
  
  payments.forEach(payment => {
    if (payment.status === "COMPLETED") {
      const month = new Date(payment.createdAt).toLocaleString('default', { month: 'short' });
      paymentsByMonth[month] = (paymentsByMonth[month] || 0) + payment.amount;
    }
  });
  
  const monthlyRevenueData = Object.entries(paymentsByMonth).map(([month, amount]) => ({
    month,
    amount: Number(amount.toFixed(2))
  }));
  
  // Payment status distribution
  const paymentStatusCounts: Record<string, number> = {};
  
  payments.forEach(payment => {
    paymentStatusCounts[payment.status] = (paymentStatusCounts[payment.status] || 0) + 1;
  });
  
  const paymentStatusData = Object.entries(paymentStatusCounts).map(([status, count]) => ({
    status,
    count
  }));
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex space-x-4">
          <Link href="/routes/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
          <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Export PDF
          </button>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="amount" name="Revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Payment Status Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
    </div>
  );
} 