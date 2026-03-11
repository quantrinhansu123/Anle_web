import React, { useState } from 'react';
import { ActionCard } from '../components/ui/ActionCard';
import type { ActionCardProps } from '../components/ui/ActionCard';
import { FileText, Users, Megaphone, Wallet, ShoppingCart, Box, Layers, Bot, Copyright } from 'lucide-react';
import { clsx } from 'clsx';

const dashboardModules: ActionCardProps[] = [
  {
    icon: FileText,
    title: 'Hành chính',
    description: 'Công văn, hợp đồng, văn thư lưu trữ.',
    href: '/hanh-chinh',
    colorScheme: 'orange'
  },
  {
    icon: Users,
    title: 'Nhân sự',
    description: 'Tuyển dụng, đào tạo, chấm công, lương.',
    href: '/nhan-su',
    colorScheme: 'emerald'
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    description: 'Chiến dịch, khách hàng, báo cáo marketing.',
    href: '/marketing',
    colorScheme: 'pink'
  },
  {
    icon: Wallet,
    title: 'Tài chính',
    description: 'Kế toán, ngân sách, báo cáo tài chính.',
    href: '/tai-chinh',
    colorScheme: 'blue'
  },
  {
    icon: ShoppingCart,
    title: 'Mua hàng',
    description: 'Đặt hàng, nhà cung cấp, đấu thầu.',
    href: '/mua-hang',
    colorScheme: 'orange'
  },
  {
    icon: Box,
    title: 'Kho vận',
    description: 'Tồn kho, xuất nhập kho, vận chuyển.',
    href: '/kho-van',
    colorScheme: 'cyan'
  },
  {
    icon: Layers,
    title: 'Hệ thống',
    description: 'Cấu hình, phân quyền và nhân sự.',
    href: '/he-thong',
    colorScheme: 'slate' as any // Will update colorMap in ActionCard to handle slate instead of adding custom one
  },
  {
    icon: Bot,
    title: 'Trợ lý AI',
    description: 'Cấu hình, phân quyền và nhân sự.',
    href: '/tro-ly-ai',
    colorScheme: 'purple'
  },
  {
    icon: Copyright,
    title: 'Thông tin bản quyền',
    description: 'Quản lý sở hữu trí tuệ và thông tin nhà phát triển.',
    href: '/ban-quyen',
    colorScheme: 'blue'
  }
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chuc-nang' | 'danh-dau' | 'tat-ca'>('chuc-nang');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2 text-foreground">
          Chào buổi tối, <span className="text-primary">Lê Minh Công</span> 👋
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-1.5 flex flex-wrap gap-1 mb-6 lg:mb-8 max-w-fit">
        <button
          onClick={() => setActiveTab('chuc-nang')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200",
            activeTab === 'chuc-nang'
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Chức năng
        </button>
        <button
          onClick={() => setActiveTab('danh-dau')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200",
            activeTab === 'danh-dau'
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Đánh dấu
        </button>
        <button
          onClick={() => setActiveTab('tat-ca')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200",
            activeTab === 'tat-ca'
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Tất cả
        </button>
      </div>

      {activeTab === 'chuc-nang' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5">
          {dashboardModules.map((module, idx) => (
            <ActionCard
              key={idx}
              {...module}
            />
          ))}
        </div>
      )}

      {activeTab === 'danh-dau' && (
        <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border border-border border-dashed">
          Chưa có module nào được đánh dấu.
        </div>
      )}

      {activeTab === 'tat-ca' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5 opacity-70">
          {dashboardModules.map((module, idx) => (
            <ActionCard
              key={idx}
              {...module}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
