// src/components/MasterDataManager.tsx
// Quản lý dữ liệu nền (Master Data): Nguyên liệu, Thẻ, Vùng miền, Chế độ ăn, Nhóm dị ứng (UC11 Luồng 3b & 3c, Section 4.11)

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Search, Plus, Edit3, Trash2, AlertTriangle, Check, X,
  ChevronLeft, ChevronRight, RefreshCw, Tag, MapPin, ShieldAlert,
  Filter, Sparkles, UtensilsCrossed, Wheat, Heart, Save,
} from 'lucide-react';
import {
  adminMasterApi,
  type MasterResourceType,
  type MasterResourceItem,
  type PaginatedResponse,
} from '../api/adminApi';

interface MasterDataManagerProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}

const RESOURCE_CONFIG: Record<MasterResourceType, {
  label: string;
  singular: string;
  icon: React.ElementType;
  description: string;
  defaultUnit?: boolean;
  hasAllergen?: boolean;
  hasCode?: boolean;
}> = {
  ingredients: {
    label: 'Nguyên liệu',
    singular: 'nguyên liệu',
    icon: UtensilsCrossed,
    description: 'Danh mục nguyên liệu chế biến, đơn vị định lượng và phân nhóm dị ứng cảnh báo an toàn.',
    defaultUnit: true,
    hasAllergen: true,
  },
  tags: {
    label: 'Thẻ món ăn',
    singular: 'thẻ',
    icon: Tag,
    description: 'Thẻ phân loại đặc tính món (vd: Chiên, Xào, Món nhanh, Tiệc, Thanh đạm...).',
  },
  regions: {
    label: 'Vùng miền',
    singular: 'vùng miền',
    icon: MapPin,
    description: 'Đặc trưng ẩm thực theo khu vực địa lý (vd: Miền Bắc, Miền Trung, Miền Nam...).',
    hasCode: true,
  },
  diet_types: {
    label: 'Chế độ ăn',
    singular: 'chế độ ăn',
    icon: Heart,
    description: 'Chế độ ăn kiêng và dinh dưỡng đặc thù (vd: Ăn chay, Keto, Eat clean, Low-carb...).',
    hasCode: true,
  },
  allergen_groups: {
    label: 'Nhóm dị ứng',
    singular: 'nhóm dị ứng',
    icon: ShieldAlert,
    description: 'Nhóm chất dễ gây dị ứng để lọc và cảnh báo tự động cho người dùng (vd: Hải sản, Đậu phộng...).',
    hasCode: true,
  },
};

const COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'thìa cà phê', 'thìa canh', 'quả', 'củ', 'cây', 'tép', 'nhánh', 'lát', 'gói'];

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({ showToast, showConfirm }) => {
  const [activeResource, setActiveResource] = useState<MasterResourceType>('ingredients');
  const [items, setItems] = useState<MasterResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [q, setQ] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [filterAllergenId, setFilterAllergenId] = useState<string>('');

  // Allergen groups list for ingredient selector
  const [allergenOptions, setAllergenOptions] = useState<MasterResourceItem[]>([]);

  // Modal editor
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterResourceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    default_unit: string;
    allergen_group_id: string;
    aliases: string;
  }>({
    name: '',
    code: '',
    default_unit: 'g',
    allergen_group_id: '',
    aliases: '',
  });

  // Load allergen options for ingredient form/filter
  const loadAllergenOptions = useCallback(async () => {
    try {
      const res = await adminMasterApi.list('allergen_groups', { limit: 100 });
      if (res.success && res.data) {
        setAllergenOptions(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadAllergenOptions();
  }, [loadAllergenOptions]);

  // Load items
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res: PaginatedResponse<MasterResourceItem> = await adminMasterApi.list(activeResource, {
        q: q || undefined,
        needs_review: activeResource === 'ingredients' && filterNeedsReview ? true : undefined,
        allergen_group_id: activeResource === 'ingredients' && filterAllergenId ? parseInt(filterAllergenId) : undefined,
        page,
        limit: 15,
      });

      if (res.success) {
        setItems(res.data);
        setTotalPages(res.meta.total_pages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Lỗi tải danh sách dữ liệu nền', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeResource, q, filterNeedsReview, filterAllergenId, page, showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Switch sub-tab
  const handleSelectResource = (res: MasterResourceType) => {
    setActiveResource(res);
    setPage(1);
    setQ('');
    setFilterNeedsReview(false);
    setFilterAllergenId('');
  };

  // Open modal create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      default_unit: 'g',
      allergen_group_id: '',
      aliases: '',
    });
    setShowEditor(true);
  };

  // Open modal edit
  const handleOpenEdit = (item: MasterResourceItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      default_unit: item.default_unit || 'g',
      allergen_group_id: item.allergen_group_id ? item.allergen_group_id.toString() : '',
      aliases: item.aliases || '',
    });
    setShowEditor(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên bản ghi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
      };

      if (activeResource === 'ingredients') {
        payload.default_unit = formData.default_unit.trim() || 'g';
        payload.allergen_group_id = formData.allergen_group_id ? parseInt(formData.allergen_group_id) : null;
        payload.aliases = formData.aliases.trim() || undefined;
      } else if (activeResource === 'regions' || activeResource === 'diet_types' || activeResource === 'allergen_groups') {
        payload.code = formData.code.trim() || undefined;
      }

      if (editingItem) {
        await adminMasterApi.update(activeResource, editingItem.id, payload);
        showToast(`Đã cập nhật ${RESOURCE_CONFIG[activeResource].singular} thành công!`);
      } else {
        await adminMasterApi.create(activeResource, payload);
        showToast(`Đã tạo ${RESOURCE_CONFIG[activeResource].singular} mới thành công!`);
      }

      setShowEditor(false);
      loadItems();
      if (activeResource === 'allergen_groups') {
        loadAllergenOptions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete (with foreign key constraint alert Luồng 3c)
  const handleDelete = (item: MasterResourceItem) => {
    const config = RESOURCE_CONFIG[activeResource];
    showConfirm(
      `Xóa ${config.singular}`,
      `Bạn có chắc chắn muốn xóa "${item.name}"? Thao tác này sẽ bị chặn nếu đang có món ăn hoặc dữ liệu khác liên kết tới bản ghi này.`,
      async () => {
        try {
          await adminMasterApi.delete(activeResource, item.id);
          showToast(`Đã xóa ${config.singular} thành công.`);
          loadItems();
          if (activeResource === 'allergen_groups') {
            loadAllergenOptions();
          }
        } catch (err: any) {
          const errData = err.response?.data?.error;
          const msg = errData?.message || err.message || 'Không thể xóa bản ghi.';
          showToast(msg, 'error');
        }
      },
      true
    );
  };

  const currentConfig = RESOURCE_CONFIG[activeResource];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sub-tabs header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Quản lý Dữ liệu nền</h2>
              <p className="text-xs text-stone-500">{currentConfig.description}</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm {currentConfig.singular}</span>
          </button>
        </div>

        {/* 5 Subtabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(RESOURCE_CONFIG) as MasterResourceType[]).map((resKey) => {
            const config = RESOURCE_CONFIG[resKey];
            const Icon = config.icon;
            const isActive = activeResource === resKey;
            return (
              <button
                key={resKey}
                onClick={() => handleSelectResource(resKey)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={`Tìm kiếm ${currentConfig.singular} theo tên...`}
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {activeResource === 'ingredients' && (
            <>
              {/* Needs review checkbox filter (UC11 Luồng 3b) */}
              <label className="flex items-center gap-2 px-3.5 py-2 border border-amber-200 bg-amber-50/60 rounded-2xl text-xs font-bold text-amber-900 cursor-pointer hover:bg-amber-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={filterNeedsReview}
                  onChange={(e) => {
                    setFilterNeedsReview(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Chỉ nguyên liệu cần rà soát</span>
              </label>

              {/* Allergen filter */}
              <select
                value={filterAllergenId}
                onChange={(e) => {
                  setFilterAllergenId(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 text-xs font-semibold border border-stone-200 rounded-2xl focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả nhóm dị ứng</option>
                {allergenOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            onClick={loadItems}
            className="p-2.5 border border-stone-200 rounded-2xl hover:bg-stone-50 cursor-pointer transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {activeResource === 'ingredients' && (
          <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>
              Nguyên liệu có nhãn <span className="font-bold text-amber-700">"Cần rà soát"</span> là nguyên liệu được tạo nhanh từ công thức nấu mà chưa được phân loại nhóm dị ứng.
            </span>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-stone-400 text-sm">
            Đang tải dữ liệu {currentConfig.label.toLowerCase()}...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <currentConfig.icon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-700 mb-1">
              Không tìm thấy {currentConfig.singular} nào
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {q || filterNeedsReview || filterAllergenId
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                : `Chưa có ${currentConfig.singular} nào trong hệ thống. Nhấn "Thêm ${currentConfig.singular}" để tạo mới.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-left">
                  <th className="px-5 py-3 font-bold text-stone-700 w-16">ID</th>
                  <th className="px-5 py-3 font-bold text-stone-700">Tên {currentConfig.singular}</th>
                  {currentConfig.defaultUnit && (
                    <th className="px-5 py-3 font-bold text-stone-700">Đơn vị mặc định</th>
                  )}
                  {currentConfig.hasAllergen && (
                    <th className="px-5 py-3 font-bold text-stone-700">Nhóm dị ứng</th>
                  )}
                  {activeResource === 'ingredients' && (
                    <th className="px-5 py-3 font-bold text-stone-700">Tên đồng nghĩa</th>
                  )}
                  {currentConfig.hasCode && (
                    <th className="px-5 py-3 font-bold text-stone-700">Mã định danh</th>
                  )}
                  {activeResource === 'ingredients' && (
                    <th className="px-5 py-3 font-bold text-stone-700 text-center">Trạng thái rà soát</th>
                  )}
                  <th className="px-5 py-3 font-bold text-stone-700 text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-stone-400 font-mono text-xs">#{item.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-stone-900">{item.name}</div>
                    </td>

                    {currentConfig.defaultUnit && (
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-mono font-semibold">
                          {item.default_unit || 'g'}
                        </span>
                      </td>
                    )}

                    {currentConfig.hasAllergen && (
                      <td className="px-5 py-3.5">
                        {item.allergen_group ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {item.allergen_group.name}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Không gây dị ứng</span>
                        )}
                      </td>
                    )}

                    {activeResource === 'ingredients' && (
                      <td className="px-5 py-3.5 text-xs text-stone-600">
                        {item.aliases || <span className="text-stone-300">—</span>}
                      </td>
                    )}

                    {currentConfig.hasCode && (
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-mono font-semibold">
                          {item.code || '—'}
                        </span>
                      </td>
                    )}

                    {activeResource === 'ingredients' && (
                      <td className="px-5 py-3.5 text-center">
                        {item.needs_review ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold shadow-xs">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Cần rà soát
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-xs">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Đã chuẩn hóa
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-xl transition-colors cursor-pointer"
                          title="Sửa bản ghi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-stone-200">
            <div className="text-xs text-stone-500">
              Tổng số <span className="font-bold text-stone-800">{totalCount}</span> {currentConfig.singular}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-stone-700 px-3">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <currentConfig.icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  {editingItem ? `Sửa ${currentConfig.singular}` : `Thêm ${currentConfig.singular} mới`}
                </h3>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tên {currentConfig.singular} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder={`VD: ${activeResource === 'ingredients' ? 'Thịt bò phi lê' : activeResource === 'tags' ? 'Chiên xù' : activeResource === 'regions' ? 'Miền Bắc' : 'Thuộc tính...'}`}
                />
              </div>

              {currentConfig.defaultUnit && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Đơn vị định lượng mặc định *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.default_unit}
                      onChange={(e) => setFormData((p) => ({ ...p, default_unit: e.target.value }))}
                      className="flex-1 px-3.5 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                      placeholder="g, ml, quả, cây..."
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setFormData((p) => ({ ...p, default_unit: e.target.value }));
                      }}
                      className="px-3 py-2 text-xs border border-stone-200 rounded-2xl bg-stone-50 cursor-pointer"
                    >
                      <option value="">Gợi ý...</option>
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {currentConfig.hasAllergen && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nhóm chất dị ứng (nếu có)
                  </label>
                  <select
                    value={formData.allergen_group_id}
                    onChange={(e) => setFormData((p) => ({ ...p, allergen_group_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="">Không chứa chất gây dị ứng phổ biến</option>
                    {allergenOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Gán nhóm dị ứng sẽ tự động gỡ cờ "Cần rà soát" và hiển thị cảnh báo khi người dùng kích hoạt hồ sơ khẩu vị.
                  </p>
                </div>
              )}

              {activeResource === 'ingredients' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tên đồng nghĩa (Aliases)
                  </label>
                  <input
                    type="text"
                    value={formData.aliases}
                    onChange={(e) => setFormData((p) => ({ ...p, aliases: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="VD: ngò rí, mùi tàu, ngò gai (cách nhau bởi dấu phẩy)"
                  />
                </div>
              )}

              {currentConfig.hasCode && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mã định danh (Code)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                    placeholder="VD: bac, trung, keto, seafood..."
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu bản ghi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
