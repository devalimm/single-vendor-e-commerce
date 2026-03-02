import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle, XCircle, Loader, Home } from 'lucide-react';

const PaymentCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const paramStatus = searchParams.get('status');
        const orderId = searchParams.get('orderId');
        const message = searchParams.get('message');

        if (paramStatus === 'error') {
            setStatus('error');
            setErrorMessage(message || 'Ödeme işlemi başarısız oldu.');
            return;
        }

        if (paramStatus === 'success' && orderId) {
            clearCart();
            setStatus('success');
            // Redirect to order success after a brief moment
            setTimeout(() => {
                navigate('/order-success', {
                    state: { orderId },
                    replace: true
                });
            }, 100);
            return;
        }

        // Fallback: unknown state
        setStatus('error');
        setErrorMessage('Geçersiz ödeme yanıtı.');
    }, [searchParams, navigate, clearCart]);

    return (
        <div className="container" style={{
            padding: '4rem 0',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            {status === 'loading' && (
                <>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #6d28d9))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        animation: 'pulse 2s infinite'
                    }}>
                        <Loader size={50} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <h2>Ödeme Kontrol Ediliyor...</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                        Lütfen bekleyin, ödemeniz doğrulanıyor.
                    </p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-success), #10b981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <CheckCircle size={50} color="white" />
                    </div>
                    <h2 style={{ color: 'var(--color-success)' }}>Ödeme Başarılı!</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                        Sipariş sayfasına yönlendiriliyorsunuz...
                    </p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-danger), #ef4444)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <XCircle size={50} color="white" />
                    </div>
                    <h2 style={{ color: 'var(--color-danger)' }}>Ödeme Başarısız</h2>
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        marginTop: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {errorMessage}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/checkout" className="btn btn-primary">
                            Tekrar Dene
                        </Link>
                        <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Home size={18} />
                            Anasayfa
                        </Link>
                    </div>
                </>
            )}

            <style>{`
            @keyframes spin {
               from { transform: rotate(0deg); }
               to { transform: rotate(360deg); }
            }
            @keyframes pulse {
               0%, 100% { transform: scale(1); opacity: 1; }
               50% { transform: scale(1.05); opacity: 0.8; }
            }
         `}</style>
        </div>
    );
};

export default PaymentCallback;
