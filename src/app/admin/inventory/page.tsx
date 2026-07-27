"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Trash2, Eye, Database, ShieldAlert, Upload, ImageIcon, ToggleLeft, ToggleRight, MapPin, Clock, Tag, Copy, AlertTriangle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import Image from "next/image";

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState("rooms");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    imageUrl: "",
    duration: "",
    location: "",
    category: "",
    isAvailable: true,
    includedItems: "",
    tags: "",
    sortOrder: "",
  });

  const roomsQuery = useMemoFirebase(() => firestore ? collection(firestore, "rooms") : null, [firestore]);
  const toursQuery = useMemoFirebase(() => firestore ? collection(firestore, "tours") : null, [firestore]);

  const { data: rooms } = useCollection(roomsQuery);
  const { data: tours } = useCollection(toursQuery);

  // Convert image to compressed Base64 — no Storage needed
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
        setIsUploading(false);
        toast({ title: "Image ready", description: "Image compressed and ready to save." });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateIslandImages = async () => {
    if (!firestore) return;
    const imageMap: Record<string, string> = {
      "Aslom":    "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
      "Sibalat":  "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
      "Target":   "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
      "Buyayao":  "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80",
      "Suguicay": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      "Silad":    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
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
    toast({ title: "Island Images Updated", description: `Updated ${updated} tour(s).` });
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
          description: "Nestled just steps from the crystal clear waters of Balatasan, our Standard Shore Cottage offers an authentic tropical experience.",
          keyFeatures: ["Beachfront", "Air Conditioning", "Queen Bed"]
        },
        {
          name: "Family Floating Cottage",
          pricePerPerson: 300,
          capacity: "15",
          imageUrl: PlaceHolderImages.find(img => img.id === "floating-cottage")?.imageUrl || "",
          description: "Our premier over-water experience. Panoramic views of the bay and direct access to the sea.",
          keyFeatures: ["Over-water", "Private Deck", "Solar Powered"]
        }
      ];
      for (const room of sampleRooms) addDocumentNonBlocking(roomsCol, room);

      const toursCol = collection(firestore, "tours");
      const sampleTours = [
        {
          title: "Flying Fish", name: "Flying Fish", category: "water-activities",
          pricePerPerson: 500, capacity: "3", duration: "15 Minutes",
          imageUrl: "https://images.unsplash.com/photo-1530541834187-2f74f5d4a4d6?w=600&q=80",
          description: "A high-speed adrenaline rush on the water. Max 3 people.",
          keyFeatures: ["High Speed", "Life Vest Included"]
        },
        {
          title: "Jet Ski", name: "Jet Ski", category: "water-activities",
          pricePerPerson: 150, capacity: "2", duration: "Per Minute",
          imageUrl: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&q=80",
          description: "Experience the thrill of the open sea on our high-performance Jet Skis. ₱150/minute.",
          keyFeatures: ["High Speed", "Solo or Double"]
        },
        {
          title: "Aslom Island Hopping", name: "Aslom Island Hopping", category: "island-hopping",
          pricePerPerson: 1500, capacity: "10", duration: "Full Day",
          location: "Bulalacao, Oriental Mindoro",
          imageUrl: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
          description: "Explore Aslom Islet in Bulalacao, known for its stunning white sand and turquoise waters.",
          keyFeatures: ["White Sand", "Snorkeling", "Lunch Included"]
        },
        {
          title: "Silad Island Hopping", name: "Silad Island Hopping", category: "island-hopping",
          pricePerPerson: 1500, capacity: "10", duration: "Full Day",
          location: "Bulalacao, Oriental Mindoro",
          imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
          description: "The island has more of corals-filled and yellowish sands, which complements its bone-like shape. A unique island experience.",
          keyFeatures: ["Coral Reefs", "Unique Shape", "Snorkeling"]
        },
        {
          title: "Target Island Hopping", name: "Target Island Hopping", category: "island-hopping",
          pricePerPerson: 1500, capacity: "10", duration: "Full Day",
          location: "Bulalacao, Oriental Mindoro",
          imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
          description: "Discover Target Island, a hidden gem with pristine shores and crystal-clear waters perfect for swimming.",
          keyFeatures: ["Pristine Shore", "Swimming", "Picnic Area"]
        },
        {
          title: "Buyayao Island Hopping", name: "Buyayao Island Hopping", category: "island-hopping",
          pricePerPerson: 1500, capacity: "10", duration: "Full Day",
          location: "Bulalacao, Oriental Mindoro",
          imageUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80",
          description: "Buyayao Island features dramatic rock formations and lush greenery surrounding emerald waters.",
          keyFeatures: ["Rock Formations", "Emerald Waters", "Photography Spot"]
        },
        {
          title: "Suguicay Island Hopping", name: "Suguicay Island Hopping", category: "island-hopping",
          pricePerPerson: 1500, capacity: "10", duration: "Full Day",
          location: "Bulalacao, Oriental Mindoro",
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
          description: "Suguicay Island offers a serene escape with white sand bars and vibrant marine life.",
          keyFeatures: ["Sand Bar", "Marine Life", "Snorkeling"]
        }
      ];
      for (const tour of sampleTours) addDocumentNonBlocking(toursCol, tour);

      toast({ title: "Database Seeded", description: "Demo items added." });
    } catch {
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = () => {
    if (!firestore) return;
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.pricePerPerson || Number(formData.pricePerPerson) <= 0) errors.pricePerPerson = "A valid rate is required.";
    if (!formData.capacity || Number(formData.capacity) <= 0) errors.capacity = "A valid capacity is required.";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all required fields." });
      return;
    }
    setFormErrors({});
    const isRoom = activeTab === "rooms";
    const collectionName = isRoom ? "rooms" : "tours";
    const collectionRef = collection(firestore, collectionName);
    const data = {
      ...formData,
      pricePerPerson: Number(formData.pricePerPerson) || 0,
      category: formData.category || activeTab,
      keyFeatures: formData.keyFeatures.split(",").map(f => f.trim()).filter(Boolean),
      duration: formData.duration || undefined,
      location: formData.location || undefined,
      isAvailable: formData.isAvailable,
      includedItems: formData.includedItems ? formData.includedItems.split(",").map(s => s.trim()).filter(Boolean) : [],
      tags: formData.tags ? formData.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      sortOrder: formData.sortOrder ? Number(formData.sortOrder) : 0,
    };
    if (formData.id) {
      setDocumentNonBlocking(doc(firestore, collectionName, formData.id), data, { merge: true });
    } else {
      addDocumentNonBlocking(collectionRef, data);
    }
    toast({ title: "Saved", description: "Item saved to catalog." });
    setFormData({ id: "", name: "", capacity: "", pricePerPerson: "", description: "", keyFeatures: "", imageUrl: "", duration: "", location: "", category: "", isAvailable: true, includedItems: "", tags: "", sortOrder: "" });
  };

  const handleClone = (item: any) => {
    setFormData({
      id: "",
      name: `${item.name || item.title || ""} (Copy)`,
      capacity: item.capacity?.toString() || "",
      pricePerPerson: (item.pricePerPerson ?? item.price ?? 0).toString(),
      description: item.description || "",
      keyFeatures: Array.isArray(item.keyFeatures) ? item.keyFeatures.join(", ") : "",
      imageUrl: item.imageUrl || "",
      duration: item.duration || "",
      location: item.location || "",
      category: item.category || "",
      isAvailable: item.isAvailable !== false,
      includedItems: Array.isArray(item.includedItems) ? item.includedItems.join(", ") : "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      sortOrder: item.sortOrder?.toString() || "",
    });
    toast({ title: "Cloned", description: "Edit the copy and save it as a new item." });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const collectionName = activeTab === "rooms" ? "rooms" : "tours";
    deleteDocumentNonBlocking(doc(firestore, collectionName, id));
    toast({ title: "Deleted", description: "Item removed from inventory." });
    setDeleteConfirmId(null);
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
              <CardDescription>You do not have administrative privileges.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/"><Button>Return Home</Button></Link>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Item?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the item from the catalog. This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-10 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors">Keep It</button>
            <button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="flex-1 h-10 rounded-md bg-destructive text-destructive-foreground px-4 text-sm font-medium hover:bg-destructive/90 transition-colors">Yes, Delete</button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-grow container mx-auto py-10 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Inventory Management</h1>
            <p className="text-muted-foreground">Manage rooms and tours. Upload photos directly from your device.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleUpdateIslandImages}>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Update Island Images</span>
              <span className="sm:hidden">Islands</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSeedData} disabled={isSeeding}>
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Seed Demo Data</span>
              <span className="sm:hidden">Seed</span>
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              {formData.id ? "Update Item" : "Save New Item"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
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
                    Jet Ski rates are per minute. Island hopping and cottage rates are per person.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name / Title <span className="text-destructive">*</span></label>
                      <Input
                        placeholder="e.g. Standard Cottage"
                        value={formData.name}
                        onChange={e => { setFormData({...formData, name: e.target.value}); setFormErrors(p => ({...p, name: ""})); }}
                        className={formErrors.name ? "border-destructive" : ""}
                      />
                      {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rate (₱ / unit) <span className="text-destructive">*</span></label>
                      <Input
                        type="number"
                        placeholder="e.g. 1500"
                        value={formData.pricePerPerson}
                        onChange={e => { setFormData({...formData, pricePerPerson: e.target.value}); setFormErrors(p => ({...p, pricePerPerson: ""})); }}
                        className={formErrors.pricePerPerson ? "border-destructive" : ""}
                      />
                      {formErrors.pricePerPerson && <p className="text-xs text-destructive">{formErrors.pricePerPerson}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Guests Allowed <span className="text-destructive">*</span></label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={formData.capacity}
                      onChange={e => { setFormData({...formData, capacity: e.target.value}); setFormErrors(p => ({...p, capacity: ""})); }}
                      className={`max-w-xs ${formErrors.capacity ? "border-destructive" : ""}`}
                    />
                    {formErrors.capacity && <p className="text-xs text-destructive">{formErrors.capacity}</p>}
                  </div>

                  {/* Duration & Location row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Duration
                      </label>
                      <Input
                        placeholder="e.g. Full Day, 15 Minutes"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Location
                      </label>
                      <Input
                        placeholder="e.g. Bulalacao, Oriental Mindoro"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Category & Availability row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        Category
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={formData.category || activeTab}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="rooms">Cottage</option>
                        <option value="island-hopping">Island Hopping</option>
                        <option value="water-activities">Water Activities</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        {formData.isAvailable ? <ToggleRight className="h-3.5 w-3.5 text-green-500" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                        Availability
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                        className={`flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                          formData.isAvailable
                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            : "border-input bg-background text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${formData.isAvailable ? "bg-green-500" : "bg-slate-300"}`} />
                        {formData.isAvailable ? "Available for booking" : "Not available"}
                      </button>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Image</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Paste image URL or upload a photo"
                        value={formData.imageUrl.startsWith("data:") ? "(uploaded photo)" : formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        className="flex-1"
                        readOnly={formData.imageUrl.startsWith("data:")}
                      />
                      <div className="shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          id="image-upload"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-accent transition-colors w-full sm:w-auto ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {isUploading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                            : <><Upload className="h-4 w-4" /> Upload Photo</>
                          }
                        </label>
                      </div>
                    </div>
                    {/* Preview */}
                    {formData.imageUrl && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border bg-slate-50">
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                          onError={() => {}}
                        />
                      </div>
                    )}
                    {!formData.imageUrl && (
                      <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 gap-2">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Write a compelling description..."
                      className="min-h-[120px]"
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

                  {/* ── Extras & Display ── */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Tag className="h-4 w-4 text-primary" />
                      Extras &amp; Display
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">What&apos;s Included (comma separated)</label>
                      <Input
                        placeholder="e.g. Life vest, Snorkeling gear, Lunch"
                        value={formData.includedItems}
                        onChange={e => setFormData({...formData, includedItems: e.target.value})}
                      />
                      <p className="text-[11px] text-muted-foreground">Shown as a checklist on the listing page.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tags (comma separated)</label>
                      <Input
                        placeholder="e.g. Best Seller, Family Friendly, New"
                        value={formData.tags}
                        onChange={e => setFormData({...formData, tags: e.target.value})}
                      />
                      <p className="text-[11px] text-muted-foreground">Tags appear as badges on cards and listing pages.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Order</label>
                      <Input
                        type="number"
                        placeholder="e.g. 1 (lower = shown first)"
                        value={formData.sortOrder}
                        onChange={e => setFormData({...formData, sortOrder: e.target.value})}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Catalog</CardTitle>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      className="w-full pl-8 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-auto">
                  {!items?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>
                  ) : items
                      .filter(item => {
                        if (!catalogSearch) return true;
                        const q = catalogSearch.toLowerCase();
                        return (item.name || item.title || "").toLowerCase().includes(q);
                      })
                      .map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 border group">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.imageUrl && (
                          <div className="relative h-10 w-10 rounded-md overflow-hidden shrink-0 border">
                            <Image src={item.imageUrl} alt={item.name || ""} fill className="object-cover" onError={() => {}} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[120px]">{item.name || item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            ₱{(item.pricePerPerson ?? 0).toLocaleString()} / {(item.name || item.title || "").toLowerCase().includes("jet ski") ? "min" : "pax"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.isAvailable === false && (
                              <span className="text-[10px] text-red-500 font-medium">Unavailable</span>
                            )}
                            {Array.isArray(item.tags) && item.tags.slice(0,2).map((t: string) => (
                              <span key={t} className="text-[10px] bg-primary/10 text-primary font-medium px-1 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Edit */}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          title="Edit"
                          onClick={() => setFormData({
                            id: item.id,
                            name: item.name || item.title || "",
                            capacity: item.capacity?.toString() || "",
                            pricePerPerson: (item.pricePerPerson ?? item.price ?? 0).toString(),
                            description: item.description || "",
                            keyFeatures: Array.isArray(item.keyFeatures) ? item.keyFeatures.join(", ") : "",
                            imageUrl: item.imageUrl || "",
                            duration: item.duration || "",
                            location: item.location || "",
                            category: item.category || "",
                            isAvailable: item.isAvailable !== false,
                            includedItems: Array.isArray(item.includedItems) ? item.includedItems.join(", ") : "",
                            tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
                            sortOrder: item.sortOrder?.toString() || "",
                          })}
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        {/* Clone */}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          title="Clone"
                          onClick={() => handleClone(item)}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {/* Delete with confirm */}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          title="Delete"
                          onClick={() => setDeleteConfirmId(item.id)}
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
