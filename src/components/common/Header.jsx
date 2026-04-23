const Header = ({ title }) => {
  return (
    <header className="border-b border-gray-700 bg-gray-800 bg-opacity-50 shadow-lg backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-gray-100 sm:text-2xl">{title}</h1>
      </div>
    </header>
  );
};
export default Header;
