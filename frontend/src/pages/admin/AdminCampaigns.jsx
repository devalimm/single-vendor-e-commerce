import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2, Edit } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const SCOPE_LABELS = {
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
    type: 'buy_x_get_y',
    buyQty: '',
    payQty: '',
    conditionScope: 'all_products',
    targetCategories: [],
    targetProducts: [],
    startDate: getNowPlusHours(0),
    endDate: getNowPlusHours(24),
    isActive: true
});

const AdminCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
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
            const [campRes, catRes, prodRes] = await Promise.all([
                api.get('/campaigns'),
                api.get('/categories'),
                api.get('/products?limit=200')
            ]);
            setCampaigns(campRes.data.data || []);
            setCategories(catRes.data.data || []);
            setProducts(prodRes.data.data || []);
        } catch (err) {
            console.error(err);
            setError('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/campaigns');
            setCampaigns(res.data.data || []);
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
            if (name === 'conditionScope') {
                updated.targetCategories = [];
                updated.targetProducts = [];
            }
            return updated;
        });
    };

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

        // Frontend validasyonları
        const buyQty = parseInt(formData.buyQty);
        const payQty = parseInt(formData.payQty);

        if (!formData.name.trim()) {
            setError('Kampanya adı boş olamaz.');
            return;
        }
        if (!Number.isInteger(buyQty) || buyQty < 2) {
            setError('Alınması gereken adet en az 2 olmalıdır.');
            return;
        }
        if (!Number.isInteger(payQty) || payQty < 1) {
            setError('Ödenecek adet en az 1 olmalıdır.');
            return;
        }
        if (payQty >= buyQty) {
            setError('Ödenecek adet, alınması gereken adetten küçük olmalıdır.');
            return;
        }
        if (!formData.startDate || !formData.endDate) {
            setError('Başlangıç ve bitiş tarihleri gereklidir.');
            return;
        }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            setError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
            return;
        }
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
            const payload = { ...formData, buyQty, payQty };
            if (editingId) {
                await api.put(`/campaigns/${editingId}`, payload);
                setSuccess('Kampanya güncellendi!');
            } else {
                await api.post('/campaigns', payload);
                setSuccess('Kampanya oluşturuldu!');
            }
            resetForm();
            fetchCampaigns();
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (campaign) => {
        setEditingId(campaign._id);
        setFormData({
            name: campaign.name,
            type: campaign.type || 'buy_x_get_y',
            buyQty: campaign.buyQty.toString(),
            payQty: campaign.payQty.toString(),
            conditionScope: campaign.conditionScope || 'all_products',
            targetCategories: (campaign.targetCategories || []).map(c => c._id || c),
            targetProducts: (campaign.targetProducts || []).map(p => p._id || p),
            startDate: toLocalDatetimeValue(campaign.startDate),
            endDate: toLocalDatetimeValue(campaign.endDate),
            isActive: campaign.isActive
        });
        setError('');
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/campaigns/${deleteModal.id}`);
            setSuccess('Kampanya silindi!');
            fetchCampaigns();
        } catch (err) {
            setError(err.response?.data?.message || 'Silme başarısız.');
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Kampanyalar</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="discount-layout">
                {/* Sol: Form */}
                <div className="discount-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="discount-section-title">
                            {editingId ? 'KAMPANYA DÜZENLE' : 'YENİ KAMPANYA TANIMLA'}
                        </div>

                        {/* Kampanya Adı */}
                        <div className="form-group">
                            <label className="discount-field-label">KAMPANYA ADI <span style={{ color: 'var(--color-error)' }}>*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Örn: 3 Al 2 Öde Kampanyası"
                                required
                            />
                        </div>

                        {/* Kampanya Tipi */}
                        <div className="form-group">
                            <label className="discount-field-label">KAMPANYA TİPİ</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="form-select">
                                <option value="buy_x_get_y">X Al Y Öde</option>
                            </select>
                        </div>

                        {/* X al Y öde adetleri */}
                        <div className="discount-section-title" style={{ marginTop: '1.25rem' }}>
                            KAMPANYA KOŞULLARI
                        </div>
                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">
                                    ALINMASI GEREKEN ADET <span style={{ color: 'var(--color-error)' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    name="buyQty"
                                    value={formData.buyQty}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Örn: 3"
                                    min="2"
                                    step="1"
                                    required
                                />
                                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                                    Müşterinin sepete ekleyeceği ürün adedi
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="discount-field-label">
                                    ÖDENECEK ADET <span style={{ color: 'var(--color-error)' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    name="payQty"
                                    value={formData.payQty}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Örn: 2"
                                    min="1"
                                    step="1"
                                    required
                                />
                                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                                    Müşterinin ödeyeceği ürün adedi
                                </small>
                            </div>
                        </div>

                        {/* Canlı özet */}
                        {formData.buyQty && formData.payQty && parseInt(formData.payQty) < parseInt(formData.buyQty) && (
                            <div style={{
                                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                border: '1px solid #bbf7d0',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.75rem 1rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                color: '#166534'
                            }}>
                                🎁 <strong>{formData.buyQty} Al {formData.payQty} Öde</strong> —
                                {' '}{parseInt(formData.buyQty) - parseInt(formData.payQty)} adet ücretsiz
                                {' '}(her {formData.buyQty} alımda)
                            </div>
                        )}

                        {/* Kapsam */}
                        <div className="discount-section-title" style={{ marginTop: '1.25rem' }}>
                            KAMPANYA KAPSAMI
                        </div>

                        <div className="form-group">
                            <label className="discount-field-label">HANGİ ÜRÜNLER İÇİN GEÇERLİ</label>
                            <select name="conditionScope" value={formData.conditionScope} onChange={handleChange} className="form-select">
                                <option value="all_products">Tüm ürünler</option>
                                <option value="specific_category">Belirli kategoriler</option>
                                <option value="specific_products">Belirli ürünler</option>
                            </select>
                        </div>

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

                        {/* Tarihler */}
                        <div className="discount-section-title" style={{ marginTop: '1.25rem' }}>DİĞER DETAYLAR</div>
                        <div className="discount-row">
                            <div className="form-group">
                                <label className="discount-field-label">GEÇERLİLİK BAŞLANGIÇ</label>
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
                                {submitting ? 'Kaydediliyor...' : editingId ? 'GÜNCELLE' : 'KAMPANYA OLUŞTUR'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sağ: Önizleme */}
                <div className="discount-detail-card">
                    <div className="discount-detail-title">KAMPANYA DETAYI</div>
                    <ul className="discount-detail-list">
                        <li>
                            <span className="detail-key">Kampanya adı:</span>
                            <span className="detail-value">{formData.name || '-'}</span>
                        </li>
                        <li>
                            <span className="detail-key">Tip:</span>
                            <span className="detail-value">X Al Y Öde</span>
                        </li>
                        {formData.buyQty && formData.payQty && (
                            <li>
                                <span className="detail-key">Kural:</span>
                                <span className="detail-value" style={{ color: '#7c3aed', fontWeight: 'var(--font-weight-bold)' }}>
                                    {formData.buyQty} Al → {formData.payQty} Öde
                                </span>
                            </li>
                        )}
                        <li>
                            <span className="detail-key">Kapsam:</span>
                            <span className="detail-value">{SCOPE_LABELS[formData.conditionScope] || '-'}</span>
                        </li>
                        <li>
                            <span className="detail-key">Başlangıç:</span>
                            <strong className="detail-bold">{formData.startDate ? formatDate(formData.startDate) : '-'}</strong>
                        </li>
                        <li>
                            <span className="detail-key">Bitiş:</span>
                            <strong className="detail-bold">{formData.endDate ? formatDate(formData.endDate) : '-'}</strong>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="detail-key">Durum:</span>
                            <span className={`discount-status-badge ${formData.isActive ? 'badge-active' : 'badge-passive'}`}>
                                {formData.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                        </li>
                    </ul>
                    <p className="discount-note">
                        * Kampanya aynı ürüne tanımlı indirimlerle birlikte çalışabilir.<br />
                        * Aynı ürüne birden fazla kampanya varsa en avantajlısı uygulanır.
                    </p>
                </div>
            </div>

            {/* Kampanya Listesi */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                </div>
            ) : campaigns.length > 0 ? (
                <div className="admin-table-container" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Mevcut Kampanyalar</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Kampanya Adı</th>
                                <th>Kural</th>
                                <th>Kapsam</th>
                                <th>Geçerlilik</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <tr key={c._id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                            color: 'white',
                                            padding: '2px 10px',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {c.buyQty} Al {c.payQty} Öde
                                        </span>
                                    </td>
                                    <td>
                                        <div>{SCOPE_LABELS[c.conditionScope] || c.conditionScope}</div>
                                        {c.conditionScope === 'specific_category' && c.targetCategories?.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {c.targetCategories.map(cat => cat.name || cat).join(', ')}
                                            </div>
                                        )}
                                        {c.conditionScope === 'specific_products' && c.targetProducts?.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {c.targetProducts.length} ürün seçili
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.75rem' }}>
                                        {formatDate(c.startDate)} —<br />{formatDate(c.endDate)}
                                    </td>
                                    <td>
                                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-inactive'}`}>
                                            {c.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button onClick={() => handleEdit(c)} className="btn-icon" title="Düzenle">
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, id: c._id, name: c.name })}
                                                className="btn-icon btn-danger"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                    Henüz kampanya tanımlanmamış.
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
                onConfirm={handleDeleteConfirm}
                title="Kampanyayı Sil"
                message={`"${deleteModal.name}" kampanyasını silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    );
};

export default AdminCampaigns;
