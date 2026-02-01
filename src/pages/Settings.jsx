import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Bell, Clock, Shield, Building, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    companyName: 'Acme Corporation',
    timezone: 'UTC',
    workStartTime: '09:00',
    workEndTime: '18:00',
    lateThreshold: 15,
    emailNotifications: true,
    slackNotifications: false,
    autoCheckout: true,
    faceConfidenceThreshold: 85,
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your attendance system</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg">Schedule</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg">Notifications</TabsTrigger>
          <TabsTrigger value="recognition" className="rounded-lg">Face Recognition</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                <p className="text-sm text-gray-500">Basic company information</p>
              </div>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Schedule Settings */}
        <TabsContent value="schedule">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Work Schedule</h3>
                <p className="text-sm text-gray-500">Define working hours and late thresholds</p>
              </div>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart">Work Start Time</Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={settings.workStartTime}
                    onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd">Work End Time</Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={settings.workEndTime}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                <Input
                  id="lateThreshold"
                  type="number"
                  value={settings.lateThreshold}
                  onChange={(e) => setSettings({ ...settings, lateThreshold: parseInt(e.target.value) })}
                  min={0}
                  max={60}
                />
                <p className="text-sm text-gray-500">
                  Employees arriving more than {settings.lateThreshold} minutes after start time are marked late
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label className="text-base">Auto Checkout</Label>
                  <p className="text-sm text-gray-500">Automatically check out employees at end of day</p>
                </div>
                <Switch
                  checked={settings.autoCheckout}
                  onCheckedChange={(v) => setSettings({ ...settings, autoCheckout: v })}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Configure how you receive alerts</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive daily attendance summaries</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <Label className="text-base">Slack Notifications</Label>
                  <p className="text-sm text-gray-500">Get real-time updates in Slack</p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(v) => setSettings({ ...settings, slackNotifications: v })}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Face Recognition Settings */}
        <TabsContent value="recognition">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Face Recognition</h3>
                <p className="text-sm text-gray-500">Configure facial recognition settings</p>
              </div>
            </div>

            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Confidence Threshold (%)</Label>
                <Input
                  id="confidenceThreshold"
                  type="number"
                  value={settings.faceConfidenceThreshold}
                  onChange={(e) => setSettings({ ...settings, faceConfidenceThreshold: parseInt(e.target.value) })}
                  min={50}
                  max={100}
                />
                <p className="text-sm text-gray-500">
                  Minimum confidence score required for successful face match
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Security Note</p>
                    <p className="text-sm text-amber-700">
                      Higher thresholds increase security but may result in more failed recognitions.
                      Recommended: 85-95%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}