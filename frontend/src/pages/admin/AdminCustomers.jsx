import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Calendar, Download, CheckSquare, Square, MinusSquare, Copy, Check, ShoppingBag, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

const responsiveStyles = `
    @media (max-width: 768px) {
        .admin-customers-header-actions {
            flex-direction: column;
            width: 100%;
        }
        .admin-customers-header-actions .form-input, 
        .admin-customers-header-actions .btn {
            width: 100%;
        }
        .admin-customers-search-container {
            width: 100%;
            min-width: 100% !important;
        }
        .customers-table thead {
            display: none;
        }
        .customers-table tbody {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
        }
        .customers-table tr {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 1rem;
            position: relative;
            background: var(--color-surface);
            box-shadow: var(--shadow-sm);
        }
        .customers-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--color-border-light) !important;
        }
        .customers-table td:last-child {
            border-bottom: none !important;
        }
        .customers-table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: var(--color-text-secondary);
            font-size: 0.85rem;
        }
        .customers-table td.td-checkbox {
            position: absolute;
            top: 1rem;
            right: 0.5rem;
            border: none !important;
            padding: 0;
            width: auto;
        }
        .customers-table td.td-checkbox::before { display: none; }
        .customers-table td.td-name {
             border-bottom: none !important;
             padding-top: 0;
             padding-bottom: 0.25rem;
             font-size: 1.1rem;
             color: var(--color-primary);
             justify-content: flex-start;
             width: 85%;
        }
        .customers-table td.td-name::before { display: none; }
        .customers-table td.td-email {
             word-break: break-all;
             text-align: right;
        }
        .customers-table td.td-actions {
             justify-content: center;
             padding-top: 1rem;
             padding-bottom: 0;
             border-bottom: none !important;
             margin-top: 0.5rem;
        }
        .customers-table td.td-actions .btn { width: 100%; }
        .customers-table td.td-actions::before { display: none; }
        .mobile-select-all {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-surface-hover);
            border-top-left-radius: var(--radius-lg);
            border-top-right-radius: var(--radius-lg);
        }
        .modal-content {
             width: 95% !important;
             margin: 1rem auto !important;
             padding: 0 !important;
             max-height: 90vh;
             overflow-y: auto;
             max-width: 100% !important;
        }
        .customer-detail-value {
             word-break: break-word;
             text-align: right;
        }
        .customer-detail-item {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.5rem;
            padding: 0.75rem 0;
        }
        .customer-detail-item > div {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
        }
    }
    .mobile-select-all { display: none; }
`;

