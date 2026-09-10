import Avatar from '../common/Avatar';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';

// Contact Card Component
export default function ContactCard({ contact, onCall }) {
  return (
    <div className="card p-4 card-hover">
      <div className="flex items-center justify-between">
        {/* Contact Info */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar 
            name={contact.full_name} 
            src={contact.avatar}
            size="md" 
            status={contact.status}
          />
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {contact.full_name}
            </p>
            <p className="text-gray-400 text-sm truncate">
              {contact.email}
            </p>
          </div>
        </div>

        {/* Status and Call Button */}
        <div className="flex items-center gap-3">
          <StatusBadge status={contact.status} showText={false} />
          
          <Button
            variant={contact.status === 'online' ? 'success' : 'secondary'}
            size="sm"
            onClick={() => onCall(contact)}
            disabled={contact.status === 'offline'}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </Button>
        </div>
      </div>
    </div>
  );
}
