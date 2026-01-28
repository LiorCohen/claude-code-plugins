// Component: Sidebar
// Navigation sidebar with page links
type SidebarProps = {
  readonly currentPage: string;
  readonly onNavigate: (page: string) => void;
};

type NavItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
};

const navItems: readonly NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'greeter', label: 'Greeter', icon: '👋' },
];

export const Sidebar = ({ currentPage, onNavigate }: SidebarProps): JSX.Element => {
  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">{'{{PROJECT_NAME}}'}</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentPage === item.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
