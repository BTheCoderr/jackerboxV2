import { redirect } from "next/navigation";
import { PaymentFormWrapper } from "@/components/payments/payment-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

interface PaymentPageProps { params: Promise<{ id: string }> }

export default async function PaymentPage({ params }: PaymentPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?callbackUrl=/routes/rentals");

  const { id } = await params;
  const rental = await db.rental.findUnique({
    where: { id },
    include: { equipment: { select: { title: true, owner: { select: { name: true } } } }, payment: true },
  });
  if (!rental || rental.renterId !== user.id) redirect("/routes/rentals");
  if (rental.status !== 'PENDING' || Date.now() - rental.createdAt.getTime() > 30 * 60 * 1000) {
    redirect("/routes/rentals?error=expired");
  }

  const payment = await db.payment.upsert({
    where: { rentalId: rental.id },
    update: {},
    create: {
      amount: Math.round((rental.totalPrice + (rental.securityDeposit ?? 0)) * 100) / 100,
      currency: 'USD',
      status: 'PENDING',
      userId: user.id,
      rentalId: rental.id,
    },
  });

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Your Payment</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold">Rental Details</h2>
          <p>Equipment: {rental.equipment.title}</p>
          <p>Owner: {rental.equipment.owner.name}</p>
          <p>Start: {rental.startDate.toLocaleDateString()}</p>
          <p>End: {rental.endDate.toLocaleDateString()}</p>
          <p>Rental amount: ${rental.totalPrice.toFixed(2)}</p>
          <p>Refundable deposit: ${(rental.securityDeposit ?? 0).toFixed(2)}</p>
          <p className="font-semibold">Pay today: ${(rental.totalPrice + (rental.securityDeposit ?? 0)).toFixed(2)}</p>
          <p className="text-sm text-gray-600">Payment is charged when you complete checkout. The owner can then start your rental.</p>
        </div>
        <PaymentFormWrapper
          rentalId={rental.id}
          paymentId={payment.id}
          amount={rental.totalPrice}
          securityDeposit={rental.securityDeposit ?? 0}
          currency="USD"
        />
      </div>
    </div>
  );
}
