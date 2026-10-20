import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useState, useEffect } from 'react';
import { usePipelineStore } from '../../store/usePipelineStore';
import ErrorBoundary from '../common/ErrorBoundary';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { connect, disconnect } = usePipelineStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-white p-3 lg:p-4">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
