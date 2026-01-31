import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

const AdminProducts = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Management</h1>
        <p className="text-muted-foreground">Add, edit and manage products</p>
      </div>

      <Card className="p-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Product Management Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The product management interface is currently under development. 
          You can manage products through the API endpoints for now.
        </p>
      </Card>
    </div>
  );
};

export default AdminProducts;

