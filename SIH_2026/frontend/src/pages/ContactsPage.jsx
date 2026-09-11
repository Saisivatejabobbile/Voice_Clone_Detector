import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import ContactsList from '../components/contacts/ContactsList';
import AddContactModal from '../components/contacts/AddContactModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall.jsx';
import { useContacts } from '../hooks/useContacts';
import { contactsAPI } from '../services/api';

// Enterprise Verified Directory Page
export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { contacts = [], loading: isLoading, fetchContacts } = useContacts();
  
  const {
    isConnected,
    initiateCall,
  } = useSharedSimplePeerCall();

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        (contact.full_name || contact.contact_name || '').toLowerCase().includes(query) ||
        (contact.email || contact.contact_email || '').toLowerCase().includes(query)
    );
  }, [searchQuery, contacts]);

  const handleCall = (contact) => {
    const contactId = contact.contact_user_id || contact.id || contact.contact_id;
    const contactName = contact.full_name || contact.contact_name || 'Participant';
    
    console.log('Initiating encrypted call with:', contactName, contactId);
    initiateCall(contactId, contactName);
  };

  const handleAddContact = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddContactSubmit = async (contactData) => {
    try {
      await contactsAPI.addContact(contactData.name, contactData.email);
      await fetchContacts();
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw new Error(error.message || 'Failed to add contact');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
              Verified Personnel Directory
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Authorized organizational directory enabled for real-time voice verification calls.
            </p>
          </div>
          
          <Button variant="primary" onClick={handleAddContact} className="self-start sm:self-auto shadow-sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Authorize Contact
            </span>
          </Button>
        </div>

        {/* Connection Status Pill */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          isConnected 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
            <span>{isConnected ? 'Signaling Gateway Active: Ready for Outbound Audio Calls' : 'Connecting to WebRTC gateway...'}</span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {contacts.length} Registered
          </span>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 shadow-xs">
          <Input
            type="text"
            placeholder="Search directory by name, email, or credential identifier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Contacts Content */}
        <div>
          {searchQuery && (
            <div className="mb-4 flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8] px-1">
              <p>
                Found <span className="font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">{filteredContacts.length}</span> contact{filteredContacts.length !== 1 ? 's' : ''}
              </p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-[#008BB8] dark:text-[#00C2FF] hover:underline font-semibold cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}
          
          <ContactsList
            contacts={filteredContacts}
            isLoading={isLoading}
            onCall={handleCall}
            onAddContact={handleAddContact}
          />
          
          {searchQuery && filteredContacts.length === 0 && (
            <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-12 text-center">
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">No authorized directory personnel matching "{searchQuery}"</p>
              <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear search</Button>
            </div>
          )}
        </div>

        <AddContactModal isOpen={isModalOpen} onClose={handleCloseModal} onAdd={handleAddContactSubmit} />
      </div>
    </Layout>
  );
}