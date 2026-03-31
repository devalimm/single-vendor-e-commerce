import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const AdminOptions = () => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingOption, setEditingOption] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, optionId: null, optionName: '' });

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/options');
            setOptions(response.data.data);
        } catch (error) {
            console.error('Error fetching options:', error);
            setError('Opsiyonlar yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name.trim()) {
            setError('Lütfen bir opsiyon adı giriniz.');
            return;
        }

        try {
            const payload = {
                name: formData.name.trim(),
                price: parseFloat(formData.price) || 0
            };

            if (editingOption) {
                await api.put(`/options/${editingOption._id}`, payload);
                setSuccess('Opsiyon güncellendi!');
            } else {
                await api.post('/options', payload);
                setSuccess('Opsiyon eklendi!');
            }

            resetForm();
            fetchOptions();
        } catch (error) {
            setError(error.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    const handleEdit = (option) => {
        setEditingOption(option);
        setFormData({
            name: option.name,
            price: option.price === 0 ? '' : option.price
        });
        setShowForm(true);
    };

    const handleDeleteClick = (option) => {
        setDeleteModal({
            isOpen: true,
            optionId: option._id,
            optionName: option.name
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/options/${deleteModal.optionId}`);
            setSuccess('Opsiyon silindi!');
            fetchOptions();
        } catch (error) {
            setError(error.response?.data?.message || 'Silme işlemi başarısız.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingOption(null);
        setFormData({ name: '', price: '' });
        setError('');
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
                <h1>Ekstra Opsiyonlar</h1>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="btn btn-primary"
                >
                    {showForm ? 'İptal' : '+ Yeni Opsiyon'}
                </button>
            </div>

            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                Tüm ürünleriniz için kullanabileceğiniz genel ekstra opsiyonları (Örn: Özel Kutu, Gizli Fermuar vb.) ve fiyatlarını buradan yönetebilirsiniz.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>{editingOption ? 'Opsiyon Düzenle' : 'Yeni Opsiyon'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Opsiyon Adı *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Örn: Özel Kutu, Pırıltılı İşleme vb."
                            />
                        </div>

                        <div className="form-group">
                            <label>Ekstra Fiyat (₺)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="Ücretsiz ise boş bırakabilirsiniz"
                                min="0"
                                step="any"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingOption ? 'Güncelle' : 'Kaydet'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-table-container">
                {options.length === 0 ? (
                    <div className="empty-state">
                        <p>Henüz bir ekstra opsiyon tanımlanmamış.</p>
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            İlk Opsiyonu Tanımla
                        </button>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Opsiyon Adı</th>
                                <th>Ekstra Fiyat (₺)</th>
                                <th>Durum</th>
                                <th style={{ textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {options.map((option) => (
                                <tr key={option._id}>
                                    <td><strong>{option.name}</strong></td>
                                    <td>
                                        {option.price > 0 ? (
                                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                +{option.price} ₺
                                            </span>
                                        ) : (
                                            <span className="text-muted">Ücretsiz (0 ₺)</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${option.isActive ? 'badge-success' : 'badge-inactive'}`}>
                                            {option.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(option)}
                                                className="btn-icon"
                                                title="Düzenle"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(option)}
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
                onClose={() => setDeleteModal({ isOpen: false, optionId: null, optionName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Opsiyonu Sil"
                message={`"${deleteModal.optionName}" opsiyonunu silmek istediğinizden emin misiniz? Bu opsiyonu seçen ürünlerde seçenek kaybolabilir.`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    );
};

export default AdminOptions;
