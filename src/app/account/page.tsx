import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OrderItems } from "@/components/order-items";
import { formatOrderNumber, getPaidOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <main id="main" className="prose-container section flex-1">
      <p className="text-eyebrow text-muted">My account</p>
      {/* The session is read per request, so the details stream in behind the boundary. */}
      <Suspense fallback={<AccountSkeleton />}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const orders = await getPaidOrdersForUser(user.id);
  const orderDate = new Intl.DateTimeFormat("en", { dateStyle: "long" });

  const memberSince = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    user.createdAt,
  );

  return (
    <>
      <h1 className="heading-headline mt-4">Welcome, {user.name}</h1>
      <dl className="divider mt-10">
        {[
          ["Name", user.name],
          ["Email", user.email],
          ["Member since", memberSince],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-6 border-b py-4">
            <dt className="text-label text-muted">{label}</dt>
            <dd className="min-w-0 text-right break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-label="Your orders" className="mt-section">
        <h2 className="heading-title">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted mt-4">You haven&rsquo;t placed any orders yet.</p>
        ) : (
          <ul className="mt-6 space-y-10">
            {orders.map((order) => (
              <li key={order.id}>
                <p className="text-eyebrow text-muted mb-3 flex justify-between gap-4">
                  <span>Order {formatOrderNumber(order.id)}</span>
                  {order.paidAt && <time dateTime={order.paidAt.toISOString()}>{orderDate.format(order.paidAt)}</time>}
                </p>
                <OrderItems order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-section">
        <SignOutButton />
      </div>
    </>
  );
}

function AccountSkeleton() {
  const bar = "animate-pulse bg-surface";
  return (
    <div aria-busy="true" aria-label="Loading your account">
      <div className={`mt-4 h-10 w-64 max-w-full ${bar}`} />
      <div className={`mt-10 h-40 ${bar}`} />
    </div>
  );
}
