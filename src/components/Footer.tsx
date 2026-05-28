import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Home className="h-3.5 w-3.5" />
              </span>
              HomeLink Rwanda
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Find your next home in Rwanda. Built for the local market.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground">Browse listings</Link></li>
              <li><Link to="/search" search={{ type: "rent" } as never} className="hover:text-foreground">For rent</Link></li>
              <li><Link to="/search" search={{ type: "sale" } as never} className="hover:text-foreground">For sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">For vendors</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" search={{ mode: "signup" } as never} className="hover:text-foreground">Become a vendor</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Vendor dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} HomeLink Rwanda. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
