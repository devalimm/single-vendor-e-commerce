import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2, Edit } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const METHOD_LABELS = {
    coupon_code: 'Kupon Kodu',
    automatic: 'Otomatik'
};

const TYPE_LABELS = {
    percentage: 'Yüzdelik',
    fixed_amount: 'Sabit Tutar'
};

const CONDITION_SCOPE_LABELS = {
    all_products: 'Tüm ürünler',
    specific_category: 'Belirli kategoriler',
    specific_products: 'Belirli ürünler'
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const toLocalDatetimeValue = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

const getNowPlusHours = (h) => {
    const d = new Date();
    d.setHours(d.getHours() + h);
    return toLocalDatetimeValue(d);
};

const defaultForm = () => ({
    name: '',
    method: '',
    type: '',
    currency: 'TRY',
    conditionScope: 'all_products',
    targetCategories: [],
    targetProducts: [],
    condition: 'min_cart_amount',
    conditionValue: '',
    value: '',
    startDate: getNowPlusHours(0),
    endDate: getNowPlusHours(24),
    isActive: false
});

const AdminDiscount = () => {
    const [discounts, setDiscounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(defaultForm());
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [discRes, catRes, prodRes] = await Promise.all([
                api.get('/discounts'),
                api.get('/categories'),
                api.get('/products')
            ]);
            setDiscounts(discRes.data.data || []);
            setCategories(catRes.data.data || []);
            setProducts(prodRes.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscounts = async () => {
        try {
            const res = await api.get('/discounts');
            setDiscounts(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type: inputType, checked } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: inputType === 'checkbox' ? checked : value
            };
            // Kapsam değişince seçimleri sıfırla
            if (name === 'conditionScope') {
                updated.targetCategories = [];
                updated.targetProducts = [];
            }
            return updated;
        });
    };

    // Çoklu seçim: kategori veya ürün toggle
    const handleMultiToggle = (field, id) => {
        setFormData(prev => {
            const current = prev[field] || [];
            const exists = current.includes(id);
            return {
                ...prev,
                [field]: exists ? current.filter(x => x !== id) : [...current, id]
            };
        });
    };

    const resetForm = () => {
        setFormData(defaultForm());
        setEditingId(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Kapsam validasyonu
        if (formData.conditionScope === 'specific_category' && formData.targetCategories.length === 0) {
            setError('Lütfen en az bir kategori seçin.');
            return;
        }
        if (formData.conditionScope === 'specific_products' && formData.targetProducts.length === 0) {
            setError('Lütfen en az bir ürün seçin.');
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/discounts/${editingId}`, formData);
                setSuccess('İndirim güncellendi!');
            } else {
                await api.post('/discounts', formData);
                setSuccess('İndirim tanımlandı!');
            }
            resetForm();
            fetchDiscounts();
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (discount) => {
        setEditingId(discount._id);
        setFormData({
            name: discount.name,
            method: discount.method,
            type: discount.type,
            currency: discount.currency || 'TRY',
            conditionScope: discount.conditionScope || 'all_products',
            targetCategories: (discount.targetCategories || []).map(c => c._id || c),
            targetProducts: (discount.targetProducts || []).map(p => p._id || p),
            condition: discount.condition || 'min_cart_amount',
            conditionValue: discount.conditionValue ?? '',
            value: discount.value,
            startDate: toLocalDatetimeValue(discount.startDate),
            endDate: toLocalDatetimeValue(discount.endDate),
            isActive: discount.isActive
        });
        setError('');
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/discounts/${deleteModal.id}`);
            setSuccess('İndirim silindi!');
            fetchDiscounts();
        } catch (err) {
            setError(err.response?.data?.message || 'Silme başarısız.');
        }
    };

    // Canlı önizleme
    const preview = {
        name: formData.name || '-',
        method: formData.method ? METHOD_LABELS[formData.method] : '-',
        type: formData.type ? TYPE_LABELS[formData.type] : '-',
        startDate: formData.startDate ? formatDate(formData.startDate) : '-',
        endDate: formData.endDate ? formatDate(formData.endDate) : '-',
        isActive: formData.isActive
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>İndirimler</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* 2 sütunlu Shopier tarzı layout */}
            <div className="discount-layout">
                {/* Sol: Form */}
                <div className="discount-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="discount-section-title">İNDİRİM TANIMLA</div>

                        {/* Yöntem + Tip */}
                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">İNDİRİM YÖNTEMİ</label>
                                <select name="method" value={formData.method} onChange={handleChange} className="form-select" required>
                                    <option value="">Seçiniz...</option>
                                    <option value="coupon_code">Kupon Kodu</option>
                                    <option value="automatic">Otomatik</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="discount-field-label">İNDİRİM TİPİ</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="form-select" required>
                                    <option value="">Seçiniz...</option>
                                    <option value="percentage">Yüzdelik (%)</option>
                                    <option value="fixed_amount">Sabit Tutar (TL)</option>
                                </select>
                            </div>
                        </div>

                        {/* Ad + Para Birimi */}
                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">İNDİRİM ADI</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="İndirimin adını giriniz" required />
                            </div>
                            <div className="form-group">
                                <label className="discount-field-label">PARA BİRİMİ</label>
                                <select name="currency" value={formData.currency} onChange={handleChange} className="form-select">
                                    <option value="TRY">TL</option>
                                </select>
                            </div>
                        </div>

                        {/* İndirim Değeri */}
                        <div className="form-group">
                            <label className="discount-field-label">
                                İNDİRİM DEĞERİ {formData.type === 'percentage' ? '(%)' : formData.type === 'fixed_amount' ? '(TL)' : ''}
                            </label>
                            <input type="number" name="value" value={formData.value} onChange={handleChange} className="form-input" placeholder="İndirim değeri giriniz" min="0" step="0.01" required />
                        </div>

                        {/* Koşul bölümü */}
                        <div className="discount-section-title" style={{ marginTop: '1.25rem' }}>MÜŞTERİ ŞUNU SATIN ALIRSA</div>

                        {/* Koşul Kapsamı */}
                        <div className="form-group">
                            <label className="discount-field-label">KOŞUL KAPSAMI</label>
                            <select name="conditionScope" value={formData.conditionScope} onChange={handleChange} className="form-select">
                                <option value="all_products">Tüm ürünler</option>
                                <option value="specific_category">Belirli kategoriler</option>
                                <option value="specific_products">Belirli ürünler</option>
                            </select>
                        </div>

                        {/* Dinamik: Kategori seçimi */}
                        {formData.conditionScope === 'specific_category' && (
                            <div className="form-group">
                                <label className="discount-field-label">KATEGORİLER <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                {categories.length === 0 ? (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Henüz kategori yok.</p>
                                ) : (
                                    <div className="discount-checklist">
                                        {categories.map(cat => (
                                            <label key={cat._id} className="discount-check-item">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetCategories.includes(cat._id)}
                                                    onChange={() => handleMultiToggle('targetCategories', cat._id)}
                                                />
                                                <span>{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dinamik: Ürün seçimi */}
                        {formData.conditionScope === 'specific_products' && (
                            <div className="form-group">
                                <label className="discount-field-label">ÜRÜNLER <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                {products.length === 0 ? (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Henüz ürün yok.</p>
                                ) : (
                                    <div className="discount-checklist">
                                        {products.map(prod => (
                                            <label key={prod._id} className="discount-check-item">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetProducts.includes(prod._id)}
                                                    onChange={() => handleMultiToggle('targetProducts', prod._id)}
                                                />
                                                <span>{prod.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Koşul + Değer */}
                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">KOŞUL</label>
                                <select name="condition" value={formData.condition} onChange={handleChange} className="form-select">
                                    <option value="min_cart_amount">Minimum alışveriş tutarı</option>
                                    <option value="no_condition">Koşulsuz</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="discount-field-label">KOŞUL DEĞERİ</label>
                                <input
                                    type="number"
                                    name="conditionValue"
                                    value={formData.conditionValue}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Minimum tutar giriniz"
                                    min="0"
                                    disabled={formData.condition === 'no_condition'}
                                />
                            </div>
                        </div>

                        {/* Diğer detaylar */}
                        <div className="discount-section-title" style={{ marginTop: '1.25rem' }}>DİĞER DETAYLAR</div>

                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">GEÇERLİLİK BAŞLANGIC</label>
                                <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label className="discount-field-label">GEÇERLİLİK BİTİŞ</label>
                                <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="form-input" required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="discount-field-label">DURUMU</label>
                            <div className="discount-toggle-row">
                                <span className="discount-toggle-label">
                                    {formData.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                                <label className="discount-toggle">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                                    <span className="discount-toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="discount-actions">
                            {editingId && (
                                <button type="button" onClick={resetForm} className="btn btn-secondary">İptal</button>
                            )}
                            <button type="submit" className="btn discount-submit-btn" disabled={submitting}>
                                {submitting ? 'Kaydediliyor...' : editingId ? 'GÜNCELLE' : 'İNDİRİM TANIMLA'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sağ: Canlı önizleme */}
                <div className="discount-detail-card">
                    <div className="discount-detail-title">İNDİRİM DETAYI</div>
                    <ul className="discount-detail-list">
                        <li>
                            <span className="detail-key">İndirim adı:</span>
                            <span className="detail-value">{preview.name}</span>
                        </li>
                        <li>
                            <span className="detail-key">Yöntemi/Tipi:</span>
                            <span className="detail-value">
                                {formData.method && formData.type ? `${preview.method} / ${preview.type}` : '-/-'}
                            </span>
                        </li>
                        {formData.conditionScope !== 'all_products' && (
                            <li>
                                <span className="detail-key">Kapsam:</span>
                                <span className="detail-value">{CONDITION_SCOPE_LABELS[formData.conditionScope]}</span>
                            </li>
                        )}
                        {formData.conditionScope === 'specific_category' && formData.targetCategories.length > 0 && (
                            <li style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-key">Kategoriler:</span>
                                <span className="detail-value" style={{ marginTop: '0.2rem' }}>
                                    {formData.targetCategories
                                        .map(id => categories.find(c => c._id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ')}
                                </span>
                            </li>
                        )}
                        {formData.conditionScope === 'specific_products' && formData.targetProducts.length > 0 && (
                            <li style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-key">Ürünler ({formData.targetProducts.length} adet):</span>
                                <span className="detail-value" style={{ marginTop: '0.2rem' }}>
                                    {formData.targetProducts
                                        .map(id => products.find(p => p._id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ')}
                                </span>
                            </li>
                        )}
                    </ul>

                    <ul className="discount-detail-list" style={{ marginTop: '1rem' }}>
                        <li>
                            <span className="detail-key">Geç. başlangıç:</span>
                            <strong className="detail-bold">{preview.startDate}</strong>
                        </li>
                        <li>
                            <span className="detail-key">Geçerlilik bitiş:</span>
                            <strong className="detail-bold">{preview.endDate}</strong>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="detail-key">Durum:</span>
                            <span className={`discount-status-badge ${preview.isActive ? 'badge-active' : 'badge-passive'}`}>
                                {preview.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                        </li>
                    </ul>

                    <p className="discount-note">*Bu indirim başka kampanyalarla birlikte uygulanamaz.</p>
                </div>
            </div>

            {/* Mevcut indirimler listesi */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                </div>
            ) : discounts.length > 0 ? (
                <div className="admin-table-container" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Mevcut İndirimler</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>İndirim Adı</th>
                                <th>Yöntem</th>
                                <th>Tip / Değer</th>
                                <th>Kapsam</th>
                                <th>Geçerlilik</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map((d) => (
                                <tr key={d._id}>
                                    <td><strong>{d.name}</strong></td>
                                    <td>{METHOD_LABELS[d.method] || d.method}</td>
                                    <td>
                                        {TYPE_LABELS[d.type] || d.type} —{' '}
                                        {d.type === 'percentage' ? `%${d.value}` : `${d.value} TL`}
                                    </td>
                                    <td>
                                        <div>{CONDITION_SCOPE_LABELS[d.conditionScope] || d.conditionScope}</div>
                                        {d.conditionScope === 'specific_category' && d.targetCategories?.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {d.targetCategories.map(c => c.name || c).join(', ')}
                                            </div>
                                        )}
                                        {d.conditionScope === 'specific_products' && d.targetProducts?.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {d.targetProducts.length} ürün seçili
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.75rem' }}>
                                        {formatDate(d.startDate)} —<br />{formatDate(d.endDate)}
                                    </td>
                                    <td>
                                        <span className={`badge ${d.isActive ? 'badge-success' : 'badge-inactive'}`}>
                                            {d.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button onClick={() => handleEdit(d)} className="btn-icon" title="Düzenle">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, id: d._id, name: d.name })} className="btn-icon btn-danger" title="Sil">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
                onConfirm={handleDeleteConfirm}
                title="İndirimi Sil"
                message={`"${deleteModal.name}" indirimini silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    );
};

export default AdminDiscount;
