import Image from "next/image";
import { formatPrice } from "@/lib/catalog";
import type { OrderWithItems } from "@/lib/orders";

/** The lines of a placed order, with its total. Shared by the confirmation and account pages. */
export function OrderItems({ order }: { order: OrderWithItems }) {
  return (
    <>
      <ul className="divider">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b py-4">
            <div className="media-product w-16 shrink-0 self-start">
              <Image src={item.image} alt="" fill sizes="4rem" />
            </div>
            <div className="min-w-0 flex-1">
              <p>{item.name}</p>
              <p className="text-caption text-muted mt-1">
                {item.color}
                {item.size && <> &middot; Size {item.size}</>} &middot; Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0 tabular-nums">
              {formatPrice(item.unitPriceCents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-4 pt-4">
        <span className="text-label">Total</span>
        <span className="text-lead tabular-nums">{formatPrice(order.totalCents)}</span>
      </p>
    </>
  );
}
