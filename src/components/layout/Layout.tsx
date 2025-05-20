
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className={cn("container mx-auto px-4 py-6", className)}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
