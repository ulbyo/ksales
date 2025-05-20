
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ArrowLeft, BookmarkIcon, Share2Icon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Album = {
  id: string;
  title: string;
  release_date: string;
  cover_url: string | null;
  artist: {
    id: string;
    name: string;
    image_url: string | null;
  };
};

type SalesRecord = {
  id: string;
  sales_count: number;
  sales_date: string;
  sales_type: string;
};

type SalesChartData = {
  date: string;
  count: number;
  type: string;
};

type SalesTotalsByType = {
  first_day: number;
  first_week: number;
  first_month: number;
  beyond: number;
  total: number;
};

const formatSalesType = (type: string) => {
  return type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const AlbumDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"overview" | "sales">("overview");
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Fetch album details
  const { data: album, isLoading: isLoadingAlbum } = useQuery({
    queryKey: ["album", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("albums")
        .select(`
          id,
          title,
          release_date,
          cover_url,
          artist:artist_id (
            id,
            name,
            image_url
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Album;
    },
    enabled: !!id,
  });

  // Fetch album sales
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ["album-sales", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sales_count,
          sales_date,
          sales_type
        `)
        .eq("album_id", id)
        .order("sales_date");
      
      if (error) throw error;
      return data as SalesRecord[];
    },
    enabled: !!id,
  });

  // Check if user has bookmarked this album
  const { data: bookmark, isLoading: isLoadingBookmark, refetch: refetchBookmark } = useQuery({
    queryKey: ["bookmark", id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("album_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  // Prepare chart data
  const chartData: SalesChartData[] = salesData
    ? salesData.map((sale) => ({
        date: format(new Date(sale.sales_date), "MM/dd"),
        count: sale.sales_count,
        type: formatSalesType(sale.sales_type),
      }))
    : [];

  // Calculate sales totals by type
  const salesTotals: SalesTotalsByType = salesData
    ? salesData.reduce(
        (acc, sale) => {
          acc[sale.sales_type as keyof Omit<SalesTotalsByType, "total">] += sale.sales_count;
          acc.total += sale.sales_count;
          return acc;
        },
        {
          first_day: 0,
          first_week: 0,
          first_month: 0,
          beyond: 0,
          total: 0,
        }
      )
    : {
        first_day: 0,
        first_week: 0,
        first_month: 0,
        beyond: 0,
        total: 0,
      };

  // Toggle bookmark
  const handleToggleBookmark = async () => {
    if (!user || !id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark albums",
        variant: "destructive",
      });
      return;
    }

    setIsBookmarking(true);

    try {
      if (bookmark) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("id", bookmark.id);
        
        if (error) throw error;
        
        toast({
          title: "Bookmark removed",
          description: "Album removed from your bookmarks",
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            album_id: id,
            user_id: user.id,
          });
        
        if (error) throw error;
        
        toast({
          title: "Bookmark added",
          description: "Album added to your bookmarks",
        });
      }

      await refetchBookmark();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  // Share album
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: album?.title || "K-Pop Album",
          text: `Check out ${album?.title} by ${album?.artist.name} on K-Pop Album Pulse!`,
          url: window.location.href,
        })
        .catch(() => {
          // Copy to clipboard as fallback
          copyToClipboard();
        });
    } else {
      // Copy to clipboard as fallback
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Album link copied to clipboard",
    });
  };

  if (isLoadingAlbum) {
    return (
      <Layout>
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (!album) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <p className="text-gray-400">Album not found.</p>
          <Link to="/">
            <Button variant="link" className="text-xs mt-2">
              Return to home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/" className="text-gray-400 hover:text-white flex items-center text-xs">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Albums
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <div>
          <div className="aspect-square overflow-hidden bg-gray-800 rounded-md mb-4">
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                No Cover Available
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold line-clamp-2">{album.title}</h1>
              <p className="text-gray-400 text-sm">{album.artist.name}</p>
              <p className="text-gray-500 text-xs mt-1">
                Released: {format(new Date(album.release_date), "MMMM d, yyyy")}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`text-xs flex items-center gap-1 border-gray-700 ${
                  bookmark ? "bg-white/10" : ""
                }`}
                onClick={handleToggleBookmark}
                disabled={isBookmarking || isLoadingBookmark}
              >
                <BookmarkIcon className="h-3 w-3" />
                {bookmark ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1 border-gray-700"
                onClick={handleShare}
              >
                <Share2Icon className="h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as "overview" | "sales")}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sales" className="text-xs">
                Detailed Sales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      {
                        label: "First Day",
                        value: salesTotals.first_day.toLocaleString(),
                      },
                      {
                        label: "First Week",
                        value: salesTotals.first_week.toLocaleString(),
                      },
                      {
                        label: "First Month",
                        value: salesTotals.first_month.toLocaleString(),
                      },
                      {
                        label: "Total Sales",
                        value: salesTotals.total.toLocaleString(),
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-gray-800 p-4 rounded-md text-center"
                      >
                        <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                        <p className="text-lg font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="h-72">
                    {isLoadingSales ? (
                      <div className="h-full flex items-center justify-center">
                        <Spinner />
                      </div>
                    ) : chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fff" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#fff" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#333"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            stroke="#666"
                          />
                          <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#222",
                              borderColor: "#333",
                              fontSize: 12,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#fff"
                            fillOpacity={1}
                            fill="url(#colorSales)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-sm">
                          No sales data available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  {isLoadingSales ? (
                    <div className="py-12 flex justify-center">
                      <Spinner />
                    </div>
                  ) : salesData && salesData.length > 0 ? (
                    <div className="border border-gray-800 rounded-md overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-right">Sales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {salesData.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-800/50">
                              <td className="px-4 py-2">
                                {format(new Date(sale.sales_date), "yyyy-MM-dd")}
                              </td>
                              <td className="px-4 py-2 capitalize">
                                {sale.sales_type.replace("_", " ")}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {sale.sales_count.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-gray-400">No sales data available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AlbumDetails;
