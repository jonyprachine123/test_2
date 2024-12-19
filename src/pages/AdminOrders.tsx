import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAdmin } from "../contexts/AdminContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  product_id: number;
  product_title: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  discount: number;
}

export default function AdminOrders() {
  const { isAuthenticated, logout } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
      return;
    }
    fetchOrders();
    fetchProducts();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/orders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched orders:', data); // Debug log
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    const discount = (price * discountPercentage) / 100;
    return price - discount;
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditDialog(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      setLoading(true);

      // If product changed, recalculate total price
      const selectedProduct = products.find(p => p.id === editingOrder.product_id);
      if (selectedProduct) {
        const finalPrice = calculateDiscountedPrice(selectedProduct.price, selectedProduct.discount);
        editingOrder.total_price = finalPrice * editingOrder.quantity;
      }

      const response = await fetch(`http://localhost:5000/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: editingOrder.customer_name,
          email: editingOrder.email,
          phone: editingOrder.phone,
          address: editingOrder.address,
          productId: editingOrder.product_id,
          quantity: editingOrder.quantity,
          totalPrice: editingOrder.total_price,
          status: editingOrder.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      setShowEditDialog(false);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log('Updating status:', { orderId, newStatus });

      // Update optimistically in the UI first
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert the optimistic update if the server request fails
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: order.status }
              : order
          )
        );
        throw new Error('Failed to update order status');
      }

      const data = await response.json();
      console.log('Status update response:', data);

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      // Refresh orders to ensure we have the latest data
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Deleting order:', orderId);
      
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete order');
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      // Remove the deleted order from the state
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Orders List</h1>
          <nav className="flex items-center gap-4">
            <Button onClick={() => navigate("/admin/dashboard")}>Dashboard</Button>
            <Button onClick={() => navigate("/")}>Home</Button>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">No orders found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div>
                        <div>{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell>{order.product_title || 'Product not found'}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>${order.total_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        defaultValue={order.status}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue defaultValue={order.status}>
                            {order.status}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEditOrder(order)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Customer Name</label>
                <Input
                  value={editingOrder.customer_name}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      customer_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editingOrder.email}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editingOrder.phone}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={editingOrder.address}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Product</label>
                <Select
                  value={editingOrder.product_id.toString()}
                  onValueChange={(value) =>
                    setEditingOrder({
                      ...editingOrder,
                      product_id: parseInt(value),
                      product_title: products.find(p => p.id === parseInt(value))?.title || '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={editingOrder.quantity}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateOrder} disabled={loading}>
                  {loading ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}