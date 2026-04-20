import React from 'react';
import { Printer } from 'lucide-react';

interface InternalPaymentRequestProps {
  data?: {
    no: string;
    date: string;
    recipient: string;
    requester: string;
    position: string;
    content: string;
    generalInfo: {
      shipmentNo: string;
      service: string;
      commodities: string;
      volume: string;
      term: string;
      status: string;
      personInCharge: string;
      customer: string;
      pod: string;
      pol: string;
      vessel: string;
    };
    items: {
      description: string;
      docNo: string;
      issueDate: string;
      amount: number;
      note: string;
    }[];
    bankInfo: {
      accountName: string;
      accountNo: string;
      bankName: string;
      transferContent: string;
    };
  };
}

const InternalPaymentRequest: React.FC<InternalPaymentRequestProps> = ({ data: propData }) => {
  // Default data based on the provided image for demonstration
  const data = propData || {
    no: '26.50 SCM/TTNB-',
    date: 'Ngày 15 Tháng 04 Năm 2026',
    recipient: 'Ban giám đốc Công ty TNHH TM Anle- SCM',
    requester: 'Nguyễn Thiêm Dũng',
    position: 'Nhân viên phòng Kế toán',
    content: 'Thanh toán tiếp khách văn phòng, hóa đơn 200821 ngày 15/04/2026',
    generalInfo: {
      shipmentNo: 'VP14',
      service: 'Văn phòng',
      commodities: '',
      volume: '',
      term: '',
      status: '',
      personInCharge: '',
      customer: 'ANLE',
      pod: '',
      pol: '',
      vessel: '',
    },
    items: [
      {
        description: 'Thanh toán tiếp khách văn phòng, hóa đơn 200821 ngày 15/04/2026',
        docNo: '200821',
        issueDate: '4/15/2026',
        amount: 728360,
        note: '',
      },
    ],
    bankInfo: {
      accountName: 'CÔNG TY CỔ PHẦN ẨM THỰC THIÊN LÝ',
      accountNo: '18011188',
      bankName: 'Ngân hàng ACB',
      transferContent: 'CONG TY TNHH ANLE SCM THANH TOAN TIEP KHACH, HOA DON 200821 NGAY 15-04-2026',
    },
  };

  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Print Button - Hidden on Print */}
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Printer size={18} />
            In đề nghị thanh toán
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-8 shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-sans text-[#1a1a1a]">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-slate-300 pb-4">
            <div className="flex gap-4">
              {/* Logo Placeholder - Matches the red bird logo in image */}
              <div className="w-40 h-16 relative">
                <div className="absolute inset-0 bg-red-600 rounded-r-full" style={{ clipPath: 'polygon(0% 0%, 100% 30%, 100% 70%, 0% 100%, 20% 50%)' }}></div>
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white -translate-y-1/2"></div>
                <div className="absolute bottom-2 left-0 text-[10px] font-bold text-slate-800 tracking-wider">
                  ANLE SUPPLY CHAIN MANAGEMENT
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] leading-tight text-slate-600 uppercase">
              <p className="font-bold">CÔNG TY TNHH ANLE-SCM</p>
              <p>0962787877</p>
              <p>0319055028</p>
              <p>MGM@ANLE-SCM.COM</p>
              <p>571/23 PHAM VAN BACH STREET, TAN SON, HO CHI MINH CITY, VIET NAM</p>
            </div>
          </div>

          {/* Title & Date */}
          <div className="text-center mb-6">
            <div className="flex justify-end text-[12px] font-bold mb-1">
              <span>Số: {data.no}</span>
            </div>
            <h1 className="text-xl font-bold uppercase mb-1">GIẤY ĐỀ NGHỊ THANH TOÁN NỘI BỘ</h1>
            <p className="italic text-[13px]">{data.date}</p>
          </div>

          {/* Basic Info */}
          <div className="space-y-1 mb-6 text-[13px]">
            <p><span className="italic">Kính gửi:</span> <span className="font-medium underline">{data.recipient}</span></p>
            <p>Người đề nghị: <span className="font-medium">{data.requester}</span></p>
            <p>Chức Vụ: <span className="font-medium">{data.position}</span></p>
            <p className="mt-2">Nội dung: <span className="font-medium">{data.content}</span></p>
          </div>

          {/* Section: General Info */}
          <div className="mb-6">
            <h2 className="text-[14px] font-bold text-red-600 uppercase mb-2 border-b border-slate-200 pb-1">THÔNG TIN CHUNG</h2>
            <div className="grid grid-cols-2 border border-slate-300">
              <div className="border-r border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Mã lô hàng (Shipment No.):</span>
                <span className="font-bold">{data.generalInfo.shipmentNo}</span>
              </div>
              <div className="border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Người phụ trách:</span>
                <span className="font-bold">{data.generalInfo.personInCharge}</span>
              </div>
              <div className="border-r border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Dịch vụ (Service):</span>
                <span className="font-bold">{data.generalInfo.service}</span>
              </div>
              <div className="border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Tên khách hàng (Customer):</span>
                <span className="font-bold">{data.generalInfo.customer}</span>
              </div>
              <div className="border-r border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Mặt hàng (Commodities):</span>
                <span className="font-bold">{data.generalInfo.commodities}</span>
              </div>
              <div className="border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Cảng đến (POD):</span>
                <span className="font-bold">{data.generalInfo.pod}</span>
              </div>
              <div className="border-r border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Khối lượng (Volume):</span>
                <span className="font-bold">{data.generalInfo.volume}</span>
              </div>
              <div className="border-b border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Cảng đi (POL):</span>
                <span className="font-bold">{data.generalInfo.pol}</span>
              </div>
              <div className="border-r border-slate-300 p-1.5 flex text-[12px]">
                <span className="w-1/2">Điều kiện (Term):</span>
                <span className="font-bold">{data.generalInfo.term}</span>
              </div>
              <div className="p-1.5 flex text-[12px]">
                <span className="w-1/2">Tên tàu/ Số chuyến:</span>
                <span className="font-bold">{data.generalInfo.vessel}</span>
              </div>
            </div>
            <div className="text-[12px] p-1.5 border-x border-b border-slate-300">
              <span>Tình trạng: </span>
              <span className="font-bold">{data.generalInfo.status}</span>
            </div>
          </div>

          {/* Section: Payment Details */}
          <div className="mb-6">
            <h2 className="text-[14px] font-bold text-red-600 uppercase mb-2">GIÁ TRỊ ĐỀ NGHỊ THANH TOÁN</h2>
            <table className="w-full border-collapse border border-slate-800 text-[12px]">
              <thead>
                <tr className="bg-slate-50 italic">
                  <th className="border border-slate-800 p-2 text-center w-[40%]">Nội dung</th>
                  <th className="border border-slate-800 p-2 text-center w-[15%]">Số Chứng từ (No Document)</th>
                  <th className="border border-slate-800 p-2 text-center w-[15%]">Ngày phát hành (IssueDate)</th>
                  <th className="border border-slate-800 p-2 text-center w-[20%]">Giá trị thanh toán (Payable Amount)</th>
                  <th className="border border-slate-800 p-2 text-center w-[10%]">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-800 p-2">{item.description}</td>
                    <td className="border border-slate-800 p-2 text-center">{item.docNo}</td>
                    <td className="border border-slate-800 p-2 text-center">{item.issueDate}</td>
                    <td className="border border-slate-800 p-2 text-right">{formatCurrency(item.amount)}</td>
                    <td className="border border-slate-800 p-2 text-center">{item.note}</td>
                  </tr>
                ))}
                {/* Empty rows to match style */}
                {[...Array(3)].map((_, i) => (
                  <tr key={`empty-${i}`} className="h-8">
                    <td className="border border-slate-800 p-2"></td>
                    <td className="border border-slate-800 p-2"></td>
                    <td className="border border-slate-800 p-2"></td>
                    <td className="border border-slate-800 p-2"></td>
                    <td className="border border-slate-800 p-2"></td>
                  </tr>
                ))}
                <tr className="bg-yellow-400 font-bold">
                  <td colSpan={3} className="border border-slate-800 p-2 text-left text-[14px]">Tổng</td>
                  <td className="border border-slate-800 p-2 text-right text-[14px]">{formatCurrency(totalAmount)}</td>
                  <td className="border border-slate-800 p-2 text-center text-[13px]">VND</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer details */}
          <div className="space-y-1 mb-8 text-[13px]">
            <p><span className="italic">Bằng chữ :</span> <span className="font-bold underline decoration-dotted capitalize">Bảy trăm hai mươi tám nghìn ba trăm sáu mươi đồng</span></p>
            <p className="font-bold">Thanh toán vào stk:</p>
            <p className="italic text-red-600 font-bold">Chủ tài khoản: {data.bankInfo.accountName}</p>
            <p className="italic text-red-600 font-bold">Số tài khoản: {data.bankInfo.accountNo}</p>
            <p className="italic text-red-600 font-bold">Tại ngân hàng: {data.bankInfo.bankName}</p>
            <p className="italic text-red-600 font-bold">Nội dung ck: {data.bankInfo.transferContent}</p>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-4 text-center text-[13px] mb-20">
            <div className="space-y-1">
              <p className="font-bold">Người lập</p>
              <p className="italic text-[11px]">(Ký, họ tên)</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">Trưởng bộ phận</p>
              <p className="italic text-[11px]">(Ký, họ tên)</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">Kế toán</p>
              <p className="italic text-[11px]">(Ký, họ tên)</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">Người duyệt</p>
              <p className="italic text-[11px]">(Ký, họ tên)</p>
            </div>
          </div>

          {/* Requester Name at Bottom Right */}
          <div className="flex justify-end mt-12 pr-12">
            <p className="font-bold italic text-[14px]">{data.requester}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalPaymentRequest;
