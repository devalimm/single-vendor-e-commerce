import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Calendar, Download, CheckSquare, Square, MinusSquare } from 'lucide-react';
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
             padding: 1.5rem !important;
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

    // Bulk selection state
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
        } catch (err) {
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

    // Toggle single row selection
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Toggle select all on current page
    const toggleSelectAll = () => {
        if (selectedIds.size === customers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(customers.map(c => c._id)));
        }
    };

    // Export to Excel (.xlsx)
    const exportToExcel = async () => {
        let dataToExport;

        if (selectedIds.size > 0) {
            // Export only selected on this page
            dataToExport = customers.filter(c => selectedIds.has(c._id));
        } else {
            // Fetch ALL customers for full export
            try {
                const response = await api.get(`/customers?page=1&limit=99999&search=${encodeURIComponent(search)}`);
                if (response.data.success) {
                    dataToExport = response.data.data.customers;
                } else {
                    setError('Dışa aktarma başarısız.');
                    return;
                }
            } catch (err) {
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
            'Rol': c.role === 'admin' ? 'Admin' : 'Müşteri',
            'İl': c.address?.city || '',
            'İlçe': c.address?.state || '',
            'Adres': c.address?.street || '',
            'Posta Kodu': c.address?.zipCode || '',
            'Kayıt Tarihi': new Date(c.createdAt).toLocaleString('tr-TR')
        }));

        const ws = XLSX.utils.json_to_sheet(rows);

        // Auto-fit column widths
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

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Müşteri Detayı</h2>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="customer-detail-grid">
                            <div className="customer-detail-item">
                                <User size={16} />
                                <div>
                                    <span className="customer-detail-label">Ad Soyad</span>
                                    <span className="customer-detail-value">{selectedCustomer.name}</span>
                                </div>
                            </div>

                            <div className="customer-detail-item">
                                <Phone size={16} />
                                <div>
                                    <span className="customer-detail-label">Telefon</span>
                                    <span className="customer-detail-value">{selectedCustomer.phone || '—'}</span>
                                </div>
                            </div>

                            {selectedCustomer.email && (
                                <div className="customer-detail-item">
                                    <Mail size={16} />
                                    <div>
                                        <span className="customer-detail-label">E-posta</span>
                                        <span className="customer-detail-value">{selectedCustomer.email}</span>
                                    </div>
                                </div>
                            )}

                            {selectedCustomer.address && (selectedCustomer.address.city || selectedCustomer.address.street) && (
                                <div className="customer-detail-item">
                                    <MapPin size={16} />
                                    <div>
                                        <span className="customer-detail-label">Adres</span>
                                        <span className="customer-detail-value">
                                            {[selectedCustomer.address.street, selectedCustomer.address.city, selectedCustomer.address.state, selectedCustomer.address.zipCode].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="customer-detail-item">
                                <Calendar size={16} />
                                <div>
                                    <span className="customer-detail-label">Kayıt Tarihi</span>
                                    <span className="customer-detail-value">{formatDateTime(selectedCustomer.createdAt)}</span>
                                </div>
                            </div>

                            <div className="customer-detail-item" style={{ borderBottom: 'none' }}>
                                <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: selectedCustomer.role === 'admin' ? 'var(--color-primary)' : 'var(--color-background)', color: selectedCustomer.role === 'admin' ? '#fff' : 'var(--color-text-secondary)', fontWeight: 500 }}>
                                    {selectedCustomer.role === 'admin' ? 'Admin' : 'Müşteri'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Table */}
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
                                    <th>Rol</th>
                                    <th>Kayıt Tarihi</th>
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
                                            <td className="td-phone" data-label="Telefon">{customer.phone || '—'}</td>
                                            <td className="td-email" data-label="E-posta">{customer.email || '—'}</td>
                                            <td className="td-role" data-label="Rol">
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    background: customer.role === 'admin' ? 'var(--color-primary)' : 'var(--color-background)',
                                                    color: customer.role === 'admin' ? '#fff' : 'var(--color-text-secondary)',
                                                    fontWeight: 500
                                                }}>
                                                    {customer.role === 'admin' ? 'Admin' : 'Müşteri'}
                                                </span>
                                            </td>
                                            <td className="td-date" data-label="Kayıt Tarihi">{formatDate(customer.createdAt)}</td>
                                            <td className="td-actions">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setSelectedCustomer(customer)}
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

            {/* Pagination */}
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
