"use client";

import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { Waves, Anchor, Compass, Fish, Wifi, Utensils, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const amenities = [
  { icon: Waves, title: "Beach Access", desc: "Direct access to the pristine Balatasan shoreline" },
  { icon: Anchor, title: "Floating Cottages", desc: "Unique over-water cottages with stunning bay views" },
  { icon: Compass, title: "Island Hopping", desc: "Guided tours to nearby islands and sandbars" },
  { icon: Fish, title: "Water Activities", desc: "Jet ski, flying fish, snorkeling and more" },
  { icon: Wifi, title: "Free WiFi", desc: "Stay connected throughout your stay" },
  { icon: Utensils, title: "Local Cuisine", desc: "Fresh seafood and traditional Filipino dishes" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SmartNavbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-primary/5 py-20">
          <div className="container mx-auto px-4 text-center space-y-4">
            <span className="text-primary font-bold tracking-widest text-xs uppercase">About Us</span>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Balatasan Beach Resort</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Nestled along the turquoise shores of Bulalacao, Oriental Mindoro — a hidden paradise waiting to be discovered.
            </p>
          </div>
        </section>

        {/* About */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold text-slate-900">Our Story</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Balatasan Beach Resort is a community-based eco-resort located in Barangay Balatasan, Bulalacao, Oriental Mindoro. 
                  We offer an authentic tropical experience with our signature floating cottages and guided island tours.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our mission is to provide guests with an unforgettable connection to nature while supporting the local community 
                  and preserving the natural beauty of Bulalacao's pristine waters.
                </p>
                <div className="flex gap-4 pt-4">
                  <Link href="/accommodations"><Button size="sm">Book a Cottage</Button></Link>
                  <Link href="/tours"><Button size="sm" variant="outline">Explore Tours</Button></Link>
                </div>
              </div>
              <div className="bg-primary/5 rounded-3xl p-8 space-y-4">
                <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" /><div><p className="font-semibold text-slate-900">Location</p><p className="text-sm text-muted-foreground">Barangay Balatasan, Bulalacao, Oriental Mindoro, Philippines</p></div></div>
                <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" /><div><p className="font-semibold text-slate-900">Phone</p><p className="text-sm text-muted-foreground">0930-672-8498</p></div></div>
                <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" /><div><p className="font-semibold text-slate-900">Email</p><p className="text-sm text-muted-foreground">guillert2mendoza@gmail.com</p></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-3">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">What We Offer</span>
              <h2 className="font-headline text-4xl font-bold text-slate-900">Resort Amenities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {amenities.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow space-y-3">
                  <div className="bg-primary/10 p-3 rounded-xl w-fit"><Icon className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-headline font-bold text-slate-900">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10 space-y-3">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">Find Us</span>
              <h2 className="font-headline text-4xl font-bold text-slate-900">Our Location</h2>
              <p className="text-muted-foreground">Balatasan, Bulalacao, Oriental Mindoro</p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100 h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31461.123456789!2d121.32!3d12.16!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd5c0000000001%3A0x0!2sBulalacao%2C+Oriental+Mindoro!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Balatasan Beach Resort Location"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

