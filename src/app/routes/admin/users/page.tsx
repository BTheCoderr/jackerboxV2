import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import Link from "next/link";
import { Prisma } from "@prisma/client";

interface AdminUsersPageProps {
  searchParams: {
    verified?: string;
    role?: string;
    search?: string;
    page?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  // Build where clause based on filters
  let whereClause: Prisma.UserWhereInput = {};
  
  if (searchParams.verified) {
    whereClause.idVerified = searchParams.verified === "true";
  }
  
  if (searchParams.role) {
    if (searchParams.role === "admin") {
      whereClause.isAdmin = true;
    } else if (searchParams.role === "user") {
      whereClause.isAdmin = false;
    }
  }
  
  if (searchParams.search) {
    whereClause.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { email: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }
  
  // Fetch users with pagination
  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            equipment: true,
            rentals: true,
          },
        },
      },
      skip,
      take: pageSize,
    }),
    db.user.count({ where: whereClause }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Get verification stats
  const verificationStats = await db.user.groupBy({
    by: ['idVerificationStatus'],
    _count: true,
  });
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex space-x-4">
          <Link
            href="/routes/admin/users/export"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Export Users
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="p-2 border rounded-md"
          onChange={(e) => {
            const url = new URL(window.location.href);
            url.searchParams.set("verified", e.target.value);
            window.location.href = url.toString();
          }}
          value={searchParams.verified || ""}
        >
          <option value="">All Verification Status</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>
        
        <select
          className="p-2 border rounded-md"
          onChange={(e) => {
            const url = new URL(window.location.href);
            url.searchParams.set("role", e.target.value);
            window.location.href = url.toString();
          }}
          value={searchParams.role || ""}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        
        <div className="md:col-span-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const searchValue = formData.get("search") as string;
              
              const url = new URL(window.location.href);
              url.searchParams.set("search", searchValue);
              window.location.href = url.toString();
            }}
            className="flex"
          >
            <input
              type="text"
              name="search"
              placeholder="Search by name or email"
              className="flex-1 p-2 border rounded-l-md"
              defaultValue={searchParams.search || ""}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-jacker-blue text-white rounded-r-md hover:bg-opacity-90"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      
      {/* Verification Stats */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">ID Verification Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {verificationStats.map((stat) => {
            const status = stat.idVerificationStatus || "unknown";
            const statusColor = 
              status === "approved" ? "bg-green-100 text-green-800" :
              status === "pending" ? "bg-yellow-100 text-yellow-800" :
              status === "requires_input" ? "bg-orange-100 text-orange-800" :
              status === "canceled" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800";
            
            return (
              <div
                key={status}
                className="p-4 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="text-2xl font-bold">{stat._count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rentals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt={user.name || ""} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isAdmin
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.idVerified
                        ? "bg-green-100 text-green-800"
                        : user.idVerificationStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : user.idVerificationStatus === "requires_input"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.idVerified
                        ? "Verified"
                        : user.idVerificationStatus
                        ? user.idVerificationStatus.charAt(0).toUpperCase() + user.idVerificationStatus.slice(1)
                        : "Not Verified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user._count.equipment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user._count.rentals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/routes/admin/users/${user.id}`}
                      className="text-jacker-blue hover:underline mr-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {skip + 1} to {Math.min(skip + pageSize, totalCount)} of {totalCount} users
            </div>
            <div className="flex space-x-2">
              {page > 1 && (
                <Link
                  href={{
                    pathname: "/routes/admin/users",
                    query: {
                      ...searchParams,
                      page: page - 1,
                    },
                  }}
                  className="px-3 py-1 border rounded-md hover:bg-gray-100"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={{
                    pathname: "/routes/admin/users",
                    query: {
                      ...searchParams,
                      page: page + 1,
                    },
                  }}
                  className="px-3 py-1 border rounded-md hover:bg-gray-100"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 