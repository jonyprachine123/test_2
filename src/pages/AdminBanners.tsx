import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useRef } from "react";

interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrl: string;
  price: number;
  discount: number;
  link: string;
  created_at: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        toast({
          title: "Error",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImage(file);
      setImageUrl("");
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImage(null);
    setImagePreview(url);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    if (!image && !imageUrl) {
      toast({
        title: "Error",
        description: "Please provide either an image file or image URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (image) {
        formData.append("image", image);
      }
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }
      formData.append("price", price || "0");
      formData.append("discount", discount || "0");
      if (link) formData.append("link", link);

      console.log('Submitting banner data:', {
        title,
        description,
        imageUrl,
        price,
        discount,
        link,
        image: image?.name
      });

      const response = await fetch("http://localhost:5000/api/banners", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create banner");
      }

      const data = await response.json();
      console.log('Created banner:', data);

      toast({
        title: "Success",
        description: "Banner created successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
      setImageUrl("");
      setImagePreview(null);
      setPrice("");
      setDiscount("");
      setLink("");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh banners list
      fetchBanners();
    } catch (error) {
      console.error("Error creating banner:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create banner",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
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

      // Refresh banners list
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Banner Management</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/admin")}
        >
          Back to Admin
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Add New Banner</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Image Upload</Label>
                <div className="mt-2 space-y-4">
                  <div className="relative">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                  </div>

                  <div>
                    <Label>Or Image URL</Label>
                    <Input
                      type="url"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>

                  {imagePreview && (
                    <div className="mt-4">
                      <Label>Image Preview</Label>
                      <div className="mt-2 relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImagePreview(null);
                            toast({
                              title: "Error",
                              description: "Failed to load image preview",
                              variant: "destructive",
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || parseFloat(value) >= 0) {
                    setPrice(value);
                  }
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                    setDiscount(value);
                  }
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Banner"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Existing Banners</h2>
          <div className="space-y-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white p-4 rounded-lg shadow-md flex items-start gap-4"
              >
                <img
                  src={banner.imageUrl || (banner.image ? `http://localhost:5000${banner.image}` : '/placeholder-image.jpg')}
                  alt={banner.title}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (banner.image && !banner.imageUrl) {
                      // Try the local image if URL fails
                      img.src = `http://localhost:5000${banner.image}`;
                    } else {
                      // Fall back to placeholder
                      img.src = '/placeholder-image.jpg';
                    }
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{banner.title}</h3>
                  <p className="text-sm text-gray-600">{banner.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      Price: ৳{banner.price.toLocaleString()}
                    </p>
                    {banner.discount > 0 && (
                      <p className="text-sm text-red-500">
                        Discount: {banner.discount}%
                      </p>
                    )}
                    {banner.link && (
                      <p className="text-sm text-blue-500 truncate">
                        <a href={banner.link} target="_blank" rel="noopener noreferrer">
                          {banner.link}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}