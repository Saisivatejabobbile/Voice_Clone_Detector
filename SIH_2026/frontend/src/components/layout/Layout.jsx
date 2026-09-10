import Header from './Header';
import Sidebar from './Sidebar';

// Main Layout Wrapper
export default function Layout({ children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      
      <div className="flex">
        {showSidebar && <Sidebar />}
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Layout without sidebar (for auth pages)
export function SimpleLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-950">
      {children}
    </div>
  );
}
