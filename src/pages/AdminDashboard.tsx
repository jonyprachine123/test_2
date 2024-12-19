import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "../contexts/AdminContext";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import AdminReviews from "@/components/AdminReviews";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function AdminDashboard() {
  const { isAuthenticated, logout } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [productData, setProductData] = useState({
    id: null as number | null,
    title: "",
    price: 0,
    discount: 0,
    description: "",
    features: [] as string[],
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [orders, setOrders] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    imageUrl: "",
    link: "",
    description: "",
    price: 0,
    discount: 0,
  });

  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showOrderEditDialog, setShowOrderEditDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    productId: 0,
    productTitle: "",
    quantity: 0,
    totalPrice: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    fetchProducts();
    fetchOrders();
    fetchBanners();
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/banners");
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error",
        description: "Failed to fetch banners",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("adminToken", data.token);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = productData.id
        ? `http://localhost:5000/api/products/${productData.id}`
        : "http://localhost:5000/api/products";

      const method = productData.id ? "PUT" : "POST";

      const formData = new FormData();
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('discount', productData.discount.toString());
      formData.append('features', JSON.stringify(productData.features));

      const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (imageInput && imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      const savedProduct = await response.json();

      toast({
        title: "Success",
        description: `Product ${productData.id ? "updated" : "created"} successfully`,
      });

      setProductData({
        id: null,
        title: "",
        price: 0,
        discount: 0,
        description: "",
        features: [],
      });
      setPreviewImage(null);
      
      // Clear the file input
      if (imageInput) {
        imageInput.value = '';
      }
      
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: any) => {
    setProductData({
      id: product.id,
      title: product.title,
      price: product.price,
      discount: product.discount,
      description: product.description,
      features: product.features || [],
    });
    setPreviewImage(product.imageUrl);
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    const discount = (price * discountPercentage) / 100;
    return price - discount;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFeature = () => {
    setProductData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setProductData((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }));
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete banner");
      }

      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });

      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      });
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerForm),
      });

      if (!response.ok) {
        throw new Error("Failed to add banner");
      }

      toast({
        title: "Success",
        description: "Banner added successfully",
      });

      setBannerForm({
        title: "",
        imageUrl: "",
        link: "",
        description: "",
        price: 0,
        discount: 0,
      });
      
      fetchBanners();
    } catch (error) {
      console.error("Error adding banner:", error);
      toast({
        title: "Error",
        description: "Failed to add banner",
        variant: "destructive",
      });
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setOrderForm({
      customerName: order.customer_name,
      email: order.email || "",
      phone: order.phone || "",
      address: order.address || "",
      productId: order.product_id,
      productTitle: order.product_title || "",
      quantity: order.quantity,
      totalPrice: order.total_price,
    });
    setShowOrderEditDialog(true);
  };

  const handleUpdateOrder = async (orderId: string, formData: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          quantity: formData.quantity,
          totalPrice: formData.totalPrice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      setShowOrderEditDialog(false);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Prachine Bangla Limited - Admin Dashboard
          </h1>
          <nav className="flex items-center gap-4">
            <Button onClick={() => navigate("/")}>Home</Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <Button
              variant={activeTab === "products" ? "default" : "outline"}
              onClick={() => setActiveTab("products")}
            >
              Products
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "outline"}
              onClick={() => setActiveTab("orders")}
            >
              Orders
            </Button>
            <Button
              variant={activeTab === "reviews" ? "default" : "outline"}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </Button>
            <Button
              variant={activeTab === "banners" ? "default" : "outline"}
              onClick={() => setActiveTab("banners")}
            >
              Banners
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </nav>
        </div>

        {activeTab === "products" ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <Label>Product Image</Label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mb-2"
                    />
                  </div>
                  {previewImage && (
                    <div className="w-48">
                      <img
                        src={previewImage}
                        alt="Product preview"
                        className="w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Product Name</Label>
                <Input
                  value={productData.title}
                  onChange={(e) =>
                    setProductData({ ...productData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={productData.price}
                    onChange={(e) =>
                      setProductData({
                        ...productData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Product Price"
                  />
                </div>
                <div>
                  <Label>Discount (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={productData.discount}
                      onChange={(e) => {
                        const value = Math.min(
                          100,
                          Math.max(0, parseFloat(e.target.value) || 0)
                        );
                        setProductData({ ...productData, discount: value });
                      }}
                      placeholder="Discount Percentage"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  {productData.discount > 0 && productData.price > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Final Price: ৳
                      {calculateDiscountedPrice(
                        productData.price,
                        productData.discount
                      ).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={productData.description}
                  onChange={(e) =>
                    setProductData({ ...productData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Product Features</Label>
                <div className="space-y-2">
                  {productData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveFeature(index)}
                        className="px-3"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddFeature}
                    className="w-full"
                  >
                    + Add Feature
                  </Button>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Products List</h2>
              <div className="grid gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{product.title}</h3>
                        <div className="text-sm text-gray-600">
                          <span className="mr-2">Price: ৳{product.price}</span>
                          {product.discount > 0 && (
                            <span className="ml-2 text-red-500">({product.discount}% off)</span>
                          )}
                          {product.discount > 0 && product.price > 0 && (
                            <span>
                              Final: ৳
                              {calculateDiscountedPrice(
                                product.price,
                                product.discount
                              ).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleEdit(product)}>Edit</Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "reviews" ? (
          <Card>
            <CardHeader>
              <CardTitle>Manage Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminReviews />
            </CardContent>
          </Card>
        ) : activeTab === "orders" ? (
          <Card>
            <CardHeader>
              <CardTitle>Manage Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.product_title || 'Unknown Product'}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>৳{order.total_price}</TableCell>
                        <TableCell>
                          <select
                            className="border rounded p-1"
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value)
                            }
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Banner Management</h2>
            
            {/* Add Banner Form */}
            <form onSubmit={handleAddBanner} className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-xl font-bold mb-4">Add New Banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <Input
                    required
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Link (Optional)</label>
                  <Input
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    min="0"
                    value={bannerForm.price}
                    onChange={(e) => setBannerForm({ ...bannerForm, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={bannerForm.discount}
                    onChange={(e) => setBannerForm({ ...bannerForm, discount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-4 w-full">Add Banner</Button>
            </form>

            {/* Banner List */}
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white p-4 rounded-lg shadow flex items-start justify-between">
                  <div className="flex space-x-4">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-bold">{banner.title}</h3>
                      <p className="text-sm text-gray-600">{banner.description}</p>
                      {banner.link && (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Link
                        </a>
                      )}
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">Price:</span> ৳{banner.price}
                        {banner.discount > 0 && (
                          <span className="ml-2 text-red-500">({banner.discount}% off)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBanner(banner.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
              {banners.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No banners found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showOrderEditDialog && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Edit Order</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateOrder(editingOrder.id, orderForm);
            }} className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={orderForm.email}
                  onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Product Title</Label>
                <Input
                  value={orderForm.productTitle}
                  onChange={(e) => setOrderForm({ ...orderForm, productTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value);
                    const price = editingOrder.product_price * (1 - editingOrder.product_discount / 100);
                    setOrderForm({
                      ...orderForm,
                      quantity,
                      totalPrice: quantity * price
                    });
                  }}
                />
              </div>
              <div>
                <Label>Total Price</Label>
                <Input
                  type="number"
                  value={orderForm.totalPrice}
                  onChange={(e) => setOrderForm({ ...orderForm, totalPrice: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowOrderEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}