import { useState } from 'react';
import SettingSection from './SettingSection.jsx';
import { Bell } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch.jsx';

const Notifications = () => {
  const [notifications, setNotifications] = useState({
    email: false,
    sms: true,
    push: true,
  });

  return (
    <SettingSection icon={Bell} title={'Notification'}>
      <ToggleSwitch
        Label={'Push Notification'}
        isOn={notifications.push}
        onToggle={() => setNotifications({ ...notifications, push: !notifications.push })}
      />
      <ToggleSwitch
        Label={'Email Notification'}
        isOn={notifications.email}
        onToggle={() => setNotifications({ ...notifications, email: !notifications.email })}
      />
      <ToggleSwitch
        Label={'SMS Notification'}
        isOn={notifications.sms}
        onToggle={() => setNotifications({ ...notifications, sms: !notifications.sms })}
      />
    </SettingSection>
  );
};

export default Notifications;
