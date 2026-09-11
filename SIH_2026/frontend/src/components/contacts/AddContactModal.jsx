import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { UserIcon, MailIcon } from '../../utils/icons';

// Enterprise Add Contact Modal
export default function AddContactModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Corporate email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd(formData);
      setFormData({ name: '', email: '' });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to authorize contact directory entry',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '' });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Authorize Directory Contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <Input
            id="name"
            name="name"
            label="Contact Full Name"
            type="text"
            placeholder="e.g. Dr. Jane Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={<UserIcon className="w-4 h-4 text-[#64748B]" />}
            disabled={isSubmitting}
          />
        </div>

        {/* Email Input */}
        <div>
          <Input
            id="email"
            name="email"
            label="Corporate Email Address"
            type="email"
            placeholder="user@enterprise.corp"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={<MailIcon className="w-4 h-4 text-[#64748B]" />}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-lg">
            <p className="text-rose-800 dark:text-rose-300 text-xs font-semibold">{errors.submit}</p>
          </div>
        )}

        {/* Info Note */}
        <div className="p-3 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-lg text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p className="leading-relaxed">
            <span className="font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">Identity Note:</span> The contact must have an active registered account on VoiceShield to negotiate encrypted WebRTC signaling.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Add Verified Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
