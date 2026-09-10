// Custom hook for managing contacts with API integration
import { useState, useEffect, useCallback } from 'react';
import { contactsAPI } from '../services/api';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactsAPI.getContacts();
      
      // Handle both old and new API response formats
      const contactsList = Array.isArray(response) ? response : (response.contacts || []);
      
      // Map contact data to unified format
      const normalizedContacts = contactsList.map(contact => ({
        id: contact.contact_user_id || contact.id, // Use contact_user_id for calling registered users
        contact_id: contact.id, // Keep original contact DB id
        email: contact.contact_email || contact.email,
        full_name: contact.contact_name || contact.full_name,
        status: contact.is_online ? 'online' : 'offline',
        is_registered: contact.is_registered || false,
        is_online: contact.is_online || false,
        contact_user_id: contact.contact_user_id,
        created_at: contact.created_at,
      }));
      
      setContacts(normalizedContacts);
    } catch (err) {
      setError(err.message || 'Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new contact
  const addContact = useCallback(async (name, email) => {
    try {
      const response = await contactsAPI.addContact(name, email);
      await fetchContacts(); // Refresh list
      return { success: true, contact: response };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchContacts]);

  // Remove a contact
  const removeContact = useCallback(async (contactId) => {
    try {
      await contactsAPI.removeContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get online contacts count
  const getOnlineCount = useCallback(() => {
    return contacts.filter(c => c.status === 'online' || c.is_online).length;
  }, [contacts]);

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    addContact,
    removeContact,
    getOnlineCount,
  };
};
