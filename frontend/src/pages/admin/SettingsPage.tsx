import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [loading, setLoading] = useState<boolean>(false);
  
  // General Settings
  const [storeName, setStoreName] = useState<string>('');
  const [storeEmail, setStoreEmail] = useState<string>('');
  const [storePhone, setStorePhone] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [language, setLanguage] = useState<string>('en');
  
  // Payment Settings
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(false);
  const [stripePublicKey, setStripePublicKey] = useState<string>('');
  const [stripeSecretKey, setStripeSecretKey] = useState<string>('');
  const [paypalEnabled, setPaypalEnabled] = useState<boolean>(false);
  const [paypalClientId, setPaypalClientId] = useState<string>('');
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  
  // Email Settings
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<string>('');
  const [smtpUsername, setSmtpUsername] = useState<string>('');
  const [smtpPassword, setSmtpPassword] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  
  useEffect(() => {
    if (activeTab === 'general') {
      fetchGeneralSettings();
    } else if (activeTab === 'payment') {
      fetchPaymentSettings();
    } else if (activeTab === 'email') {
      fetchEmailSettings();
    }
  }, [activeTab]);
  
  const fetchGeneralSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.get<any>('/admin/settings/general');
      const data = response.data || {};
      
      setStoreName(data.storeName || '');
      setStoreEmail(data.storeEmail || '');
      setStorePhone(data.storePhone || '');
      setCurrency(data.currency || 'USD');
      setLanguage(data.language || 'en');
    } catch (error) {
      console.error('Failed to fetch general settings:', error);
      toast.error('Failed to load general settings');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.get<any>('/admin/settings/payment');
      const data = response.data || {};
      
      setStripeEnabled(data.stripeEnabled || false);
      setStripePublicKey(data.stripePublicKey || '');
      setStripeSecretKey(data.stripeSecretKey || '');
      setPaypalEnabled(data.paypalEnabled || false);
      setPaypalClientId(data.paypalClientId || '');
      setCodEnabled(data.codEnabled || true);
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.get<any>('/admin/settings/email');
      const data = response.data || {};
      
      setSmtpHost(data.smtpHost || '');
      setSmtpPort(data.smtpPort || '');
      setSmtpUsername(data.smtpUsername || '');
      setSmtpPassword(data.smtpPassword || '');
      setSenderEmail(data.senderEmail || '');
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminService.post('/admin/settings/general', {
        storeName,
        storeEmail,
        storePhone,
        currency,
        language
      });
      toast.success('General settings saved successfully');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      toast.error('Failed to save general settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminService.post('/admin/settings/payment', {
        stripeEnabled,
        stripePublicKey,
        stripeSecretKey,
        paypalEnabled,
        paypalClientId,
        codEnabled
      });
      toast.success('Payment settings saved successfully');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminService.post('/admin/settings/email', {
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword,
        senderEmail
      });
      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Failed to save email settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };
  
  const sendTestEmail = async () => {
    try {
      setLoading(true);
      await adminService.post('/admin/settings/email/test', {
        recipient: storeEmail
      });
      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'payment' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            Payment
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'email' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'security' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* General Settings */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneralSettings}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Store Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                            Store Name
                          </label>
                          <input
                            type="text"
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Store Email
                          </label>
                          <input
                            type="email"
                            id="storeEmail"
                            value={storeEmail}
                            onChange={(e) => setStoreEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Store Phone
                          </label>
                          <input
                            type="text"
                            id="storePhone"
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Regional Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                            Default Currency
                          </label>
                          <select
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                            Default Language
                          </label>
                          <select
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="it">Italian</option>
                            <option value="pt">Portuguese</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {loading ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <form onSubmit={handleSavePaymentSettings}>
                  <div className="space-y-6">
                    {/* Stripe Settings */}
                    <div className="border-b pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Stripe Payments</h3>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={stripeEnabled}
                              onChange={(e) => setStripeEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {stripeEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className={stripeEnabled ? '' : 'opacity-50'}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="stripePublicKey" className="block text-sm font-medium text-gray-700 mb-1">
                              Stripe Public Key
                            </label>
                            <input
                              type="text"
                              id="stripePublicKey"
                              value={stripePublicKey}
                              onChange={(e) => setStripePublicKey(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              disabled={!stripeEnabled}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-gray-700 mb-1">
                              Stripe Secret Key
                            </label>
                            <input
                              type="password"
                              id="stripeSecretKey"
                              value={stripeSecretKey}
                              onChange={(e) => setStripeSecretKey(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              disabled={!stripeEnabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* PayPal Settings */}
                    <div className="border-b pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">PayPal Payments</h3>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paypalEnabled}
                              onChange={(e) => setPaypalEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {paypalEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className={paypalEnabled ? '' : 'opacity-50'}>
                        <div>
                          <label htmlFor="paypalClientId" className="block text-sm font-medium text-gray-700 mb-1">
                            PayPal Client ID
                          </label>
                          <input
                            type="text"
                            id="paypalClientId"
                            value={paypalClientId}
                            onChange={(e) => setPaypalClientId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            disabled={!paypalEnabled}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Cash on Delivery */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Cash on Delivery</h3>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={codEnabled}
                              onChange={(e) => setCodEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {codEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {loading ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Email Settings */}
              {activeTab === 'email' && (
                <form onSubmit={handleSaveEmailSettings}>
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium mb-4">Email Server Configuration</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Host
                          </label>
                          <input
                            type="text"
                            id="smtpHost"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. smtp.example.com"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Port
                          </label>
                          <input
                            type="text"
                            id="smtpPort"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g. 587"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Username
                          </label>
                          <input
                            type="text"
                            id="smtpUsername"
                            value={smtpUsername}
                            onChange={(e) => setSmtpUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Password
                          </label>
                          <input
                            type="password"
                            id="smtpPassword"
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700 mb-1">
                          Sender Email
                        </label>
                        <input
                          type="email"
                          id="senderEmail"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="noreply@yourstore.com"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={sendTestEmail}
                        disabled={loading || !smtpHost || !smtpPort || !senderEmail}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Send Test Email
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {loading ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="font-medium mb-3">Password Policy</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="minLength"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked
                            readOnly
                          />
                          <label htmlFor="minLength" className="ml-2 block text-sm text-gray-700">
                            Minimum 8 characters
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="requireUppercase"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked
                            readOnly
                          />
                          <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-700">
                            Require at least one uppercase letter
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="requireNumber"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked
                            readOnly
                          />
                          <label htmlFor="requireNumber" className="ml-2 block text-sm text-gray-700">
                            Require at least one number
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h4 className="font-medium mb-3">Account Security</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="lockAccount"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked
                            readOnly
                          />
                          <label htmlFor="lockAccount" className="ml-2 block text-sm text-gray-700">
                            Lock account after 5 failed login attempts
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sessionTimeout"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked
                            readOnly
                          />
                          <label htmlFor="sessionTimeout" className="ml-2 block text-sm text-gray-700">
                            Session timeout after 30 minutes of inactivity
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toast.success('Security settings saved')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;