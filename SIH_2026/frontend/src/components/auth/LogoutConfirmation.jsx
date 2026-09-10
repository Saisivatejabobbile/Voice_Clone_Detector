import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal, { ModalFooter } from '../common/Modal';
import Button from '../common/Button';
import { ROUTES } from '../../constants';

// Logout Confirmation Modal
export default function LogoutConfirmation({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    navigate(ROUTES.LANDING);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center py-4">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-danger-dark/20 mb-4">
          <svg
            className="w-8 h-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2">
          Are you sure?
        </h3>

        {/* Message */}
        <p className="text-gray-400 mb-6">
          Do you want to logout from your account?
        </p>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
      </ModalFooter>
    </Modal>
  );
}
