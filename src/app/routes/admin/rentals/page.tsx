import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

interface AdminRentalsPageProps {
  searchParams: {
    status?: string;
    search?: string;
    page?: string;
  };
}

export default async function AdminRentalsPage({ searchParams }: AdminRentalsPageProps) {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  
  // Build filter conditions
  const where: any = {};
  
  if (searchParams.status) {
    where.status = searchParams.status;
  }
  
  if (searchParams.search) {
    where.OR = [
      {
        equipment: {
          title: {
            contains: searchParams.search,
            mode: 'insensitive',
          },
        },
      },
      {
        renter: {
          name: {
            contains: searchParams.search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }
  
  // Fetch rentals with pagination
  const rentals = await db.rental.findMany({
    where,
    include: {
      equipment: {
        include: {
          owner: true
        }
      },
      renter: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: pageSize,
  });
  
  // Get total count for pagination
  const totalCount = await db.rental.count({ where });
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rental Management</h1>
        <div className="flex gap-2">
          <Link 
            href="/routes/admin/rentals/export" 
            className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700"
          >
            Export Data
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={searchParams.status || ""}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              defaultValue={searchParams.search || ""}
              placeholder="Search by equipment, renter, or owner"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-jacker-blue focus:ring-jacker-blue"
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-jacker-blue text-white rounded-md hover:bg-blue-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>
      
      {/* Rentals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Renter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No rentals found
                  </td>
                </tr>
              ) : (
                rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rental.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/routes/admin/equipment/${rental.equipmentId}`} className="text-jacker-blue hover:underline">
                        {rental.equipment.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/routes/admin/users/${rental.renterId}`} className="text-jacker-blue hover:underline">
                        {rental.renter.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/routes/admin/users/${rental.equipment.owner.id}`} className="text-jacker-blue hover:underline">
                        {rental.equipment.owner.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rental.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        rental.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                        rental.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                        rental.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        rental.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rental.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(rental.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/routes/admin/rentals/${rental.id}`} className="text-jacker-blue hover:underline mr-4">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{skip + 1}</span> to{" "}
                <span className="font-medium">{Math.min(skip + pageSize, totalCount)}</span> of{" "}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {page > 1 && (
                <Link
                  href={{
                    pathname: "/routes/admin/rentals",
                    query: {
                      ...searchParams,
                      page: page - 1,
                    },
                  }}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={{
                    pathname: "/routes/admin/rentals",
                    query: {
                      ...searchParams,
                      page: page + 1,
                    },
                  }}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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