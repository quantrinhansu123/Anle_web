-- Tên khách hiển thị trên báo giá (tách khỏi tên công ty + người liên hệ)

alter table sales
  add column if not exists customer_trade_name text;
