
"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Trash2, Eye, Database, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState("rooms");
  const [isSeeding, setIsSeeding] = useState(false);
  
  const adminDocRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, "roles_admin", user.uid) : null, 
    [firestore, user]
  );
  
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminDocRef);
  
  const isMasterAdminEmail = user?.email?.toLowerCase() === "admin@gmail.com";
  const hasAdminRecord = !!adminRole;

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    capacity: "",
    pricePerPerson: "",
    description: "",
    keyFeatures: "",
    imageUrl: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80"
  });

  const roomsQuery = useMemoFirebase(() => firestore ? collection(firestore, "rooms") : null, [firestore]);
  const toursQuery = useMemoFirebase(() => firestore ? collection(firestore, "tours") : null, [firestore]);

  const { data: rooms } = useCollection(roomsQuery);
  const { data: tours } = useCollection(toursQuery);

  const handleUpdateIslandImages = async () => {
    if (!firestore) return;
    const imageMap: Record<string, string> = {
      "Aslom": "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
      "Sibalat": "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
      "Target": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
      "Buyayao": "https://travelorientalmindoro.ph/Content/img/uploads/aaeb2388-f485-4799-8db1-c31162b102a8_thumb.jpg",
      "Suguicay": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      "Silad": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
    };

    const islandTours = tours?.filter(t => t.category === "island-hopping") || [];
    let updated = 0;

    for (const tour of islandTours) {
      const tourName: string = tour.name || tour.title || "";
      const matchedKey = Object.keys(imageMap).find(key =>
        tourName.toLowerCase().includes(key.toLowerCase())
      );
      if (matchedKey) {
        const docRef = doc(firestore, "tours", tour.id);
        setDocumentNonBlocking(docRef, { imageUrl: imageMap[matchedKey] }, { merge: true });
        updated++;
      }
    }

    toast({
      title: "Island Images Updated",
      description: `Updated images for ${updated} island hopping tour(s).`,
    });
  };

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      const roomsCol = collection(firestore, "rooms");
      const sampleRooms = [
        {
          name: "Standard Shore Cottage",
          pricePerPerson: 250,
          capacity: "10",
          imageUrl: PlaceHolderImages.find(img => img.id === "beachfront-villa")?.imageUrl || "",
          description: "Nestled just steps away from the crystal clear waters of Balatasan, our Standard Shore Cottage offers an authentic tropical experience.",
          keyFeatures: ["Beachfront", "Air Conditioning", "Queen Bed"]
        },
        {
          name: "Family Floating Cottage",
          pricePerPerson: 300,
          capacity: "15",
          imageUrl: PlaceHolderImages.find(img => img.id === "floating-cottage")?.imageUrl || "",
          description: "Our premier over-water experience. This floating cottage offers panoramic views of the bay and direct access to the sea.",
          keyFeatures: ["Over-water", "Private Deck", "Solar Powered"]
        }
      ];

      for (const room of sampleRooms) {
        addDocumentNonBlocking(roomsCol, room);
      }

      const toursCol = collection(firestore, "tours");
      const sampleTours = [
        {
          title: "Flying Fish",
          name: "Flying Fish",
          category: "water-activities",
          pricePerPerson: 500, 
          capacity: "3",
          duration: "15 Minutes",
          imageUrl: "https://images.unsplash.com/photo-1530541834187-2f74f5d4a4d6?w=600&q=80",
          description: "A high-speed adrenaline rush on the water. Max 3 people.",
          keyFeatures: ["High Speed", "Life Vest Included"]
        },
        {
          title: "Jet Ski",
          name: "Jet Ski",
          category: "water-activities",
          pricePerPerson: 150, 
          capacity: "2",
          duration: "Per Minute",
          imageUrl: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&q=80",
          description: "Experience the thrill of the open sea on our high-performance Jet Skis. Priced at 150 per minute.",
          keyFeatures: ["High Speed", "Solo or Double"]
        },
        {
          title: "Aslom Island Hopping",
          name: "Aslom Island Hopping",
          category: "island-hopping",
          pricePerPerson: 1000, 
          capacity: "10",
          duration: "Full Day",
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
          description: "Explore Aslom Islet in Bulalacao, known for its stunning white sand and turquoise waters.",
          keyFeatures: ["White Sand", "Snorkeling", "Lunch Included"]
        }
      ];

      for (const tour of sampleTours) {
        addDocumentNonBlocking(toursCol, tour);
      }

      toast({ title: "Database Seeded", description: "Demo items added with specialized rates." });
    } catch (e) {
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = () => {
    if (!firestore || !formData.name) return;
    
    const isRoom = activeTab === "rooms";
    const collectionName = isRoom ? "rooms" : "tours";
    const collectionRef = collection(firestore, collectionName);
    
    const numericRate = Number(formData.pricePerPerson) || 0;
    
    const data = {
      ...formData,
      pricePerPerson: numericRate,
      category: activeTab,
      keyFeatures: formData.keyFeatures.split(",").map(f => f.trim()).filter(f => f !== "")
    };

    if (formData.id) {
      const docRef = doc(firestore, collectionName, formData.id);
      setDocumentNonBlocking(docRef, data, { merge: true });
    } else {
      addDocumentNonBlocking(collectionRef, data);
    }

    toast({ title: "Saved", description: "Item has been saved to the catalog." });
    setFormData({ id: "", name: "", capacity: "", pricePerPerson: "", description: "", keyFeatures: "", imageUrl: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80" });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const isRoom = activeTab === "rooms";
    const collectionName = isRoom ? "rooms" : "tours";
    const docRef = doc(firestore, collectionName, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Deleted", description: "Item removed from inventory." });
  };

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isMasterAdminEmail && !hasAdminRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary/10">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md text-center border-none shadow-xl">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                <ShieldAlert className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                You do not have administrative privileges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const items = activeTab === "rooms" 
    ? rooms 
    : tours?.filter(item => {
        if (activeTab === "island-hopping") return item.category === "island-hopping";
        if (activeTab === "water-activities") return item.category === "water-activities";
        return true;
      });

  return (
    <div className="flex min-h-screen flex-col bg-secondary/10">
      <Navbar />
      <main className="flex-grow container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Inventory Management</h1>
            <p className="text-muted-foreground">Define your rates (per person or per minute) and set maximum guest capacity.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={handleUpdateIslandImages}>
              <Eye className="h-4 w-4" />
              Update Island Images
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSeedData} disabled={isSeeding}>
              <Database className="h-4 w-4" />
              Seed Demo Data
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              {formData.id ? "Update Item" : "Save New Item"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mb-8">
            <TabsTrigger value="rooms">Cottages</TabsTrigger>
            <TabsTrigger value="island-hopping">Island Hopping</TabsTrigger>
            <TabsTrigger value="water-activities">Water Activities</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                  <CardDescription>
                    Rates for Jet Ski are treated as **per minute**. All others are **per person**.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name / Title</label>
                      <Input 
                        placeholder="e.g. Standard Cottage" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rate (₱ / unit)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 150" 
                        value={formData.pricePerPerson}
                        onChange={e => setFormData({...formData, pricePerPerson: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Guests Allowed</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 10" 
                        value={formData.capacity}
                        onChange={e => setFormData({...formData, capacity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image URL</label>
                      <Input 
                        placeholder="https://..." 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Write a compelling description..." 
                      className="min-h-[150px]" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Features (comma separated)</label>
                    <Input 
                      placeholder="e.g. Ocean view, Breakfast included" 
                      value={formData.keyFeatures}
                      onChange={e => setFormData({...formData, keyFeatures: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Catalog</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-auto">
                  {items?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>
                  ) : items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 border group">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {item.name || item.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ₱{(item.pricePerPerson ?? 0).toLocaleString()} / {(item.name || item.title || "").toLowerCase().includes("jet ski") ? "min" : "pax"}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => setFormData({
                            id: item.id,
                            name: item.name || item.title || "",
                            capacity: item.capacity?.toString() || "",
                            pricePerPerson: (item.pricePerPerson ?? item.price ?? 0).toString(),
                            description: item.description || "",
                            keyFeatures: Array.isArray(item.keyFeatures) ? item.keyFeatures.join(", ") : "",
                            imageUrl: item.imageUrl || ""
                          })}
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
