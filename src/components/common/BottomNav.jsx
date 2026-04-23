import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navigation.js';

const BottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-700/80 bg-slate-900/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex min-h-[64px] flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-medium transition-colors ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} style={{ color: isActive ? item.color : '#94a3b8' }} />
                <span className="mt-1 text-center leading-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
