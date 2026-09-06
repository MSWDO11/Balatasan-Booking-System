"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Instagram, Heart } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="rounded-full overflow-hidden h-8 w-8 shrink-0 border border-primary/30">
                <Image src="/logo.png" alt="Balatasan Logo" width={32} height={32} className="object-cover w-full h-full" />
              </div>
              <span className="font-headline text-lg font-bold text-white">Balatasan <span className="text-primary">Stay</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Experience the natural beauty of Bulalacao, Oriental Mindoro. Our community-based eco-resort offers a serene escape.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-primary/20 p-2 rounded-lg transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-primary/20 p-2 rounded-lg transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-headline font-bold text-white text-sm uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "Accommodations", href: "/accommodations" },
                { label: "Island Hopping", href: "/tours?category=island-hopping" },
                { label: "Water Activities", href: "/tours?category=water-activities" },
                { label: "About Balatasan", href: "/about" },
                { label: "Contact Us", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Island Tours */}
          <div className="space-y-4">
            <h3 className="font-headline font-bold text-white text-sm uppercase tracking-widest">Island Tours</h3>
            <ul className="space-y-2.5 text-sm">
              {["Aslom Island", "Target Island", "Buyayao Island", "Suguicay Island", "Silad Island"].map(name => (
                <li key={name}><Link href="/tours?category=island-hopping" className="hover:text-primary transition-colors">{name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-headline font-bold text-white text-sm uppercase tracking-widest">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Balatasan, Bulalacao, Oriental Mindoro, Philippines</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href="tel:09306728498" className="hover:text-primary transition-colors">0930-672-8498</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href="mailto:guillert2mendoza@gmail.com" className="hover:text-primary transition-colors text-xs">guillert2mendoza@gmail.com</a>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30 text-white placeholder:text-slate-500"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 py-5">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Balatasan Beach Resort. All rights reserved.</p>
          <p className="flex items-center gap-1">Made with <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> in Bulalacao, Oriental Mindoro</p>
        </div>
      </div>
    </footer>
  );
}
