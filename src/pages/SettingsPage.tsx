import React from 'react';
import { 
  Settings, RotateCcw, Palette, Sun, Moon, Monitor, 
  Type, Maximize, Languages, Globe, Bell, 
  CheckCircle2, ChevronDown, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme, THEME_COLORS } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cài đặt hệ thống</h1>
            <p className="text-muted-foreground text-sm">Tùy chỉnh giao diện, ngôn ngữ và thông báo của bạn.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[12px] text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={14} />
            Thay đổi được áp dụng tự động
          </div>
          <button 
            onClick={() => {
              setTheme('system');
              setPrimaryColor('Xanh dương');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-[13px] font-bold text-foreground hover:bg-muted transition-all shadow-sm"
          >
            <RotateCcw size={16} />
            Khôi phục mặc định
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Appearance Section */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            <h2 className="text-[14px] font-bold text-foreground">Giao diện & Hiển thị</h2>
          </div>
          <div className="p-6 space-y-8">
            {/* Display Mode */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                <Sun size={14} className="text-muted-foreground" />
                Chế độ hiển thị
              </h3>
              <div className="flex bg-muted rounded-xl w-fit p-1">
                {[
                  { id: 'light', label: 'Sáng', icon: Sun },
                  { id: 'dark', label: 'Tối', icon: Moon },
                  { id: 'system', label: 'Theo hệ thống', icon: Monitor },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id as any)}
                    className={clsx(
                      "flex items-center gap-2 px-6 py-2 rounded-lg text-[13px] font-medium transition-all",
                      theme === item.id 
                        ? "bg-card text-primary shadow-sm ring-1 ring-black/5" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color */}
            <div className="space-y-4">
              <h3 className="text-[13px] font-bold text-foreground">Tông màu chủ đạo</h3>
              <div className="flex flex-wrap gap-3">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setPrimaryColor(color.name)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                      primaryColor === color.name
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={clsx("w-4 h-4 rounded-full shadow-inner", color.class)} />
                    <span className={clsx(
                      "text-[13px] pr-1",
                      primaryColor === color.name ? "text-primary font-bold" : "text-muted-foreground font-medium"
                    )}>
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Type size={14} className="text-muted-foreground" />
                  Kiểu chữ
                </h3>
                <div className="relative group">
                  <button className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-[14px] text-foreground font-medium hover:border-primary/30 transition-all">
                    <span>Inter</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X size={14} className="hover:text-foreground" />
                      <div className="w-[1px] h-4 bg-border" />
                      <ChevronDown size={14} />
                    </div>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
                  <Maximize size={14} className="text-muted-foreground" />
                  Kích thước văn bản
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-[14px] text-foreground font-medium">
                    <span>Trung bình</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X size={14} />
                      <div className="w-[1px] h-4 bg-border" />
                      <ChevronDown size={14} />
                    </div>
                  </button>
                  <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border">
                    <p className="text-[14px] text-muted-foreground text-center">Đây là kích thước chữ mẫu.</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 italic px-1">Ảnh hưởng đến cỡ chữ hiển thị trên toàn hệ thống.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h2 className="text-[14px] font-bold text-foreground">Cấu hình vùng</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-foreground flex items-center gap-2">
                <Languages size={14} className="text-muted-foreground" />
                Ngôn ngữ hiển thị
              </label>
              <button className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-[14px] text-foreground font-medium">
                <span>Tiếng Việt (Việt Nam)</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X size={14} />
                  <div className="w-[1px] h-4 bg-border" />
                  <ChevronDown size={14} />
                </div>
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-foreground flex items-center gap-2">
                <Monitor size={14} className="text-muted-foreground" />
                Múi giờ
              </label>
              <button className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-[14px] text-foreground font-medium">
                <span>(GMT+07:00) Hà Nội, TP.HCM, Bangkok</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X size={14} />
                  <div className="w-[1px] h-4 bg-border" />
                  <ChevronDown size={14} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm relative">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <h2 className="text-[14px] font-bold text-foreground">Thông báo</h2>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground/60 bg-muted/50 px-2.5 py-1 rounded-full border border-border/50">Sắp ra mắt</span>
          </div>
          <div className="p-6 space-y-6 opacity-40 select-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">Thông báo Email</p>
                <p className="text-[12px] text-muted-foreground">Nhận báo cáo qua mail.</p>
              </div>
              <div className="w-10 h-5 bg-border rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-foreground rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">Thông báo trình duyệt</p>
                <p className="text-[12px] text-muted-foreground">Tin nhắn khi có biến động.</p>
              </div>
              <div className="w-10 h-5 bg-border rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-foreground rounded-full shadow-sm" />
              </div>
            </div>
            <div className="pt-4 text-center">
              <p className="text-[11px] text-muted-foreground italic">Tính năng đang được phát triển.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
