-- Allow deleting employees referenced by purchasing / contracts (SET NULL instead of block).
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_pic_id_fkey;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_pic_id_fkey
  FOREIGN KEY (pic_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.purchasing_items
  DROP CONSTRAINT IF EXISTS purchasing_items_pic_id_fkey;
ALTER TABLE public.purchasing_items
  ADD CONSTRAINT purchasing_items_pic_id_fkey
  FOREIGN KEY (pic_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.purchasing_items
  DROP CONSTRAINT IF EXISTS purchasing_items_created_by_id_fkey;
ALTER TABLE public.purchasing_items
  ADD CONSTRAINT purchasing_items_created_by_id_fkey
  FOREIGN KEY (created_by_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.purchasing_items
  DROP CONSTRAINT IF EXISTS purchasing_items_approved_by_id_fkey;
ALTER TABLE public.purchasing_items
  ADD CONSTRAINT purchasing_items_approved_by_id_fkey
  FOREIGN KEY (approved_by_id) REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS shipments_pic_id_fkey;
ALTER TABLE public.shipments
  ADD CONSTRAINT shipments_pic_id_fkey
  FOREIGN KEY (pic_id) REFERENCES public.employees(id) ON DELETE SET NULL;
