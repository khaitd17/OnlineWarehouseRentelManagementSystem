// Simple service import test
import {
  authService,
  warehouseService,
  rentalService,
  paymentService
} from '../services/index';

console.log('=== Services Import Test ===');
console.log('authService:', authService ? 'OK' : 'UNDEFINED');
console.log('warehouseService:', warehouseService ? 'OK' : 'UNDEFINED');
console.log('rentalService:', rentalService ? 'OK' : 'UNDEFINED');
console.log('paymentService:', paymentService ? 'OK' : 'UNDEFINED');

// Test payment service specifically
if (paymentService) {
  console.log('\n=== PaymentService Test ===');
  console.log('formatAmount method:', typeof paymentService.formatAmount);

  if (typeof paymentService.formatAmount === 'function') {
    const formatted = paymentService.formatAmount(1000000);
    console.log('formatAmount(1000000):', formatted);
    console.log('Contains "VND":', formatted.includes('VND'));
  }
}

export default {};