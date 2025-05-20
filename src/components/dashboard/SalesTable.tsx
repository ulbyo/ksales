
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/Spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search } from "lucide-react";

type SalesRecord = {
  id: string;
  sales_count: number;
  sales_date: string;
  sales_type: string;
  album: {
    id: string;
    title: string;
    artist: {
      id: string;
      name: string;
    };
  };
};

const SalesTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [salesFilter, setSalesFilter] = useState<string>("all");

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales", salesFilter],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select(`
          id,
          sales_count,
          sales_date,
          sales_type,
          album:album_id (
            id,
            title,
            artist:artist_id (
              id,
              name
            )
          )
        `)
        .order("sales_date", { ascending: false });
        
      if (salesFilter !== "all") {
        query = query.eq("sales_type", salesFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as SalesRecord[];
    },
  });

  // Filter sales data based on search term
  const filteredSales = salesData?.filter((sale) => {
    const matchesSearch =
      searchTerm === "" ||
      sale.album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.album.artist.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg">Sales Records</CardTitle>
        <CardDescription className="text-xs text-gray-400">
          View all submitted sales data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by album or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-xs"
            />
          </div>
          
          <div className="w-full md:w-48">
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-xs">
                <SelectValue placeholder="All Sales Types" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-xs">
                <SelectItem value="all" className="text-xs">All Sales Types</SelectItem>
                <SelectItem value="first_day" className="text-xs">First Day</SelectItem>
                <SelectItem value="first_week" className="text-xs">First Week</SelectItem>
                <SelectItem value="first_month" className="text-xs">First Month</SelectItem>
                <SelectItem value="beyond" className="text-xs">Beyond</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : filteredSales && filteredSales.length > 0 ? (
          <div className="border border-gray-800 rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2 text-left">Artist</th>
                  <th className="px-4 py-2 text-left">Album</th>
                  <th className="px-4 py-2 text-left">Sales Type</th>
                  <th className="px-4 py-2 text-right">Count</th>
                  <th className="px-4 py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2">{sale.album.artist.name}</td>
                    <td className="px-4 py-2">{sale.album.title}</td>
                    <td className="px-4 py-2 capitalize">
                      {sale.sales_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {sale.sales_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {format(new Date(sale.sales_date), "yyyy-MM-dd")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400">No sales records found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesTable;
