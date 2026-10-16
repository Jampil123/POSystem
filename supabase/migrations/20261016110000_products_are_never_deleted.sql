-- Products are deactivated (is_active = false), never deleted, so old sales,
-- stock history, and receipts always point to a real product.

drop policy "Admins can delete products" on public.products;

revoke delete on public.products from authenticated;
