import type { LocationSearchResult } from './google-maps.js';

interface AdminNotification {
  type: 'location_entry' | 'lead_created' | 'high_priority_lead';
  data: any;
  timestamp: string;
  userId?: string;
}

export class AdminNotificationService {
  private notifications: AdminNotification[] = [];

  async sendLocationEntryNotification(searchResult: LocationSearchResult): Promise<void> {
    const notification: AdminNotification = {
      type: 'location_entry',
      data: {
        userLocation: searchResult.userLocation,
        userCoordinates: searchResult.userCoordinates,
        storeCount: searchResult.mattressFirmStores.length,
        nearestStore: searchResult.mattressFirmStores[0] || null,
        allStores: searchResult.mattressFirmStores,
        searchTimestamp: searchResult.timestamp,
      },
      timestamp: new Date().toISOString(),
    };

    // Store notification
    this.notifications.push(notification);

    // Log for immediate visibility
    console.log('🔔 LOCATION ENTRY ALERT');
    console.log('━'.repeat(50));
    console.log(`📍 User Location: ${searchResult.userLocation}`);
    if (searchResult.userCoordinates) {
      console.log(`🎯 Coordinates: ${searchResult.userCoordinates.lat}, ${searchResult.userCoordinates.lng}`);
    }
    console.log(`🏪 Found ${searchResult.mattressFirmStores.length} Mattress Firm locations`);
    
    if (searchResult.mattressFirmStores.length > 0) {
      console.log('\n📋 NEAREST STORES:');
      searchResult.mattressFirmStores.slice(0, 3).forEach((store, index) => {
        console.log(`${index + 1}. ${store.name}`);
        console.log(`   📍 ${store.address}`);
        if (store.phone) console.log(`   📞 ${store.phone}`);
        if (store.distance) console.log(`   📏 ${store.distance} miles away`);
        if (store.hours) console.log(`   🕒 ${store.hours.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    console.log('━'.repeat(50));
  }

  async sendLeadNotification(leadData: any): Promise<void> {
    const notification: AdminNotification = {
      type: 'lead_created',
      data: leadData,
      timestamp: new Date().toISOString(),
    };

    this.notifications.push(notification);

    console.log('🎯 NEW LEAD CREATED');
    console.log('━'.repeat(50));
    console.log(`👤 Name: ${leadData.name}`);
    console.log(`📞 Phone: ${leadData.phone}`);
    console.log(`📧 Email: ${leadData.email}`);
    console.log(`📍 Location: ${leadData.zipCode}`);
    console.log(`🛏️ Selection: ${leadData.mattressSize} ${leadData.mattressType}`);
    console.log(`💰 Budget: ${leadData.budgetRange}`);
    console.log(`⚡ Urgency: ${leadData.urgency}`);
    console.log(`🧠 Persona: ${leadData.persona || 'Not detected'}`);
    console.log('━'.repeat(50));
  }

  async sendHighPriorityAlert(leadData: any, reason: string): Promise<void> {
    const notification: AdminNotification = {
      type: 'high_priority_lead',
      data: { leadData, reason },
      timestamp: new Date().toISOString(),
    };

    this.notifications.push(notification);

    console.log('🚨 HIGH PRIORITY LEAD ALERT');
    console.log('━'.repeat(50));
    console.log(`⚠️  Reason: ${reason}`);
    console.log(`👤 Name: ${leadData.name}`);
    console.log(`📞 Phone: ${leadData.phone}`);
    console.log(`⏰ Needs mattress: ${leadData.urgency}`);
    console.log('🎯 ACTION REQUIRED: Immediate follow-up recommended');
    console.log('━'.repeat(50));
  }

  getRecentNotifications(limit: number = 50): AdminNotification[] {
    return this.notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getNotificationsByType(type: AdminNotification['type']): AdminNotification[] {
    return this.notifications.filter(n => n.type === type);
  }
}

export const adminNotificationService = new AdminNotificationService();