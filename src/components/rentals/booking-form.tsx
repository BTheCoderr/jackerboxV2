"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Equipment } from "@prisma/client";
import { formatCurrency, formatDateRange } from "@/lib/utils/format";
import { differenceInDays, differenceInHours, addDays } from "date-fns";

// Define the minimum booking schema
const bookingSchema = z.object({
  startDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "Start date must be today or later"),
  endDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "End date is required"),
  rentalType: z.enum(["hourly", "daily", "weekly"]),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  equipment: Equipment & {
    owner: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
}

export function BookingForm({ equipment }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const router = useRouter();

  // Set default rental type based on available rates
  const defaultRentalType = equipment.dailyRate 
    ? "daily" 
    : equipment.hourlyRate 
      ? "hourly" 
      : "weekly";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: addDays(new Date(), 1).toISOString().split("T")[0],
      rentalType: defaultRentalType,
    },
  });

  // Watch form values to calculate price
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const rentalType = watch("rentalType");

  // Calculate total price when form values change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end > start) {
        let price = 0;

        if (rentalType === "hourly" && equipment.hourlyRate) {
          const hours = Math.max(1, differenceInHours(end, start));
          price = hours * equipment.hourlyRate;
        } else if (rentalType === "daily" && equipment.dailyRate) {
          const days = Math.max(1, differenceInDays(end, start));
          price = days * equipment.dailyRate;
        } else if (rentalType === "weekly" && equipment.weeklyRate) {
          const days = differenceInDays(end, start);
          const weeks = Math.max(1, Math.ceil(days / 7));
          price = weeks * equipment.weeklyRate;
        }

        setTotalPrice(price);
      }
    }
  }, [startDate, endDate, rentalType, equipment]);

  const onSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId: equipment.id,
          startDate: data.startDate,
          endDate: data.endDate,
          rentalType: data.rentalType,
          totalPrice: totalPrice,
          securityDeposit: equipment.securityDeposit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create rental");
      }

      const responseData = await response.json();
      
      // Redirect to the payment page with the rental ID
      router.push(`/routes/payments/checkout?rentalId=${responseData.rental.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="rentalType" className="text-sm font-medium text-gray-700">
          Rental Type
        </label>
        <select
          id="rentalType"
          {...register("rentalType")}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
          disabled={isLoading}
        >
          {equipment.hourlyRate && (
            <option value="hourly">Hourly ({formatCurrency(equipment.hourlyRate)}/hour)</option>
          )}
          {equipment.dailyRate && (
            <option value="daily">Daily ({formatCurrency(equipment.dailyRate)}/day)</option>
          )}
          {equipment.weeklyRate && (
            <option value="weekly">Weekly ({formatCurrency(equipment.weeklyRate)}/week)</option>
          )}
        </select>
        {errors.rentalType && (
          <p className="text-red-500 text-xs mt-1">{errors.rentalType.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            {...register("startDate")}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
            disabled={isLoading}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            {...register("endDate")}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-jacker-blue focus:border-jacker-blue"
            disabled={isLoading}
            min={startDate}
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {totalPrice !== null && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rental Period:</span>
            <span className="text-gray-800">
              {startDate && endDate && (
                formatDateRange(new Date(startDate), new Date(endDate))
              )}
            </span>
          </div>
          <div className="flex justify-between font-medium mt-2">
            <span>Total Price:</span>
            <span className="text-jacker-blue font-bold">{formatCurrency(totalPrice)}</span>
          </div>
          {equipment.securityDeposit && (
            <div className="flex justify-between text-sm mt-1 text-gray-600">
              <span>Security Deposit:</span>
              <span>{formatCurrency(equipment.securityDeposit)}</span>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-jacker-orange text-white rounded-md hover:bg-opacity-90 transition-colors"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Book Now"}
      </button>
    </form>
  );
} 