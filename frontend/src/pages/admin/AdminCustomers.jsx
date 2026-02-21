import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { Search, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

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
        }, search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [search, fetchCustomers]);

    const handlePageChange = (page) => {
        fetchCustomers(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Müşteriler</h1>
                    <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Toplam {pagination.totalCustomers} müşteri
                    </p>
                </div>

                <div style={{ position: 'relative', minWidth: '280px' }}>
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
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <p className="text-muted">Yükleniyor...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <p className="text-muted">{search ? 'Arama sonucu bulunamadı.' : 'Henüz müşteri yok.'}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Ad Soyad</th>
                                    <th>Telefon</th>
                                    <th>E-posta</th>
                                    <th>Rol</th>
                                    <th>Kayıt Tarihi</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(customer => (
                                    <tr key={customer._id}>
                                        <td style={{ fontWeight: 500 }}>{customer.name}</td>
                                        <td>{customer.phone || '—'}</td>
                                        <td>{customer.email || '—'}</td>
                                        <td>
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
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setSelectedCustomer(customer)}
                                            >
                                                Detay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                // Show first, last, and pages around current
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
