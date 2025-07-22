import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Users, TrendingUp, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const handleExportCSV = () => {
    // Trigger CSV download from the server
    window.open('/api/leads/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MattressPickupNow Dashboard</h1>
          <Button onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export All Leads (CSV)
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-sm text-gray-600">All captured leads</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">--</div>
              <p className="text-sm text-gray-600">Direct to AJ routing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">--%</div>
              <p className="text-sm text-gray-600">Lead to pickup</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Persona Detection Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">9 Customer Psychology Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800">Direct to AJ:</h4>
                  <ul className="text-sm text-red-700">
                    <li>• Emergency Replacement</li>
                    <li>• Immediate Move-In</li>
                    <li>• Property Manager</li>
                    <li>• Delivery Mismatch</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Self-Service:</h4>
                  <ul className="text-sm text-blue-700">
                    <li>• Coming-of-Age Buyer</li>
                    <li>• Student Transition</li>
                    <li>• Guest Accommodations</li>
                    <li>• Child Milestone</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Default:</h4>
                  <ul className="text-sm text-gray-700">
                    <li>• Practical No-Nonsense</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              All lead data is owned by AJ and can be exported for CRM/email follow-up. 
              The CSV export includes persona analysis, routing decisions, and confidence scores.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Export Fields:</strong> Lead ID, Contact Info, Persona, Routing Tier, 
                Priority, Budget, Urgency, Store Assignment, Follow-up Stage, and Timestamps
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}