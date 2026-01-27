import { User } from 'lucide-react';
import SettingsSection from './SettingSection.jsx';

const Profile = () => {
  return (
    <SettingsSection icon={User} title={'Profile'}>
      <div className="flex flex-col sm:flex-row items-center mb-6">
        <img
          src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.creativefabrica.com%2Fwp-content%2Fuploads%2F2022%2F12%2F22%2FCute-Little-Baby-Darth-Vader-Artwork-53944223-1.png&f=1&nofb=1&ipt=e3789909c966e28c63fec2d57e0b804a1ace428cc5f23cf197de653dde1420d0"
          alt="Profile"
          className="rounded-full w-20 h-20 object-cover mr-4"
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Jordan Grieve</h3>
          <p className="text-gray-400">Jordan.grieve@yahoo.com</p>
        </div>
      </div>
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto">
        Edit Profile
      </button>
    </SettingsSection>
  );
};

export default Profile;
