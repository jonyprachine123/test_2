import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: number;
  image: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  link: string;
  created_at: string;
}

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/banners");
      if (!response.ok) {
        throw new Error("Failed to fetch banners");
      }
      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error",
        description: "Failed to load banners",
        variant: "destructive",
      });
    }
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    const discount = (price * discountPercentage) / 100;
    return price - discount;
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900 text-center mb-8">
            আমাদের বিশেষ অফার
          </h1>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            হোমে ফিরে যান
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img 
                  src={getImageUrl(banner.image)}
                  alt={banner.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder-image.jpg';
                  }}
                />
                {banner.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                    {banner.discount}% ছাড়
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-bold text-navy-900 mb-2">
                  {banner.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    ৳{calculateDiscountedPrice(banner.price, banner.discount).toLocaleString()}
                  </span>
                  {banner.discount > 0 && (
                    <span className="text-lg text-gray-400 line-through">
                      ৳{banner.price.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{banner.description}</p>
                
                {banner.link && (
                  <a 
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full">
                      বিস্তারিত দেখুন
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <p>কোন অফার এখনো যোগ করা হয়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
