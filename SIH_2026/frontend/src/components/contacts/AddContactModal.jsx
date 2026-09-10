import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { UserIcon, MailIcon } from '../../utils/icons';

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
    // Clear error for this field
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
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
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
      
      // Reset form
      setFormData({
        name: '',
        email: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to add contact',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter contact name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={<UserIcon className="w-5 h-5" />}
            disabled={isSubmitting}
          />
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter contact email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={<MailIcon className="w-5 h-5" />}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-danger-dark/20 border border-danger-light/30 rounded-lg">
            <p className="text-danger-light text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Info Note */}
        <div className="p-3 bg-primary-600/10 border border-primary-600/30 rounded-lg">
          <p className="text-primary-400 text-sm">
            Note: The user must be registered on VoiceShield to add them as a contact.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
