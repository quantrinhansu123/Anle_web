-- Add status field to purchasing_items

ALTER TABLE purchasing_items
ADD COLUMN status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
