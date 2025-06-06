export const dynamic = 'force-dynamic';

import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { EquipmentBulkActions } from "@/components/admin/equipment-bulk-actions";
import { ContentModerationPanel } from "@/components/admin/content-moderation-panel";
import { Prisma, ModerationStatus } from "@prisma/client";
import { EquipmentFilters } from "@/components/admin/equipment-filters";

interface AdminEquipmentPageProps {
  searchParams: {
    category?: string;
    status?: string;
    moderation?: string;
    page?: string;
  };
}

export default async function AdminEquipmentPage({ searchParams }: AdminEquipmentPageProps) {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  // Build where clause based on filters
  let whereClause: Prisma.EquipmentWhereInput = {};
  
  if (searchParams.category) {
    whereClause.category = searchParams.category;
  }
  
  if (searchParams.status) {
    whereClause.isAvailable = searchParams.status === "available";
  }
  
  if (searchParams.moderation) {
    whereClause.moderationStatus = searchParams.moderation.toUpperCase() as ModerationStatus;
  }
  
  // Fetch equipment with pagination
  const [equipment, totalCount] = await Promise.all([
    db.equipment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rentals: true,
          },
        },
      },
      skip,
      take: pageSize,
    }),
    db.equipment.count({ where: whereClause }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Get moderation stats
  const moderationStats = await db.equipment.groupBy({
    by: ['moderationStatus'],
    _count: true,
  });
  
  // Convert to serializable format
  const serializedStats = moderationStats.map(stat => ({
    moderationStatus: stat.moderationStatus,
    count: stat._count,
  }));
  
  // Convert equipment to serializable format
  const serializedEquipment = equipment.map(item => ({
    id: item.id,
    title: item.title,
    category: item.category,
    isAvailable: item.isAvailable,
    moderationStatus: item.moderationStatus,
    rentalsCount: item._count.rentals,
    owner: {
      id: item.owner.id,
      name: item.owner.name,
      email: item.owner.email
    }
  }));
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Equipment Management</h1>
        <div className="flex space-x-4">
          <Link
            href="/routes/admin/equipment/export"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Export Data
          </Link>
          <Link
            href="/routes/admin/equipment/import"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Import Data
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <EquipmentFilters 
        searchParams={searchParams} 
        categories={EQUIPMENT_CATEGORIES} 
      />
      
      {/* Content Moderation Panel */}
      <ContentModerationPanel stats={serializedStats} />
      
      {/* Equipment Table with Bulk Actions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <EquipmentBulkActions />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moderation
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
              {serializedEquipment.map((item) => (
                <tr key={item.id} data-equipment-id={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/routes/equipment/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/routes/admin/users/${item.owner.id}`} className="hover:underline">
                      {item.owner.name || item.owner.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.moderationStatus === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : item.moderationStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.moderationStatus === "FLAGGED"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {item.moderationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.rentalsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/routes/admin/equipment/${item.id}`}
                      className="text-jacker-blue hover:underline mr-4"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {skip + 1} to {Math.min(skip + serializedEquipment.length, totalCount)} of {totalCount} results
            </p>
            <div className="space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={{
                    pathname: "/routes/admin/equipment",
                    query: {
                      ...searchParams,
                      page: pageNum,
                    },
                  }}
                  className={`px-3 py-1 rounded-md ${
                    page === pageNum
                      ? "bg-jacker-blue text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 