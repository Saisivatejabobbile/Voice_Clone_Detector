import Card, { CardHeader, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import { ShieldIcon, AlertIcon, ExclamationIcon } from '../../utils/icons';

// Security Status Card Component
export default function SecurityStatusCard({ status = 'protected' }) {
  const statusConfig = {
    protected: {
      icon: <ShieldIcon className="w-5 h-5" />,
      title: 'Protected',
      color: 'success',
      message: 'All systems are actively monitoring for threats',
    },
    warning: {
      icon: <AlertIcon className="w-5 h-5" />,
      title: 'Warning',
      color: 'warning',
      message: 'Some security features need attention',
    },
    danger: {
      icon: <ExclamationIcon className="w-5 h-5" />,
      title: 'At Risk',
      color: 'danger',
      message: 'Immediate action required',
    },
  };

  const config = statusConfig[status] || statusConfig.protected;

  const securityChecks = [
    {
      id: 1,
      label: 'Call with NFC detection',
      status: 'active',
      value: 'Live now',
      time: '7 min ago',
    },
    {
      id: 2,
      label: 'Call risk',
      status: 'safe',
      value: 'Medium Risk',
      time: '11 min ago',
    },
    {
      id: 3,
      label: 'Call with Unknown caller',
      status: 'alert',
      value: 'High Risk',
      time: '21 hours ago',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Security Status</h2>
          <Badge variant={config.color} className="flex items-center gap-2">
            {config.icon} {config.title}
          </Badge>
        </div>
      </CardHeader>
      
      <CardBody>
        <p className="text-gray-400 text-sm mb-6">{config.message}</p>
        
        <div className="space-y-4">
          {securityChecks.map((check) => (
            <div 
              key={check.id}
              className="flex items-center justify-between p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  check.status === 'active' ? 'bg-success-light animate-pulse' :
                  check.status === 'safe' ? 'bg-warning-light' :
                  'bg-danger-light'
                }`} />
                <div>
                  <p className="text-white text-sm font-medium">{check.label}</p>
                  <p className="text-gray-500 text-xs">{check.time}</p>
                </div>
              </div>
              
              <Badge variant={
                check.status === 'active' ? 'success' :
                check.status === 'safe' ? 'warning' :
                'danger'
              } size="sm">
                {check.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
