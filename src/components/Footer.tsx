import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { SUPPORT_WHATSAPP, CONTACT_EMAIL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Home className="h-3.5 w-3.5" />
              </span>
              HomeLink Rwanda
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Rwanda's first trusted platform for finding rental houses and properties for sale. Built in Kigali, for Kigali — and all 30 districts.
            </p>
            <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              📱 WhatsApp support
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Browse</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground">All listings</Link></li>
              <li><Link to="/search" search={{ type: "rent" } as never} className="hover:text-foreground">For rent</Link></li>
              <li><Link to="/search" search={{ type: "sale" } as never} className="hover:text-foreground">For sale</Link></li>
              <li><Link to="/search" search={{ district: "Gasabo" } as never} className="hover:text-foreground">Gasabo</Link></li>
              <li><Link to="/search" search={{ district: "Kicukiro" } as never} className="hover:text-foreground">Kicukiro</Link></li>
              <li><Link to="/search" search={{ district: "Nyarugenge" } as never} className="hover:text-foreground">Nyarugenge</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">For vendors</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" search={{ mode: "signup" } as never} className="hover:text-foreground">Become a vendor</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Vendor dashboard</Link></li>
              <li><Link to="/post-listing" className="hover:text-foreground">Post a listing</Link></li>
              <li><Link to="/about" className="hover:text-foreground">How it works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About us</Link></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">Contact support</a></li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">🇷🇼 Built in Rwanda, for Rwanda</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HomeLink Rwanda. All rights reserved.</p>
          <p>Kigali, Rwanda</p>
        </div>
      </div>
    </footer>
  );
}
