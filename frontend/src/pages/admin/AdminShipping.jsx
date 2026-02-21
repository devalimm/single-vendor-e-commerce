import { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminShipping = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [settings, setSettings] = useState({
        standardShippingFee: 30,
        applyToFreeShippingProducts: false,
        calculationMethod: 'single',
        perItemExtraFee: 0,
        freeShippingEnabled: true,
        freeShippingThreshold: 500
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/shipping-settings');
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (err) {
            setError('Kargo ayarları yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/shipping-settings', {
                standardShippingFee: parseFloat(settings.standardShippingFee) || 0,
                applyToFreeShippingProducts: settings.applyToFreeShippingProducts,
                calculationMethod: settings.calculationMethod,
                perItemExtraFee: parseFloat(settings.perItemExtraFee) || 0,
                freeShippingEnabled: settings.freeShippingEnabled,
                freeShippingThreshold: parseFloat(settings.freeShippingThreshold) || 0
            });

            if (response.data.success) {
                setSuccess('Kargo ayarları kaydedildi!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Kaydetme sırasında hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const calculationMethods = [
        { value: 'single', label: 'Sepetin toplamı için tek bir ürünün kargo ücretini uygula' },
        { value: 'sum_all', label: 'Sepetteki tüm ürünlerin kargo ücretlerini toplayarak uygula' },
        { value: 'first_plus', label: 'Sepetteki ilk ürünün kargo ücreti üzerine ürün başına ücret ekle' },
        { value: 'threshold', label: 'Sepetin toplamını eşik değere karşılaştırarak kargo ücreti belirle' },
        { value: 'delivery', label: 'Müşterinin seçeceği teslimat yöntemine göre ücret belirle' }
    ];

    if (loading) {
        return (
            <div className="admin-page">
                <h1>Kargo Ayarları</h1>
                <div className="card"><p>Yükleniyor...</p></div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>Kargo Ayarları</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* Kargo Ücret Detayları */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                    Kargo Ücret Detayları
                </h3>

                <div className="form-row" style={{ gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                        <label>Standart Kargolama Ücreti</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.standardShippingFee}
                            onChange={(e) => setSettings({ ...settings, standardShippingFee: e.target.value })}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Para Birimi</label>
                        <select className="form-select" value="TL" disabled>
                            <option value="TL">TL</option>
                        </select>
                    </div>
                </div>

                <label className="shipping-checkbox-label" style={{ marginTop: '0.75rem' }}>
                    <input
                        type="checkbox"
                        checked={settings.applyToFreeShippingProducts}
                        onChange={(e) => setSettings({ ...settings, applyToFreeShippingProducts: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                    />
                    <span>Standart Kargo Ücreti, Ücretsiz Kargo'lu ürünlerim için de geçerli olsun.</span>
                </label>
            </div>

            {/* Kargo Ücreti Hesaplama */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                    Kargo Ücreti Hesaplama
                </h3>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <select
                        className="form-select"
                        value={settings.calculationMethod}
                        onChange={(e) => setSettings({ ...settings, calculationMethod: e.target.value })}
                    >
                        {calculationMethods.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {settings.calculationMethod === 'first_plus' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Ek Ürün Başına Ücret (₺)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={settings.perItemExtraFee}
                            onChange={(e) => setSettings({ ...settings, perItemExtraFee: e.target.value })}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                )}

                <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    Standart kargolama ücretini güncellediğinizde mevcut ürünleriniz kargolama ücretleri de güncellenecektir.
                </p>
            </div>

            {/* Ücretsiz Kargo Opsiyonu */}
            <div className="card">
                <h3 style={{ marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                    Ücretsiz Kargo Opsiyonu
                </h3>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                    <label className="shipping-radio-label">
                        <input
                            type="radio"
                            name="freeShipping"
                            checked={settings.freeShippingEnabled}
                            onChange={() => setSettings({ ...settings, freeShippingEnabled: true })}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>Açık</span>
                    </label>
                    <label className="shipping-radio-label">
                        <input
                            type="radio"
                            name="freeShipping"
                            checked={!settings.freeShippingEnabled}
                            onChange={() => setSettings({ ...settings, freeShippingEnabled: false })}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>Kapalı</span>
                    </label>
                </div>

                {settings.freeShippingEnabled && (
                    <div className="form-row" style={{ gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Ücretsiz Kargo İçin Sipariş Tutarı</label>
                            <input
                                type="number"
                                className="form-input"
                                value={settings.freeShippingThreshold}
                                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Para Birimi</label>
                            <select className="form-select" value="TL" disabled>
                                <option value="TL">TL</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminShipping;
