import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
// import html2pdf from 'html2pdf.js';
import { salesService } from '../../services/salesService';
import { formatDate } from '../../lib/utils';

interface QuotationData {
  referenceNo: string;
  customer: string;
  service: string;
  commodities: string;
  volume: string;
  term: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  vessel: string;
  date: string;
  items: Array<{
    description: string;
    rate: number;
    quantity: number | string;
    unit: string;
    total: number;
  }>;
  currency: string;
}

const HoadonAnle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const item = await salesService.getSalesItemById(id);
        if (item) {
          // Map SalesItem (from DB) to QuotationData (for UI)
          const mapped: QuotationData = {
            referenceNo: item.id.slice(0, 10).toUpperCase(),
            customer: item.shipments?.customers?.company_name || 'Individual / Regular',
            service: 'Logistics Service',
            commodities: item.description,
            volume: `${item.quantity} ${item.unit}`,
            term: 'N/A',
            pol: item.shipments?.pol || 'N/A',
            pod: item.shipments?.pod || 'N/A',
            etd: formatDate(item.shipments?.etd),
            eta: formatDate(item.shipments?.eta),
            vessel: 'N/A',
            date: `Ngày ${formatDate(new Date())}`,
            currency: item.currency,
            items: [
              {
                description: item.description,
                rate: item.rate,
                quantity: item.quantity,
                unit: item.unit,
                total: item.total
              }
              // We could potentially fetch all items for the SAME shipment here if needed
            ]
          };
          setData(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch quotation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[13px] font-bold text-muted-foreground animate-pulse">Đang tải báo giá...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-100/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy dữ liệu</h3>
          <p className="text-[13px] text-muted-foreground mb-6">Xin lỗi, chúng tôi không thể tìm thấy thông báo báo giá này trong hệ thống.</p>
          <button onClick={() => navigate(-1)} className="w-full py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all">Quay lại</button>
        </div>
      </div>
    );
  }

  const totalAmount = data.items.reduce((sum, item) => sum + item.total, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      {/* Action Toolbar - Hidden during print */}
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-border hover:bg-gray-50 transition-all font-bold text-[13px]"
        >
          <ArrowLeft size={16} />
          Trở về
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all font-bold text-[13px]"
          >
            <Printer size={16} />
            In Báo Giá
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div 
        className="bg-white w-[800px] mx-auto shadow-lg px-12 py-10 min-h-[1131px] relative print:shadow-none print:w-full print:px-8 print:py-6 overflow-hidden"
      >
        
        {/* Custom Styles for Print */}
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-theme-red { color: #f24b43; }
          .border-theme-red { border-color: #f24b43; }
          .bg-theme-red { background-color: #f24b43; }
          
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-no-break {
              break-inside: avoid;
            }
          }
        `}} />

        {/* Header */}
        <header className="flex justify-between items-start mb-6">
          {/* Logo Section */}
          <div className="w-48 pt-2">
            <img 
              src="https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fe6a56fae.%E1%BA%A2nh.064359.png" 
              alt="ANLE-SCM Logo" 
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Company Info Section */}
          <div className="text-right text-[9px] text-gray-500 uppercase tracking-widest leading-[1.6]">
            <p className="font-semibold text-gray-700">CÔNG TY TNHH ANLE-SCM</p>
            <p>0519055056</p>
            <p>MGM@ANLE-SCM.COM</p>
            <p>ANLE-SCM.COM/HOME</p>
            <p>NO 1L, 7L STREET, TAN THUAN WARD, HO CHI MINH CITY, VIETNAM</p>
          </div>
        </header>

        {/* Divider */}
        <div className="relative w-full mb-8 text-center">
          <div className="border-t border-dashed border-gray-300 absolute w-full top-0 left-0"></div>
          <div className="py-2 text-[10px] text-gray-400 tracking-[0.2em] uppercase font-medium">
            ANLE-SUPPLY CHAIN MANAGEMENT
          </div>
          <div className="border-b border-gray-300 absolute w-full bottom-0 left-0"></div>
        </div>

        {/* Title & Date */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-theme-red text-center uppercase tracking-wide">
            Báo giá dịch vụ logistics
          </h1>
          <div className="text-right font-semibold text-sm mt-3 text-black">
            {data.date}
          </div>
        </div>

        {/* Section 1: Thông tin chung */}
        <div className="mb-8 print-no-break">
          <h2 className="text-theme-red uppercase font-bold text-sm mb-2">Thông tin chung</h2>
          
          {/* Information Grid */}
          <div className="border-t border-b border-theme-red grid grid-cols-2 relative py-2">
            {/* Vertical Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#f24b43]"></div>

            {/* Left Column */}
            <div className="pr-6 space-y-2 text-black text-[13px]">
              <p>Mã Báo Giá <i className="text-gray-500 font-normal">(Reference No.)</i> <span className="font-bold">{data.referenceNo}</span></p>
              <p>Khách hàng <i className="text-gray-500 font-normal">(Customer)</i> <span className="font-bold">{data.customer}</span></p>
              <p>Dịch vụ <i className="text-gray-500 font-normal">(Service)</i> <span className="font-bold">{data.service}</span></p>
              <p>Mặt hàng <i className="text-gray-500 font-normal">(Commodities)</i> <span className="font-bold">{data.commodities}</span></p>
              <p>Khối lượng <i className="text-gray-500 font-normal">(Volume)</i> <span className="font-bold">{data.volume}</span></p>
              <p>Điều kiện <i className="text-gray-500 font-normal">(Term)</i> <span className="font-bold">{data.term}</span></p>
            </div>

            {/* Right Column */}
            <div className="pl-6 space-y-2 text-black text-[13px]">
              <p>Người phụ trách : <span className="font-bold italic">Phòng Logistics</span></p>
              <p>Cảng đi <i className="text-gray-500 font-normal">(POL)</i> <span className="font-bold">{data.pol}</span></p>
              <p>Cảng đến <i className="text-gray-500 font-normal">(POD)</i> <span className="font-bold">{data.pod}</span></p>
              <p>Ngày tàu chạy <i className="text-gray-500 font-normal">(ETD)</i> <span className="font-bold">{data.etd}</span></p>
              <p>Ngày tàu đến <i className="text-gray-500 font-normal">(ETA)</i> <span className="font-bold">{data.eta}</span></p>
              <p>Tên tàu/ Số chuyến <span className="font-bold">{data.vessel}</span></p>
            </div>
          </div>
          
          <p className="text-theme-red font-bold text-sm mt-2 italic">Đơn vị tiền tệ: {data.currency}</p>
        </div>

        {/* Section 2: Chi tiết báo giá */}
        <div className="print-no-break">
          <h2 className="text-theme-red uppercase font-bold text-sm mb-2">Tiến độ xử lý</h2>
          
          <table className="w-full text-black text-[13px]">
            <thead>
              <tr className="border-t border-b border-theme-red">
                <th className="py-2 px-3 text-left w-2/5 font-normal align-top"></th>
                <th className="py-2 px-3 text-right border-l border-[#f24b43]/30 w-[15%] font-normal align-top">Đơn Giá<br/><i className="text-gray-500">(Rate)</i></th>
                <th className="py-2 px-3 text-right border-l border-[#f24b43]/30 w-[15%] font-normal align-top">Số lượng<br/><i className="text-gray-500">(Quantity)</i></th>
                <th className="py-2 px-3 text-center border-l border-[#f24b43]/30 w-[15%] font-normal align-top">Đơn vị tính<br/><i className="text-gray-500">(Units)</i></th>
                <th className="py-2 px-3 text-right border-l border-[#f24b43]/30 w-[15%] font-normal align-top">Tổng<br/><i className="text-gray-500">(Total)</i></th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {data.items.map((item, index) => (
                <tr key={index} className={index === data.items.length - 1 ? 'pb-6' : ''}>
                  <td className="py-1.5 px-3">{item.description}</td>
                  <td className="py-1.5 px-3 text-right border-l border-[#f24b43]/30 align-top">{item.rate.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right border-l border-[#f24b43]/30 align-top">{item.quantity}</td>
                  <td className="py-1.5 px-3 text-center border-l border-[#f24b43]/30 align-top">{item.unit}</td>
                  <td className="py-1.5 px-3 text-right border-l border-[#f24b43]/30 align-top">{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Amount */}
          <div className="flex justify-end pr-3 mt-4 text-black border-t border-[#f24b43]/30 pt-4">
            <p className="font-bold text-[16px]">Tổng : {totalAmount.toLocaleString()} {data.currency}</p>
          </div>
        </div>

    
      </div>
    </div>
  );
};

export default HoadonAnle;
