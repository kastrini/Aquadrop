import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "AquaDrop — Water Delivered to Your Door",
      },
      {
        name: "description",
        content:
          "AquaDrop delivers 24–48 bottles of water to your door — no delivery fee, no service fee. Join the waiting list and stay stocked up without the heavy lifting.",
      },
      { property: "og:title", content: "AquaDrop — Water Delivered to Your Door" },
      {
        property: "og:description",
        content:
          "24–48 bottles of water delivered to your door — no delivery or service fees. Join the waiting list.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://078d26410afcd223869d5e26de8b39bd.ctonew.app",
      },
      { property: "og:site_name", content: "AquaDrop" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AquaDrop — Water Delivered to Your Door" },
      {
        name: "twitter:description",
        content: "24–48 bottles of water delivered to your door — no delivery or service fees.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
