import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Reviews from "@/components/Reviews";

const Home = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [orderForm, setOrderForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();
      console.log('Fetched products:', data);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProduct(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    const discount = (price * discountPercentage) / 100;
    return price - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting order submission...");

    // Validate required fields
    if (!orderForm.name.trim()) {
      toast({
        title: "Error",
        description: "নাম দিতে হবে",
        variant: "destructive",
      });
      return;
    }

    if (!orderForm.phone.trim()) {
      toast({
        title: "Error",
        description: "মোবাইল নম্বর দিতে হবে",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (Bangladesh)
    const phoneRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;
    if (!phoneRegex.test(orderForm.phone.replace(/\s+/g, ''))) {
      toast({
        title: "Error",
        description: "সঠিক মোবাইল নম্বর দিন",
        variant: "destructive",
      });
      return;
    }

    // Validate email format if provided
    if (orderForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.email)) {
      toast({
        title: "Error",
        description: "সঠিক ইমেইল এড্রেস দিন",
        variant: "destructive",
      });
      return;
    }

    if (!orderForm.address.trim()) {
      toast({
        title: "Error",
        description: "ঠিকানা দিতে হবে",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "No product selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const finalPrice = calculateDiscountedPrice(selectedProduct.price, selectedProduct.discount);

      // Create order in SQLite database
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: orderForm.name,
          email: orderForm.email,
          phone: orderForm.phone,
          address: orderForm.address,
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          quantity: quantity,
          totalPrice: finalPrice * quantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();
      console.log("Order created:", result);

      toast({
        title: "Success",
        description: "অর্ডার সফলভাবে জমা হয়েছে।",
      });

      // Reset form
      setOrderForm({
        name: "",
        email: "",
        address: "",
        phone: "",
      });
      setQuantity(1);

      // Navigate to banner page
      navigate('/banners');
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "অর্ডার জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between py-4">
            <div className="text-2xl font-bold mb-4 md:mb-0 text-navy-900">
            প্রাচীন বাংলা
            </div>
            <div className="max-w-2xl text-sm md:text-base text-center md:text-right text-navy-900">
            প্রাচীন বাংলা বাংলাদেশের অন্যতম শীর্ষস্থানীয় ই-কমার্স প্রতিষ্ঠান, যা লক্ষ লক্ষ মানুষের অনলাইন শপিংয়ের অভিজ্ঞতাকে নতুনভাবে উপস্থাপন করছে।
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 animate-fadeIn">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Left side - Product Image */}
          <div className="sticky top-4 bg-white rounded-lg shadow-lg p-4">
            <div className="relative pt-[100%]">
              <img
                src={selectedProduct?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}
                alt={selectedProduct?.title || "পণ্য"}
                className="absolute top-0 left-0 w-full h-full object-contain p-2"
              />
            </div>
          </div>

          {/* Right side - Product Details */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                {selectedProduct?.title}
              </h1>
              <div className="flex items-center space-x-4 mb-2">
                <p className="text-2xl font-bold text-primary">
                  ৳ {calculateDiscountedPrice(selectedProduct?.price || 0, selectedProduct?.discount || 0).toLocaleString()}
                </p>
                {selectedProduct?.discount > 0 && (
                  <>
                    <p className="text-lg text-gray-600 line-through">
                      ৳ {selectedProduct?.price.toLocaleString()}
                    </p>
                    <span className="text-red-500">({selectedProduct?.discount}% off)</span>
                  </>
                )}
              </div>
              <p className="text-gray-700">
                {selectedProduct?.description}
              </p>
            </div>

            {/* Features */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">বৈশিষ্ট্যসমূহ</h2>
              <ul className="space-y-1">
                {(selectedProduct?.features || []).map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Order Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
              <Button
                className="flex-1"
                onClick={() => {
                  const element = document.getElementById('orderForm');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                অর্ডার করুন
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg" id="orderForm">
          <h2 className="text-2xl font-bold text-primary mb-4 text-center">
            আপনার অর্ডার দিন
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">নাম <span className="text-red-500">*</span></label>
              <Input
                required
                placeholder="আপনার নাম"
                value={orderForm.name}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ইমেইল <span className="text-gray-400">(ঐচ্ছিক)</span></label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={orderForm.email}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">মোবাইল নম্বর <span className="text-red-500">*</span></label>
              <Input
                required
                placeholder="01XXXXXXXXX"
                value={orderForm.phone}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ঠিকানা <span className="text-red-500">*</span></label>
              <Textarea
                required
                placeholder="আপনার সম্পূর্ণ ঠিকানা"
                value={orderForm.address}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, address: e.target.value })
                }
              />
            </div>

            {/* Quantity and Total Amount Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">পরিমাণ</label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>মূল্য:</span>
                  <span>৳ {selectedProduct?.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ডিসকাউন্ট:</span>
                  <span>- ৳ {(selectedProduct?.price * (selectedProduct?.discount / 100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>একক মূল্য:</span>
                  <span>৳ {calculateDiscountedPrice(selectedProduct?.price || 0, selectedProduct?.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>সর্বমোট:</span>
                  <span>৳ {(calculateDiscountedPrice(selectedProduct?.price || 0, selectedProduct?.discount || 0) * quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              অর্ডার জমা দিন
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white shadow-md mt-8">
        <div className="container mx-auto px-4 py-12">
          {/* Reviews Section */}
          <Reviews />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Logo and Company Info */}
            <div className="flex flex-col items-center md:items-start">
              <img
                src="https://www.prachinebangla.com/storage/app/public/company/2024-09-22-66f0852262497.webp"
                alt="প্রাচীন বাংলা"
                className="h-20 mb-4"
              />
              <h3 className="text-xl font-bold text-navy-900 mb-2">প্রাচীন বাংলা</h3>
              <p className="text-gray-600">
                আপনার বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম
              </p>
            </div>

            {/* Contact Information */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-navy-900 mb-4">যোগাযোগ করুন</h3>
              
              {/* Address */}
              <div className="flex items-start space-x-3 mb-4">
                <svg className="w-6 h-6 text-navy-900 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-navy-900">ঠিকানা</h4>
                  <p className="text-gray-600">Patwary Foundation, Notun Bazer, Po: Rampura, Ps : Halishahar, Chittagong</p>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-start space-x-3 mb-4">
                <svg className="w-6 h-6 text-navy-900 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-navy-900">মোবাইল</h4>
                  <p className="text-gray-600">09639195229</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-navy-900 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-navy-900">ইমেইল</h4>
                  <p className="text-gray-600">info@prachinebangla.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-gray-600"> {new Date().getFullYear()} প্রাচীন বাংলা। সর্বস্বত্ব সংরক্ষিত</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
