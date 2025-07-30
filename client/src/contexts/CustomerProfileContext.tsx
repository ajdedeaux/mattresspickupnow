import React, { createContext, useContext, useState, useEffect } from 'react';

// Helper function to make API requests and handle JSON parsing
const makeApiRequest = async (url: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) => {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  return await res.json();
};

export interface CustomerProfile {
  trackingId: string;
  referenceCode?: string;
  name?: string;
  zipCode?: string;
  demographics?: string;
  mattressSize?: string;
  firmness?: string;
  model?: string;
  finalPrice?: string;
  coordinates?: { lat: number; lng: number };
  nearestStores?: Array<{
    name: string;
    phone: string;
    address: string;
    distance: number;
  }>;
  profileComplete?: boolean;
  contactMethod?: string;
  status?: string;
  priceLockExpiry?: string;
}

interface CustomerProfileContextType {
  profile: CustomerProfile | null;
  trackingId: string | null;
  createProfile: () => Promise<void>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<void>;
  generateReferenceCode: () => Promise<string>;
  isLoading: boolean;
}

const CustomerProfileContext = createContext<CustomerProfileContextType | undefined>(undefined);

export const useCustomerProfile = () => {
  const context = useContext(CustomerProfileContext);
  if (context === undefined) {
    throw new Error('useCustomerProfile must be used within a CustomerProfileProvider');
  }
  return context;
};

interface CustomerProfileProviderProps {
  children: React.ReactNode;
}

export const CustomerProfileProvider: React.FC<CustomerProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize profile on app start
  useEffect(() => {
    const initializeProfile = async () => {
      // Check if we already have a tracking ID in sessionStorage
      const existingTrackingId = sessionStorage.getItem('customer-tracking-id');
      
      if (existingTrackingId) {
        setTrackingId(existingTrackingId);
        try {
          // Try to fetch existing profile
          const response = await makeApiRequest(`/api/customer-profiles/${existingTrackingId}`);
          if (response.success) {
            setProfile(response.profile);
          }
        } catch (error) {
          console.warn('Could not fetch existing profile, creating new one');
          await createNewProfile();
        }
      } else {
        // Create new profile
        await createNewProfile();
      }
    };

    const createNewProfile = async () => {
      try {
        setIsLoading(true);
        const response = await makeApiRequest('/api/customer-profiles', 'POST');
        if (response.success) {
          setTrackingId(response.trackingId);
          setProfile(response.profile);
          sessionStorage.setItem('customer-tracking-id', response.trackingId);
          
          console.log('🎯 NEW CUSTOMER JOURNEY STARTED');
          console.log('━'.repeat(50));
          console.log(`📋 New Tracking ID: ${response.trackingId}`);
          console.log('🚀 Customer profile initialized');
          console.log('📍 Ready to track customer journey steps');
          console.log('━'.repeat(50));
        }
      } catch (error) {
        console.error('Failed to create customer profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, []);

  const createProfile = async () => {
    try {
      setIsLoading(true);
      const response = await makeApiRequest('/api/customer-profiles', 'POST');
      if (response.success) {
        setTrackingId(response.trackingId);
        setProfile(response.profile);
        sessionStorage.setItem('customer-tracking-id', response.trackingId);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!trackingId) return;

    try {
      setIsLoading(true);
      
      // Detailed step tracking for sidebar console
      console.log('🎯 CUSTOMER JOURNEY STEP UPDATE');
      console.log('━'.repeat(50));
      console.log(`📋 Tracking ID: ${trackingId}`);
      console.log(`🔄 Updates:`, JSON.stringify(updates, null, 2));
      
      // Determine which step this is
      if (updates.zipCode) {
        console.log('📍 STEP 1: Location Entry');
        console.log(`   ZIP Code: ${updates.zipCode}`);
      }
      if (updates.demographics) {
        console.log('👤 STEP 2: Use Case Selection');
        console.log(`   Demographics: ${updates.demographics}`);
      }
      if (updates.mattressSize) {
        console.log('📏 STEP 3: Size Selection');
        console.log(`   Size: ${updates.mattressSize}`);
      }
      if (updates.firmness) {
        console.log('🛏️ STEP 4: Comfort Selection');
        console.log(`   Firmness: ${updates.firmness}`);
        console.log(`   Model: ${updates.model}`);
        console.log(`   Price: ${updates.finalPrice}`);
      }
      
      console.log('━'.repeat(50));
      
      const response = await makeApiRequest(`/api/customer-profiles/${trackingId}`, 'PUT', updates);
      if (response.success) {
        setProfile(response.profile);
        console.log('✅ Profile updated successfully');
        console.log('📊 Current Profile State:', {
          zipCode: response.profile.zipCode,
          demographics: response.profile.demographics,
          mattressSize: response.profile.mattressSize,
          firmness: response.profile.firmness,
          finalPrice: response.profile.finalPrice
        });
      }
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferenceCode = async (): Promise<string> => {
    if (!trackingId) {
      console.error('No tracking ID available');
      throw new Error('No tracking ID available');
    }

    try {
      setIsLoading(true);
      
      console.log('🚀 STEP 5: REFERENCE CODE GENERATION');
      console.log('━'.repeat(50));
      console.log(`📋 Tracking ID: ${trackingId}`);
      console.log('🎯 Generating reference code and triggering webhook...');
      
      const response = await makeApiRequest(`/api/customer-profiles/${trackingId}/reference-code`, 'POST');
      
      if (response.success) {
        // Update local profile with reference code
        setProfile(prev => prev ? { ...prev, referenceCode: response.referenceCode } : null);
        
        console.log('✅ REFERENCE CODE GENERATED!');
        console.log(`🎫 Reference Code: ${response.referenceCode}`);
        console.log('📡 Webhook fired to Make automation');
        console.log('📋 Customer profile complete and sent for processing');
        console.log('━'.repeat(50));
        
        return response.referenceCode;
      }
      console.error('API response indicates failure:', response);
      throw new Error('Failed to generate reference code');
    } catch (error) {
      console.error('Reference code generation failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: CustomerProfileContextType = {
    profile,
    trackingId,
    createProfile,
    updateProfile,
    generateReferenceCode,
    isLoading,
  };

  return (
    <CustomerProfileContext.Provider value={value}>
      {children}
    </CustomerProfileContext.Provider>
  );
};