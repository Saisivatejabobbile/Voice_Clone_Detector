import Avatar from '../common/Avatar';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';

// Enterprise Contact Card Component
export default function ContactCard({ contact, onCall }) {
  const isOnline = contact.status === 'online';

  return (
    <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 sm:p-5 hover:border-[#CBD5E1] dark:hover:border-[#00C2FF]/60 hover:shadow-sm transition-all text-[#0F172A] dark:text-[#F1F5F9]">
      <div className="flex items-center justify-between gap-4">
        {/* Contact Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <Avatar 
            name={contact.full_name || contact.contact_name || contact.name || 'Contact'} 
            src={contact.avatar}
            size="md" 
            status={contact.status}
            className="flex-shrink-0"
          />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] truncate">
                {contact.full_name}
              </p>
              {isOnline && (
                <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0 shadow-[0_0_6px_#10B981]" />
              )}
            </div>
            <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
              {contact.email}
            </p>
          </div>
        </div>

        {/* Status and Call Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:block">
            <StatusBadge status={contact.status} showText={true} />
          </div>
          
          <Button
            variant={isOnline ? 'success' : 'secondary'}
            size="sm"
            onClick={() => onCall(contact)}
            disabled={!isOnline}
            className="flex items-center gap-1.5 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