const formatPrice = (price) => {
    return `${(price || 0).toFixed(2)} ₺`;
};

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCustomers: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [copiedId, setCopiedId] = useState(null);

    const copyPhone = (phoneNumber, id) => {
        if (!phoneNumber) return;
        navigator.clipboard.writeText(phoneNumber);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const [selectedIds, setSelectedIds] = useState(new Set());

    const fetchCustomers = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/customers?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
            if (response.data.success) {
                setCustomers(response.data.data.customers);
                setPagination(response.data.data.pagination);
            }
        } catch {
            setError('Müşteriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(1);
            setSelectedIds(new Set());
        }, search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [search, fetchCustomers]);

    const handlePageChange = (page) => {
        fetchCustomers(page);
        setSelectedIds(new Set());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openCustomerDetail = async (customer) => {
        setDetailLoading(true);
        try {
            const response = await api.get(`/customers/${customer._id}`);
            if (response.data.success) {
                setSelectedCustomer(response.data.data);
            }
        } catch {
            setSelectedCustomer(customer);
        } finally {
            setDetailLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === customers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(customers.map(c => c._id)));
        }
    };

    const exportToExcel = async () => {
        let dataToExport;

        if (selectedIds.size > 0) {
            dataToExport = customers.filter(c => selectedIds.has(c._id));
        } else {
            try {
                const response = await api.get(`/customers?page=1&limit=99999&search=${encodeURIComponent(search)}`);
                if (response.data.success) {
                    dataToExport = response.data.data.customers;
                } else {
                    setError('Dışa aktarma başarısız.');
                    return;
                }
            } catch {
                setError('Dışa aktarma sırasında hata oluştu.');
                return;
            }
        }

        if (!dataToExport || dataToExport.length === 0) {
            setError('Dışa aktarılacak müşteri bulunamadı.');
            return;
        }

        const rows = dataToExport.map(c => ({
            'Ad Soyad': c.name || '',
            'Telefon': c.phone || '',
            'E-posta': c.email || '',
            'Tip': c.type === 'guest' ? 'Misafir' : 'Kayıtlı',
            'Sipariş Sayısı': c.orderCount || 0,
            'Toplam Harcama': c.totalSpent ? c.totalSpent.toFixed(2) + ' ₺' : '0.00 ₺',
            'İl': c.city || '',
            'İlçe': c.district || '',
            'Kayıt Tarihi': new Date(c.createdAt).toLocaleString('tr-TR')
        }));

        const ws = XLSX.utils.json_to_sheet(rows);

        const colWidths = Object.keys(rows[0]).map(key => {
            const maxLen = Math.max(
                key.length,
                ...rows.map(row => String(row[key] || '').length)
            );
            return { wch: Math.min(maxLen + 2, 50) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `musteriler_${dateStr}.xlsx`);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const allSelected = customers.length > 0 && selectedIds.size === customers.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < customers.length;

    const customerDetail = selectedCustomer;

    return (
        <div className="admin-page">
            <style>{responsiveStyles}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Müşteriler</h1>
                    <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Toplam {pagination.totalCustomers} müşteri
                    </p>
                </div>

                <div className="admin-customers-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="admin-customers-search-container" style={{ position: 'relative', minWidth: '280px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="İsim, telefon veya e-posta ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>

                    <button onClick={exportToExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                        <Download size={18} />
                        {selectedIds.size > 0 ? `Seçilenleri İndir (${selectedIds.size})` : 'Excel İndir'}
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {customerDetail && (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1, borderRadius: '12px 12px 0 0' }}>
                            <h2 style={{ margin: 0 }}>Müşteri Detayı</h2>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="customer-detail-grid" style={{ padding: '1rem 1.5rem', overflowY: 'auto' }}>
                            <div className="customer-detail-item">
                                <User size={16} />
                                <div>
                                    <span className="customer-detail-label">Ad Soyad</span>
                                    <span className="customer-detail-value">{customerDetail.name}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '9999px',
                                    background: customerDetail.type === 'guest' ? 'var(--color-warning, #f59e0b)' : customerDetail.role === 'admin' ? 'var(--color-primary)' : 'var(--color-success, #10b981)',
                                    color: '#fff',
                                    fontWeight: 500
                                }}>
                                    {customerDetail.type === 'guest' ? 'Misafir' : customerDetail.role === 'admin' ? 'Admin' : 'Kayıtlı'}
                                </span>
                            </div>

                            <div className="customer-detail-item">
                                <Phone size={16} />
                                <div>
                                    <span className="customer-detail-label">Telefon</span>
                                    <span className="customer-detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {customerDetail.phone || '—'}
                                        {customerDetail.phone && (
                                            <button
                                                onClick={() => copyPhone(customerDetail.phone, 'modal')}
                                                title="Telefonu kopyala"
                                                style={{
                                                    background: copiedId === 'modal' ? 'var(--color-success, #10b981)' : 'var(--color-background)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '4px 8px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.75rem',
                                                    color: copiedId === 'modal' ? '#fff' : 'var(--color-text-secondary)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {copiedId === 'modal' ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                                            </button>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {customerDetail.email && (
                                <div className="customer-detail-item">
                                    <Mail size={16} />
                                    <div>
                                        <span className="customer-detail-label">E-posta</span>
                                        <span className="customer-detail-value">{customerDetail.email}</span>
                                    </div>
                                </div>
                            )}

                            {(customerDetail.type === 'guest' ? (customerDetail.city || customerDetail.district || customerDetail.address) : (customerDetail.address && (customerDetail.address.city || customerDetail.address.street))) && (
                                <div className="customer-detail-item">
                                    <MapPin size={16} />
                                    <div>
                                        <span className="customer-detail-label">Adres</span>
                                        <span className="customer-detail-value">
                                            {customerDetail.type === 'guest'
                                                ? [customerDetail.neighborhood, customerDetail.district, customerDetail.city].filter(Boolean).join(', ')
                                                : [customerDetail.address?.street, customerDetail.address?.city, customerDetail.address?.state, customerDetail.address?.zipCode].filter(Boolean).join(', ')
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="customer-detail-item">
                                <ShoppingBag size={16} />
                                <div>
                                    <span className="customer-detail-label">Sipariş Sayısı</span>
                                    <span className="customer-detail-value">{customerDetail.orderCount || 0}</span>
                                </div>
                            </div>

                            <div className="customer-detail-item">
                                <Calendar size={16} />
                                <div>
                                    <span className="customer-detail-label">Toplam Harcama</span>
                                    <span className="customer-detail-value" style={{ fontWeight: 600 }}>{formatPrice(customerDetail.totalSpent)}</span>
                                </div>
                            </div>

                            <div className="customer-detail-item">
                                <Calendar size={16} />
                                <div>
                                    <span className="customer-detail-label">
                                        {customerDetail.type === 'guest' ? 'İlk Sipariş' : 'Kayıt Tarihi'}
                                    </span>
                                    <span className="customer-detail-value">
                                        {customerDetail.type === 'guest' && customerDetail.firstOrderDate
                                            ? formatDateTime(customerDetail.firstOrderDate)
                                            : formatDateTime(customerDetail.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {customerDetail.lastOrderDate && (
                                <div className="customer-detail-item">
                                    <Clock size={16} />
                                    <div>
                                        <span className="customer-detail-label">Son Sipariş</span>
                                        <span className="customer-detail-value">{formatDateTime(customerDetail.lastOrderDate)}</span>
                                    </div>
                                </div>
                            )}

                            {customerDetail.orders && customerDetail.orders.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Son Siparişler</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {customerDetail.orders.slice(0, 10).map(order => (
                                            <div key={order._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                background: 'var(--color-background)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.85rem'
                                            }}>
                                                <div>
                                                    <span style={{ fontWeight: 500 }}>#{order._id.toString().slice(-8).toUpperCase()}</span>
                                                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                                        {order.items?.length || 0} ürün
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontWeight: 500 }}>{formatPrice(order.total)}</span>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        background: order.status === 'delivered' ? 'var(--color-success, #10b981)' :
                                                            order.status === 'cancelled' ? 'var(--color-error, #ef4444)' :
                                                                order.status === 'shipped' ? 'var(--color-info, #3b82f6)' :
                                                                    order.status === 'confirmed' ? 'var(--color-primary)' :
                                                                        'var(--color-warning, #f59e0b)',
                                                        color: '#fff'
                                                    }}>
                                                        {order.status === 'pending' ? 'Bekliyor' :
                                                            order.status === 'confirmed' ? 'Onaylandı' :
                                                                order.status === 'processing' ? 'Hazırlanıyor' :
                                                                    order.status === 'shipped' ? 'Kargoda' :
                                                                        order.status === 'delivered' ? 'Teslim Edildi' :
                                                                            order.status === 'cancelled' ? 'İptal' : order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'visible', background: 'transparent', boxShadow: 'none' }}>
                {loading ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p className="text-muted">Yükleniyor...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p className="text-muted">{search ? 'Arama sonucu bulunamadı.' : 'Henüz müşteri yok.'}</p>
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: 'visible', padding: 0 }}>
                        <div className="mobile-select-all">
                            <span style={{ fontWeight: 600 }}>Tümünü Seç</span>
                            <button
                                onClick={toggleSelectAll}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: allSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center'
                                }}
                            >
                                {allSelected ? <CheckSquare size={24} /> : someSelected ? <MinusSquare size={24} /> : <Square size={24} />}
                            </button>
                        </div>
                        <table className="admin-table customers-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <button
                                            onClick={toggleSelectAll}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: allSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                            }}
                                            title={allSelected ? 'Seçimi kaldır' : 'Tümünü seç'}
                                        >
                                            {allSelected ? <CheckSquare size={18} /> : someSelected ? <MinusSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th>Ad Soyad</th>
                                    <th>Telefon</th>
                                    <th>E-posta</th>
                                    <th>Tip</th>
                                    <th>Sipariş</th>
                                    <th>Harcama</th>
                                    <th>Tarih</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(customer => {
                                    const isSelected = selectedIds.has(customer._id);
                                    return (
                                        <tr key={customer._id} style={{
                                            outline: isSelected ? '2px solid var(--color-primary)' : undefined,
                                            outlineOffset: '-2px',
                                            borderRadius: '4px'
                                        }}>
                                            <td className="td-checkbox">
                                                <button
                                                    onClick={() => toggleSelect(customer._id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '0.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                                    }}
                                                >
                                                    {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                                </button>
                                            </td>
                                            <td className="td-name" style={{ fontWeight: 500 }}>{customer.name}</td>
                                            <td className="td-phone" data-label="Telefon">
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {customer.phone || '—'}
                                                    {customer.phone && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); copyPhone(customer.phone, customer._id); }}
                                                            title="Telefonu kopyala"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                color: copiedId === customer._id ? 'var(--color-success, #10b981)' : 'var(--color-text-muted)',
                                                                transition: 'color 0.2s'
                                                            }}
                                                        >
                                                            {copiedId === customer._id ? <Check size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="td-email" data-label="E-posta">{customer.email || '—'}</td>
                                            <td data-label="Tip">
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    background: customer.type === 'guest' ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #10b981)',
                                                    color: '#fff',
                                                    fontWeight: 500,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {customer.type === 'guest' ? 'Misafir' : 'Kayıtlı'}
                                                </span>
                                            </td>
                                            <td data-label="Sipariş" style={{ textAlign: 'center' }}>
                                                {customer.orderCount || 0}
                                            </td>
                                            <td data-label="Harcama" style={{ whiteSpace: 'nowrap' }}>
                                                {formatPrice(customer.totalSpent)}
                                            </td>
                                            <td data-label="Tarih" style={{ whiteSpace: 'nowrap' }}>
                                                {customer.type === 'guest'
                                                    ? formatDate(customer.firstOrderDate || customer.createdAt)
                                                    : formatDate(customer.createdAt)}
                                            </td>
                                            <td className="td-actions">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => openCustomerDetail(customer)}
                                                    disabled={detailLoading}
                                                >
                                                    Detay
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="pagination-bar">
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                        <ChevronLeft size={16} /> Önceki
                    </button>

                    <div className="pagination-pages">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(p => {
                                return p === 1 || p === pagination.totalPages ||
                                    Math.abs(p - pagination.currentPage) <= 1;
                            })
                            .reduce((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) {
                                    acc.push('...');
                                }
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`dots-${i}`} className="pagination-dots">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`pagination-btn ${p === pagination.currentPage ? 'active' : ''}`}
                                        onClick={() => handlePageChange(p)}
                                    >
                                        {p}
                                    </button>
                                )
                            )
                        }
                    </div>

                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                        Sonraki <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;