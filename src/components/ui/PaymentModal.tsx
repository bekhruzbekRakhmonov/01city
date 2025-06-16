import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
// Removed: import { Text } from '@react-three/drei';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  description: string;
  type: 'land' | 'custom_model';
  userId?: string;
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  description, 
  type,
  userId 
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const processPayment = useAction(api.payments.processPayment);
  
  if (!isOpen) return null;
  
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Validate payment details
      if (paymentMethod === 'card') {
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
          throw new Error('Please fill in all card details');
        }
        if (cardDetails.number.length < 16) {
          throw new Error('Invalid card number');
        }
      } else {
        if (!cryptoWallet) {
          throw new Error('Please enter your crypto wallet address');
        }
      }
      
      // Process payment through Convex
      const paymentResult = await processPayment({
        amount,
        description,
        type,
        paymentMethod,
        paymentDetails: paymentMethod === 'card' ? {
          cardNumber: cardDetails.number.slice(-4), // Only store last 4 digits
          cardHolder: cardDetails.name
        } : {
          walletAddress: cryptoWallet
        },
        userId: userId
      });
      
      if (paymentResult.success) {
        onSuccess(paymentResult.paymentId);
        onClose();
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCardInputChange = (field: keyof typeof cardDetails, value: string) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  // Basic inline styles for demonstration. Consider using CSS modules or a styling library.
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, // Ensure it's on top
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: '#1f2937', // Equivalent to meshStandardMaterial color="#1f2937"
    padding: '20px',
    borderRadius: '8px',
    color: 'white',
    width: '400px', // Approximate width
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5em', // Equivalent to fontSize={0.6}
    marginBottom: '10px',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '0.9em', // Equivalent to fontSize={0.3}
    color: '#9ca3af',
    marginBottom: '10px',
  };

  const amountStyle: React.CSSProperties = {
    fontSize: '1.1em', // Equivalent to fontSize={0.4}
    color: '#22c55e',
    marginBottom: '15px',
  };

  const paymentMethodContainerStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const paymentMethodButtonStyle: React.CSSProperties = {
    padding: '10px 15px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: 'calc(100% - 22px)', // Account for padding and border
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #374151',
    backgroundColor: '#2d3748',
    color: 'white',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1em',
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    marginTop: '10px',
  };
  
  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={titleStyle}>Complete Payment</h2>
        <p style={descriptionStyle}>{description}</p>
        <p style={amountStyle}>${amount.toFixed(2)}</p>

        <div style={paymentMethodContainerStyle}>
          <p style={{ fontSize: '0.9em', color: 'white', marginBottom: '10px' }}>Payment Method</p>
          <button 
            style={{
              ...paymentMethodButtonStyle,
              backgroundColor: paymentMethod === 'card' ? '#3b82f6' : '#374151',
            }}
            onClick={() => setPaymentMethod('card')}
          >
            Credit Card
          </button>
          <button 
            style={{
              ...paymentMethodButtonStyle,
              backgroundColor: paymentMethod === 'crypto' ? '#3b82f6' : '#374151',
            }}
            onClick={() => setPaymentMethod('crypto')}
          >
            Cryptocurrency
          </button>
        </div>

        {paymentMethod === 'card' ? (
          <div>
            <p style={{ fontSize: '0.8em', color: '#9ca3af', marginBottom: '5px' }}>Card Number</p>
            <input 
              type="text" 
              placeholder="Card Number" 
              value={cardDetails.number} 
              onChange={(e) => handleCardInputChange('number', e.target.value)} 
              style={inputStyle}
            />
            <input 
              type="text" 
              placeholder="MM/YY" 
              value={cardDetails.expiry} 
              onChange={(e) => handleCardInputChange('expiry', e.target.value)} 
              style={{...inputStyle, width: 'calc(50% - 27px)', marginRight: '10px'}}
            />
            <input 
              type="text" 
              placeholder="CVV" 
              value={cardDetails.cvv} 
              onChange={(e) => handleCardInputChange('cvv', e.target.value)} 
              style={{...inputStyle, width: 'calc(50% - 27px)'}}
            />
            <input 
              type="text" 
              placeholder="Cardholder Name" 
              value={cardDetails.name} 
              onChange={(e) => handleCardInputChange('name', e.target.value)} 
              style={inputStyle}
            />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.8em', color: '#9ca3af', marginBottom: '5px' }}>Crypto Wallet Address</p>
            <input 
              type="text" 
              placeholder="Wallet Address" 
              value={cryptoWallet} 
              onChange={(e) => setCryptoWallet(e.target.value)} 
              style={inputStyle}
            />
          </div>
        )}

        {error && <p style={errorStyle}>{error}</p>}

        <button 
          onClick={handlePayment} 
          disabled={isProcessing} 
          style={{...buttonStyle, backgroundColor: '#3b82f6', color: 'white', marginTop: '20px'}}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
        <button 
          onClick={onClose} 
          style={{...buttonStyle, backgroundColor: '#4b5563', color: 'white', marginTop: '20px', marginLeft: '10px'}}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PaymentModal;