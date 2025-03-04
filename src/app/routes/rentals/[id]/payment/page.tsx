import { redirect } from "next/navigation";
import { PaymentFormWrapper } from "@/components/payments/payment-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { formatAmountFromStripe } from "@/lib/stripe";

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect("/auth/login?callbackUrl=/rentals");
  }

  const rental = await db.rental.findUnique({
    where: {
      id: params.id,
      renterId: currentUser.id,
    },
    include: {
      equipment: {
        include: {
          owner: true,
        },
      },
      payment: true,
    },
  });

  if (!rental) {
    redirect("/rentals?error=rental-not-found");
  }

  if (rental.status !== "Pending") {
    redirect(`/rentals?error=invalid-status&status=${rental.status}`);
  }

  // Calculate total amount including security deposit
  const totalAmount = rental.totalPrice;
  const securityDeposit = rental.securityDeposit || 0;
  const totalWithDeposit = totalAmount + securityDeposit;

  if (!rental.payment) {
    // Create a payment record if it doesn't exist
    const payment = await db.payment.create({
      data: {
        amount: totalAmount, // Just the rental amount initially
        currency: "USD",
        status: "Pending",
        userId: currentUser.id,
        rentalId: rental.id,
      },
    });

    // Refresh the page to get the payment
    redirect(`/routes/rentals/${rental.id}/payment`);
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Rental Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Equipment:</span> {rental.equipment.title}</p>
              <p><span className="font-medium">Owner:</span> {rental.equipment.owner.name}</p>
              <p><span className="font-medium">Start Date:</span> {new Date(rental.startDate).toLocaleDateString()}</p>
              <p><span className="font-medium">End Date:</span> {new Date(rental.endDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Rental Price:</span> ${rental.totalPrice.toFixed(2)}</p>
              {rental.securityDeposit && rental.securityDeposit > 0 && (
                <>
                  <p><span className="font-medium">Security Deposit:</span> ${rental.securityDeposit.toFixed(2)}</p>
                  <p className="font-medium mt-2">Total Amount: ${totalWithDeposit.toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your payment is processed securely through Stripe. We do not store your card details.
            </p>
            {rental.securityDeposit && rental.securityDeposit > 0 && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                <p className="font-medium mb-1">About Your Security Deposit</p>
                <p>The security deposit of ${rental.securityDeposit.toFixed(2)} will be held and returned to you after the rental period, assuming the equipment is returned in the same condition.</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              You will only be charged once the owner approves your rental request.
            </p>
          </div>
        </div>
        
        <div>
          <PaymentFormWrapper
            rentalId={rental.id}
            paymentId={rental.payment.id}
            amount={totalAmount}
            securityDeposit={securityDeposit}
            currency="USD"
            onCancel={() => redirect("/rentals")}
          />
        </div>
      </div>
    </div>
  );
} 