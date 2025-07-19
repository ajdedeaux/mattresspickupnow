import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  
  if (digits.length > 0) {
    formatted = '(' + digits.slice(0, 3);
  }
  if (digits.length >= 4) {
    formatted += ') ' + digits.slice(3, 6);
  }
  if (digits.length >= 7) {
    formatted += '-' + digits.slice(6, 10);
  }
  
  return formatted;
}

export function generateLeadMessage(data: {
  mattressType: string;
  name: string;
  phone: string;
  zipCode: string;
  leadId: string;
}): string {
  const mattressNames = {
    'sealy-firm': 'Sealy Memory Foam Firm',
    'sealy-medium': 'Sealy Memory Foam Medium',
    'sealy-soft': 'Sealy Memory Foam Soft',
    'basic-hybrid': 'Basic Hybrid'
  };

  const mattressName = mattressNames[data.mattressType as keyof typeof mattressNames];
  
  return `Hi! AJ from MattressPickupNow sent me. I need a ${mattressName} under $600. My info: ${data.name}, ${data.phone}, ZIP ${data.zipCode}. AJ said you have quotes ready for pickup today. Lead: ${data.leadId}`;
}

export function openSMSApp(phoneNumber: string, message: string): void {
  const smsUrl = `sms:${phoneNumber.replace(/\D/g, '')}?body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}
