"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";

export default function ContactPage() {
  const firestore = useFirestore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !form.name || !form.email || !form.message) return;
    setIsSubmitting(true);
    await addDocumentNonBlocking(collection(firestore, "inquiries"), {
      ...form,
      createdAt: new Date().toISOString(),
      status: "unread",
    });
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center space-y-4">
            <span className="text-primary font-bold tracking-widest text-xs uppercase">Get in Touch</span>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Contact Us</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Have questions? We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.</p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-slate-900 mb-6">Resort Information</h2>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl shrink-0"><MapPin className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-semibold text-slate-900">Address</p><p className="text-sm text-muted-foreground">Barangay Balatasan, Bulalacao<br />Oriental Mindoro, Philippines</p></div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl shrink-0"><Phone className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-semibold text-slate-900">Phone</p><p className="text-sm text-muted-foreground">0930-672-8498</p></div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl shrink-0"><Mail className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-semibold text-slate-900">Email</p><p className="text-sm text-muted-foreground">guillert2mendoza@gmail.com</p></div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl shrink-0"><MessageSquare className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-semibold text-slate-900">GCash Payment</p><p className="text-sm text-muted-foreground">0912-345-6789 (Balatasan Resort)</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="border-none shadow-2xl rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="font-headline text-2xl font-bold">Send a Message</CardTitle>
                  <CardDescription>We'll respond within 24 hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="bg-green-100 p-4 rounded-full"><CheckCircle className="h-10 w-10 text-green-600" /></div>
                      <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
                      <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input id="name" placeholder="Juan dela Cruz" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" placeholder="09XX-XXX-XXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="juan@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea id="message" placeholder="How can we help you?" className="min-h-[120px]" value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Message"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
