import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import endpoints from "@/config/endpoints";

interface Banner {
  id: number;
  imageUrl: string;
}

const Banners = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch(endpoints.banners.list);
      const data = await response.json();
      console.log('Fetched banners:', data);
      setBanners(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error",
        description: "Failed to load banners.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading banners...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Banners</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={banner.imageUrl}
              alt={`Banner ${banner.id}`}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
