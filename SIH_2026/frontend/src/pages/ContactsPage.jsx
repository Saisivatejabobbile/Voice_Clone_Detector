import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import ContactsList from '../components/contacts/ContactsList';
import AddContactModal from '../components/contacts/AddContactModal';
import IncomingCallModal from '../components/IncomingCallModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useSharedSimplePeerCall } from '../hooks/useSharedSimplePeerCall.jsx';
import { useContacts } from '../hooks/useContacts';
import { contactsAPI } from '../services/api';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { contacts, loading: isLoading, error, fetchContacts } = useContacts();
  
  const {
    callState,
    incomingCall,
    isMuted,
    isConnected,
    initiateCall,
    acceptCall,
    rejectCall,
    toggleMute,
    endCall,
    formatDuration
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
    const contactId = contact.id || contact.contact_id;
    const contactName = contact.full_name || contact.contact_name || 'Unknown';
    
    console.log('Calling:', contactName, contactId);
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
        {/* Connection Status */}
        <div className={`p-4 rounded-lg border ${isConnected ? 'bg-success-dark/20 border-success-light/30' : 'bg-warning-dark/20 border-warning-light/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-light' : 'bg-warning-light'}`}></div>
            <p className={isConnected ? 'text-success-light' : 'text-warning-light'}>
              {isConnected ? '? Ready for calls' : '? Connecting...'}
            </p>
          </div>
        </div>


        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
            <p className="text-gray-400">Manage your contacts and make secure calls</p>
          </div>
          
          <Button variant="primary" onClick={handleAddContact}>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="card p-4">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Contacts List */}
        <div>
          {searchQuery && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-primary-400 hover:text-primary-300 text-sm">
                  Clear search
                </button>
              )}
            </div>
          )}
          
          <ContactsList
            contacts={filteredContacts}
            isLoading={isLoading}
            onCall={handleCall}
            onAddContact={handleAddContact}
          />
          
          {searchQuery && filteredContacts.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-400 mb-4">No contacts found matching "{searchQuery}"</p>
              <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear search</Button>
            </div>
          )}
        </div>

        <AddContactModal isOpen={isModalOpen} onClose={handleCloseModal} onAdd={handleAddContactSubmit} />
      </div>

      {/* Incoming Call Modal */}
      <IncomingCallModal callerInfo={incomingCall} onAccept={acceptCall} onReject={rejectCall} />


    </Layout>
  );
}