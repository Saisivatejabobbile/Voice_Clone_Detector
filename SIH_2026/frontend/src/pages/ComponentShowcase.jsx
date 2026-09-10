// Component Showcase Page (for testing only - remove in production)
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import IncomingCallModal from '../components/call/IncomingCallModal';
import { 
  Button, 
  Card, CardHeader, CardBody, CardFooter,
  Avatar,
  Badge, StatusBadge,
  Modal, ModalFooter,
  Loading, InlineLoading,
  EmptyState,
  Input, Textarea
} from '../components/common';

export default function ComponentShowcase() {
  const [showModal, setShowModal] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  
  // Mock caller data for testing
  const mockCaller = {
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone_number: '+1 (555) 123-4567',
    avatar: null
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Component Showcase</h1>
          <p className="text-gray-400">Testing all reusable components</p>
        </div>
        
        {/* Incoming Call Modal Test */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">?? Incoming Call Modal</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-400 mb-4">
              Click the button below to test the incoming call modal with ringtone.
            </p>
            <Button 
              variant="primary" 
              onClick={() => setShowIncomingCall(true)}
            >
              Simulate Incoming Call
            </Button>
          </CardBody>
        </Card>
        
        {/* Buttons */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Buttons</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </CardBody>
        </Card>
        
        {/* Avatars */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Avatars</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" status="online" />
              <Avatar name="Bob Johnson" size="lg" status="offline" />
              <Avatar name="Alice Williams" size="xl" status="busy" />
              <Avatar name="Charlie Brown" size="2xl" />
            </div>
          </CardBody>
        </Card>
        
        {/* Badges */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Badges</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="gray">Gray</Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="online" />
                <StatusBadge status="offline" />
                <StatusBadge status="busy" />
                <StatusBadge status="in_call" />
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Loading States */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Loading States</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap items-center gap-8">
              <Loading size="sm" />
              <Loading size="md" text="Loading..." />
              <Loading size="lg" />
              <InlineLoading text="Processing..." />
            </div>
          </CardBody>
        </Card>
        
        {/* Forms */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Form Inputs</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 max-w-md">
              <Input 
                label="Email" 
                type="email" 
                placeholder="Enter your email"
                helper="We'll never share your email"
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="Enter password"
                error="Password is required"
              />
              <Textarea 
                label="Message" 
                placeholder="Enter your message"
                rows={3}
              />
            </div>
          </CardBody>
        </Card>
        
        {/* Modal */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Modal</h2>
          </CardHeader>
          <CardBody>
            <Button onClick={() => setShowModal(true)}>Open Modal</Button>
          </CardBody>
        </Card>
        
        {/* Empty State */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Empty State</h2>
          </CardHeader>
          <CardBody>
            <EmptyState
              icon="??"
              title="No items found"
              message="There are no items to display. Add your first item to get started."
              action={<Button variant="primary">Add Item</Button>}
            />
          </CardBody>
        </Card>
      </div>
      
      {/* Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Test Modal"
        size="md"
      >
        <p className="text-gray-300">This is a test modal component.</p>
        <p className="text-gray-400 mt-2">Press ESC or click outside to close.</p>
        
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Incoming Call Modal for Testing */}
      <IncomingCallModal
        caller={mockCaller}
        onAccept={() => {
          console.log('Call accepted!');
          setShowIncomingCall(false);
        }}
        onReject={() => {
          console.log('Call rejected!');
          setShowIncomingCall(false);
        }}
        isOpen={showIncomingCall}
      />
    </Layout>
  );
}
