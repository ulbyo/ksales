
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Calendar, Clock, Filter } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

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

type SalesType = 'first_day' | 'first_week' | 'first_month' | 'beyond' | 'all';

const Index = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [salesFilter, setSalesFilter] = useState<SalesType>("all");
  const [sortBy, setSortBy] = useState<"newest" | "trending">("newest");

  // Fetch albums with their artists
  const { data: albums, isLoading } = useQuery({
    queryKey: ["albums", sortBy],
    queryFn: async () => {
      const query = supabase
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
        `);

      if (sortBy === "newest") {
        query.order("release_date", { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Album[];
    },
  });

  // Filter albums based on search term
  const filteredAlbums = albums?.filter((album) => {
    const matchesSearch =
      searchTerm === "" ||
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <Layout>
      <section className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">K-Pop Album Sales Tracker</h1>
            <p className="text-gray-400 text-xs mt-1">Track and discover the latest K-Pop album sales</p>
          </div>
          {user && (
            <Link to="/dashboard">
              <Button size="sm" className="text-xs bg-white text-black hover:bg-gray-200">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by album or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-xs w-full"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs flex gap-2 border-gray-800">
                  <Filter className="h-3 w-3" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuLabel className="text-xs">Sales Period</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem 
                  className="text-xs" 
                  onClick={() => setSalesFilter("all")}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs" 
                  onClick={() => setSalesFilter("first_day")}
                >
                  First Day
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs" 
                  onClick={() => setSalesFilter("first_week")}
                >
                  First Week
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs" 
                  onClick={() => setSalesFilter("first_month")}
                >
                  First Month
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs" 
                  onClick={() => setSalesFilter("beyond")}
                >
                  Beyond
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tabs defaultValue="newest" onValueChange={(value) => setSortBy(value as "newest" | "trending")}>
              <TabsList className="bg-gray-900 border border-gray-800 h-8 p-0">
                <TabsTrigger value="newest" className="text-xs h-7 px-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  Newest
                </TabsTrigger>
                <TabsTrigger value="trending" className="text-xs h-7 px-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : filteredAlbums && filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAlbums.map((album) => (
              <Link to={`/album/${album.id}`} key={album.id}>
                <Card className="overflow-hidden bg-gray-900 border-gray-800 hover:border-gray-700 transition-all hover:translate-y-[-2px]">
                  <div className="aspect-square overflow-hidden bg-gray-800 relative">
                    {album.cover_url ? (
                      <img
                        src={album.cover_url}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        No Cover
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-xs truncate">{album.title}</h3>
                    <p className="text-gray-400 text-xs truncate">{album.artist.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No albums found.</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Index;
