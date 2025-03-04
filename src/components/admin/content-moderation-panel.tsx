"use client";

interface ContentModerationPanelProps {
  stats: {
    moderationStatus: string;
    _count: number;
  }[];
}

export function ContentModerationPanel({ stats }: ContentModerationPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "flagged":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const totalItems = stats.reduce((acc, stat) => acc + stat._count, 0);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Content Moderation Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.moderationStatus}
            className="p-4 rounded-lg border"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(stat.moderationStatus)}`}>
                {stat.moderationStatus}
              </span>
              <span className="text-2xl font-bold">{stat._count}</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getStatusColor(stat.moderationStatus)}`}
                  style={{
                    width: `${(stat._count / totalItems) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((stat._count / totalItems) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Automatic Moderation</h3>
            <p className="text-xs text-gray-500">
              Using AI to detect inappropriate content and verify images
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Active
            </span>
            <button
              className="text-xs text-jacker-blue hover:underline"
              onClick={() => window.location.href = "/routes/admin/settings/moderation"}
            >
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 