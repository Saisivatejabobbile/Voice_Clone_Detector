import Header from './Header';
import Sidebar from './Sidebar';

// Main Enterprise Layout Wrapper
export default function Layout({ children, showSidebar = true }) {
  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col antialiased transition-colors duration-200">
      <Header />
      
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {showSidebar && <Sidebar />}
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Layout without sidebar (for auth and focus pages)
export function SimpleLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] text-[#0F172A] dark:text-[#F1F5F9] antialiased transition-colors duration-200">
      {children}
    </div>
  );
}
