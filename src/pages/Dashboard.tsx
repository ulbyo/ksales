
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import { CalendarIcon, Plus, BarChartBig } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import SalesTable from "@/components/dashboard/SalesTable";

type Artist = {
  id: string;
  name: string;
};

type Album = {
  id: string;
  title: string;
  artist_id: string;
};

type SalesType = 'first_day' | 'first_week' | 'first_month' | 'beyond';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"add" | "view">("add");
  const [artistName, setArtistName] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string>("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(new Date());
  const [salesCount, setSalesCount] = useState("");
  const [salesDate, setSalesDate] = useState<Date | undefined>(new Date());
  const [salesType, setSalesType] = useState<SalesType>("first_day");
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isSubmittingSales, setIsSubmittingSales] = useState(false);
  const [showNewArtist, setShowNewArtist] = useState(false);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  
  // Fetch artists
  const { data: artists, isLoading: isLoadingArtists, refetch: refetchArtists } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Artist[];
    },
  });

  // Fetch albums by artist
  const { data: albums, isLoading: isLoadingAlbums, refetch: refetchAlbums } = useQuery({
    queryKey: ["albums", selectedArtist],
    queryFn: async () => {
      if (!selectedArtist) return [];
      
      const { data, error } = await supabase
        .from("albums")
        .select("id, title, artist_id")
        .eq("artist_id", selectedArtist)
        .order("title");
      
      if (error) throw error;
      return data as Album[];
    },
    enabled: !!selectedArtist,
  });

  const handleCreateArtist = async () => {
    if (!artistName.trim()) {
      toast({
        title: "Error",
        description: "Artist name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("artists")
        .insert([{ name: artistName.trim() }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artist created successfully",
      });

      setArtistName("");
      setShowNewArtist(false);
      await refetchArtists();
      if (data && data[0]) {
        setSelectedArtist(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create artist",
        variant: "destructive",
      });
    }
  };

  const handleCreateAlbum = async () => {
    if (!albumTitle.trim() || !selectedArtist || !releaseDate) {
      toast({
        title: "Error",
        description: "Album title, artist, and release date are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAlbum(true);

    try {
      const { data, error } = await supabase
        .from("albums")
        .insert([{
          title: albumTitle.trim(),
          artist_id: selectedArtist,
          release_date: format(releaseDate, "yyyy-MM-dd"),
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album created successfully",
      });

      setAlbumTitle("");
      setShowNewAlbum(false);
      await refetchAlbums();
      if (data && data[0]) {
        setSelectedAlbum(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create album",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handleSubmitSales = async () => {
    if (!selectedAlbum || !salesCount || !salesDate || !salesType) {
      toast({
        title: "Error",
        description: "Album, sales count, date, and type are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingSales(true);

    try {
      const { error } = await supabase
        .from("sales")
        .insert([{
          album_id: selectedAlbum,
          sales_count: parseInt(salesCount),
          sales_date: format(salesDate, "yyyy-MM-dd"),
          sales_type: salesType,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sales data submitted successfully",
      });

      setSalesCount("");
      setSalesDate(new Date());
      setSalesType("first_day");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit sales data",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSales(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-xs mt-1">Manage album sales data</p>
        </div>
      </div>

      <Tabs defaultValue="add" value={activeTab} onValueChange={(value) => setActiveTab(value as "add" | "view")}>
        <TabsList className="mb-6">
          <TabsTrigger value="add" className="text-xs">
            <Plus className="h-3 w-3 mr-2" />
            Add Sales
          </TabsTrigger>
          <TabsTrigger value="view" className="text-xs">
            <BarChartBig className="h-3 w-3 mr-2" />
            View Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Submit Sales Data</CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Enter album sales information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Artist Selection */}
              <div className="space-y-2">
                <Label htmlFor="artist" className="text-xs">Artist</Label>
                {!showNewArtist ? (
                  <div className="flex gap-2">
                    <Select
                      value={selectedArtist}
                      onValueChange={setSelectedArtist}
                    >
                      <SelectTrigger id="artist" className="bg-gray-800 border-gray-700 text-xs">
                        <SelectValue placeholder="Select artist" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-xs">
                        {isLoadingArtists ? (
                          <div className="flex justify-center p-2">
                            <Spinner size="sm" />
                          </div>
                        ) : artists && artists.length > 0 ? (
                          artists.map((artist) => (
                            <SelectItem key={artist.id} value={artist.id} className="text-xs">
                              {artist.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-xs text-gray-400">
                            No artists found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowNewArtist(true)}
                      className="text-xs border-gray-700"
                    >
                      New
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="new-artist"
                      placeholder="Enter artist name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={handleCreateArtist}
                        className="text-xs"
                      >
                        Add
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowNewArtist(false)}
                        className="text-xs border-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Album Selection */}
              <div className="space-y-2">
                <Label htmlFor="album" className="text-xs">Album</Label>
                {!showNewAlbum ? (
                  <div className="flex gap-2">
                    <Select
                      value={selectedAlbum}
                      onValueChange={setSelectedAlbum}
                      disabled={!selectedArtist}
                    >
                      <SelectTrigger id="album" className="bg-gray-800 border-gray-700 text-xs">
                        <SelectValue placeholder={selectedArtist ? "Select album" : "Select artist first"} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-xs">
                        {isLoadingAlbums ? (
                          <div className="flex justify-center p-2">
                            <Spinner size="sm" />
                          </div>
                        ) : albums && albums.length > 0 ? (
                          albums.map((album) => (
                            <SelectItem key={album.id} value={album.id} className="text-xs">
                              {album.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-xs text-gray-400">
                            No albums found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowNewAlbum(true)}
                      disabled={!selectedArtist}
                      className="text-xs border-gray-700"
                    >
                      New
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      id="new-album"
                      placeholder="Enter album title"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-xs"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="release-date" className="text-xs whitespace-nowrap">Release Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="release-date"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs border-gray-700"
                          >
                            <CalendarIcon className="h-3 w-3 mr-2" />
                            {releaseDate ? format(releaseDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                          <Calendar
                            mode="single"
                            selected={releaseDate}
                            onSelect={setReleaseDate}
                            initialFocus
                            className="text-xs"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={handleCreateAlbum}
                        disabled={isCreatingAlbum}
                        className="text-xs"
                      >
                        {isCreatingAlbum && <Spinner size="sm" className="mr-2" />}
                        Add
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowNewAlbum(false)}
                        className="text-xs border-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sales-count" className="text-xs">Sales Count</Label>
                    <Input
                      id="sales-count"
                      type="number"
                      placeholder="Enter sales count"
                      value={salesCount}
                      onChange={(e) => setSalesCount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-xs"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sales-date" className="text-xs">Sales Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="sales-date"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs border-gray-700"
                        >
                          <CalendarIcon className="h-3 w-3 mr-2" />
                          {salesDate ? format(salesDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                        <Calendar
                          mode="single"
                          selected={salesDate}
                          onSelect={setSalesDate}
                          initialFocus
                          className="text-xs"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sales-type" className="text-xs">Sales Type</Label>
                    <Select value={salesType} onValueChange={(value) => setSalesType(value as SalesType)}>
                      <SelectTrigger id="sales-type" className="bg-gray-800 border-gray-700 text-xs">
                        <SelectValue placeholder="Select sales type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-xs">
                        <SelectItem value="first_day" className="text-xs">First Day</SelectItem>
                        <SelectItem value="first_week" className="text-xs">First Week</SelectItem>
                        <SelectItem value="first_month" className="text-xs">First Month</SelectItem>
                        <SelectItem value="beyond" className="text-xs">Beyond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitSales}
                  disabled={isSubmittingSales || !selectedAlbum || !salesCount}
                  className="w-full md:w-auto text-xs"
                >
                  {isSubmittingSales && <Spinner size="sm" className="mr-2" />}
                  Submit Sales Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          <SalesTable />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
