import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '@react-three/drei';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  description: string;
  type: 'land' | 'custom_model';
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  description, 
  type 
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
  
  const processPayment = useMutation(api.payments.processPayment);
  
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
        }
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
  
  return (
    <group position={[0, 5, 0]}>
      {/* Background overlay */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#000000" opacity={0.7} transparent />
      </mesh>
      
      {/* Modal container */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[16, 12]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        
        {/* Title */}
        <Text
          position={[0, 5, 0]}
          fontSize={0.6}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Complete Payment
        </Text>
        
        {/* Description */}
        <Text
          position={[0, 4, 0]}
          fontSize={0.3}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
        >
          {description}
        </Text>
        
        {/* Amount */}
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.4}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          ${amount.toFixed(2)}
        </Text>
        
        {/* Payment method selection */}
        <group position={[0, 2.2, 0]}>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Payment Method
          </Text>
          
          {/* Card option */}
          <group 
            position={[-2, -0.3, 0]} 
            onClick={() => setPaymentMethod('card')}
          >
            <mesh>
              <planeGeometry args={[3, 0.8]} />
              <meshStandardMaterial 
                color={paymentMethod === 'card' ? '#3b82f6' : '#374151'} 
              />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.25}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Credit Card
            </Text>
          </group>
          
          {/* Crypto option */}
          <group 
            position={[2, -0.3, 0]} 
            onClick={() => setPaymentMethod('crypto')}
          >
            <mesh>
              <planeGeometry args={[3, 0.8]} />
              <meshStandardMaterial 
                color={paymentMethod === 'crypto' ? '#3b82f6' : '#374151'} 
              />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.25}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Cryptocurrency
            </Text>
          </group>
        </group>
        
        {/* Payment form */}
        {paymentMethod === 'card' ? (
          <group position={[0, 0.5, 0]}>
            <Text
              position={[0, 0.8, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              Card Number: {cardDetails.number || 'Enter card number'}
            </Text>
            <Text
              position={[-2, 0.3, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              Expiry: {cardDetails.expiry || 'MM/YY'}
            </Text>
            <Text
              position={[2, 0.3, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              CVV: {cardDetails.cvv || '***'}
            </Text>
            <Text
              position={[0, -0.2, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              Name: {cardDetails.name || 'Cardholder name'}
            </Text>
            
            {/* Simulated form note */}
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.2}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              Demo: Use any test card details
            </Text>
          </group>
        ) : (
          <group position={[0, 0.5, 0]}>
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              Wallet Address:
            </Text>
            <Text
              position={[0, -0.1, 0]}
              fontSize={0.25}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
            >
              {cryptoWallet || 'Enter wallet address'}
            </Text>
            
            {/* Simulated form note */}
            <Text
              position={[0, -0.6, 0]}
              fontSize={0.2}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              Demo: Use any test wallet address
            </Text>
          </group>
        )}
        
        {/* Error message */}
        {error && (
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.25}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
          >
            {error}
          </Text>
        )}
        
        {/* Action buttons */}
        <group position={[0, -2.5, 0]}>
          {/* Pay button */}
          <group 
            position={[-2, 0, 0]} 
            onClick={!isProcessing ? handlePayment : undefined}
          >
            <mesh>
              <planeGeometry args={[3, 1]} />
              <meshStandardMaterial 
                color={isProcessing ? '#6b7280' : '#22c55e'} 
              />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </Text>
          </group>
          
          {/* Cancel button */}
          <group 
            position={[2, 0, 0]} 
            onClick={!isProcessing ? onClose : undefined}
          >
            <mesh>
              <planeGeometry args={[3, 1]} />
              <meshStandardMaterial color="#6b7280" />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              Cancel
            </Text>
          </group>
        </group>
        
        {/* Demo note */}
        <Text
          position={[0, -4, 0]}
          fontSize={0.2}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
        >
          This is a demo payment system
        </Text>
        
        {/* Auto-fill demo data button */}
        <group 
          position={[0, -4.8, 0]} 
          onClick={() => {
            if (paymentMethod === 'card') {
              setCardDetails({
                number: '4111111111111111',
                expiry: '12/25',
                cvv: '123',
                name: 'Demo User'
              });
            } else {
              setCryptoWallet('0x1234567890abcdef1234567890abcdef12345678');
            }
          }}
        >
          <mesh>
            <planeGeometry args={[4, 0.6]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Fill Demo Data
          </Text>
        </group>
      </group>
    </group>
  );
}

export default PaymentModal;