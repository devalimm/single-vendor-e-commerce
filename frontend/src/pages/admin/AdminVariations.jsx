import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const AdminVariations = () => {
    const [variations, setVariations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVariation, setEditingVariation] = useState(null);
    const [formData, setFormData] = useState({ name: '', options: [] });
    const [optionInput, setOptionInput] = useState('');
    const [optionPriceInput, setOptionPriceInput] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, variationId: null, variationName: '' });

    useEffect(() => {
        fetchVariations();
    }, []);

    const fetchVariations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/variations');
            setVariations(response.data.data);
        } catch (error) {
            console.error('Error fetching variations:', error);
            setError('Varyasyonlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.options.length === 0) {
            setError('En az bir seçenek eklemelisiniz.');
            return;
        }

        try {
            if (editingVariation) {
                await api.put(`/variations/${editingVariation._id}`, formData);
                setSuccess('Varyasyon güncellendi!');
            } else {
                await api.post('/variations', formData);
                setSuccess('Varyasyon eklendi!');
            }

            resetForm();
            fetchVariations();
        } catch (error) {
            setError(error.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    const handleEdit = (variation) => {
        setEditingVariation(variation);
        
        // Normalize old string options to new object structure
        const normalizedOptions = variation.options.map(opt => {
            if (typeof opt === 'string') {
                return { name: opt, extraPrice: 0 };
            }
            return opt;
        });

        setFormData({
            name: variation.name,
            options: normalizedOptions
        });
        setShowForm(true);
        setOptionInput('');
        setOptionPriceInput('');
    };

    const handleDeleteClick = (variation) => {
        setDeleteModal({
            isOpen: true,
            variationId: variation._id,
            variationName: variation.name
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/variations/${deleteModal.variationId}`);
            setSuccess('Varyasyon silindi!');
            fetchVariations();
        } catch (error) {
            setError(error.response?.data?.message || 'Silme işlemi başarısız.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingVariation(null);
        setFormData({ name: '', options: [] });
        setOptionInput('');
        setOptionPriceInput('');
        setError('');
    };

    // --- Tag-input style option management ---
    const addOption = () => {
        const trimmed = optionInput.trim();
        if (!trimmed) return;
        
        // Check if name already exists
        const exists = formData.options.some(opt => {
           const optName = typeof opt === 'string' ? opt : opt.name;
           return optName.toLowerCase() === trimmed.toLowerCase();
        });

        if (exists) {
            setError('Bu seçenek zaten eklenmiş.');
            return;
        }

        const price = parseFloat(optionPriceInput) || 0;

        setFormData({ 
            ...formData, 
            options: [...formData.options, { name: trimmed, extraPrice: price }] 
        });
        setOptionInput('');
        setOptionPriceInput('');
        setError('');
    };

    const removeOption = (index) => {
        setFormData({
            ...formData,
            options: formData.options.filter((_, i) => i !== index)
        });
    };

    const handleOptionKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addOption();
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Varyasyon Tanımlama</h1>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="btn btn-primary"
                >
                    {showForm ? 'İptal' : '+ Yeni Varyasyon'}
                </button>
            </div>

            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Satışta olan ürünleriniz için seçenek sunmak isterseniz (ör: Beden, Renk, Ayakkabı Numarası vb.)
                ilgili varyasyonları ve seçenekleri bu bölümde tanımlayabilirsiniz.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>{editingVariation ? 'Varyasyon Düzenle' : 'Yeni Varyasyon'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Varyasyon Adı *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Örn: Beden, Renk, Numara"
                            />
                        </div>

                        <div className="form-group">
                            <label>Seçenekler *</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={optionInput}
                                    onChange={(e) => setOptionInput(e.target.value)}
                                    onKeyDown={handleOptionKeyDown}
                                    placeholder="Seçenek adı (Örn: S, 150 cm)"
                                    style={{ flex: 2 }}
                                />
                                <input
                                    type="number"
                                    className="form-input"
                                    value={optionPriceInput}
                                    onChange={(e) => setOptionPriceInput(e.target.value)}
                                    onKeyDown={handleOptionKeyDown}
                                    placeholder="Ek Fiyat (₺)"
                                    style={{ flex: 1 }}
                                    min="0"
                                />
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <Plus size={16} /> Ekle
                                </button>
                            </div>

                            {formData.options.length > 0 && (
                                <div className="variation-tags">
                                    {formData.options.map((option, index) => {
                                        const optName = typeof option === 'string' ? option : option.name;
                                        const optPrice = typeof option === 'object' && option.extraPrice ? option.extraPrice : 0;
                                        
                                        return (
                                            <span key={index} className="variation-tag">
                                                {optName} {optPrice > 0 ? `(+${optPrice}₺)` : ''}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="variation-tag-remove"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {formData.options.length === 0 && (
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    Henüz seçenek eklenmemiş. Yukarıdaki alandan seçenek ekleyin.
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingVariation ? 'Güncelle' : 'Kaydet'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-table-container">
                {variations.length === 0 ? (
                    <div className="empty-state">
                        <p>Henüz varyasyon tanımlanmamış.</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            İlk Varyasyonu Tanımla
                        </button>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Varyasyon Adı</th>
                                <th>Seçenekler</th>
                                <th>Seçenek Sayısı</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variations.map((variation) => (
                                <tr key={variation._id}>
                                    <td><strong>{variation.name}</strong></td>
                                    <td>
                                        <div className="variation-tags-sm">
                                            {variation.options.map((opt, i) => {
                                                const optName = typeof opt === 'string' ? opt : opt.name;
                                                const optPrice = typeof opt === 'object' && opt.extraPrice ? opt.extraPrice : 0;
                                                return (
                                                    <span key={i} className="variation-tag-sm">
                                                        {optName} {optPrice > 0 ? `(+${optPrice}₺)` : ''}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td>{variation.options.length}</td>
                                    <td>
                                        <span className={`badge ${variation.isActive ? 'badge-success' : 'badge-inactive'}`}>
                                            {variation.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                onClick={() => handleEdit(variation)}
                                                className="btn-icon"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(variation)}
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
                )}
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, variationId: null, variationName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Varyasyonu Sil"
                message={`"${deleteModal.variationName}" varyasyonunu silmek istediğinizden emin misiniz? Bu varyasyonu kullanan ürünler etkilenebilir.`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    );
};

export default AdminVariations;
