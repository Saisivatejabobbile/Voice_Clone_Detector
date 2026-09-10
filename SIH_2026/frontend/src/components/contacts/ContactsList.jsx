import ContactCard from './ContactCard';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { InlineLoading } from '../common/Loading';
import { UsersIcon } from '../../utils/icons';

// Contacts List Component
export default function ContactsList({ 
  contacts, 
  isLoading, 
  onCall, 
  onAddContact 
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <InlineLoading text="Loading contacts..." />
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="w-16 h-16 text-gray-600" />}
        title="No contacts yet"
        message="Add your first contact to start making secure calls"
        action={
          <Button variant="primary" onClick={onAddContact}>
            Add Contact
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onCall={onCall}
        />
      ))}
    </div>
  );
}
