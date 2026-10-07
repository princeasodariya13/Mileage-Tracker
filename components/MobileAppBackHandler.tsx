"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function MobileAppBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Determines the logical parent container for any subpage
    function getParentRoute(path: string): string | null {
      // Subpages of a vehicle (add-fuel, analytics, entries edit) -> Parent is /app/vehicles/[id]
      const vehicleSubMatch = path.match(/^\/app\/vehicles\/([a-zA-Z0-9_-]+)\/(add-fuel|analytics|entries\/.*)/);
      if (vehicleSubMatch) {
        return `/app/vehicles/${vehicleSubMatch[1]}`;
      }

      // New vehicle form -> Parent is /app (Garage)
      if (path === "/app/vehicles/new") {
        return "/app";
      }

      // Vehicle dashboard -> Parent is /app (Garage)
      const vehicleMatch = path.match(/^\/app\/vehicles\/([a-zA-Z0-9_-]+)$/);
      if (vehicleMatch) {
        return "/app";
      }

      return null;
    }

    function handlePopState() {
      const activePath = currentPathRef.current;
      const targetParent = getParentRoute(activePath);
      const newPath = window.location.pathname;

      // If the user was on an inner subpage and the back event didn't already take them to the parent,
      // redirect them straight to the parent screen.
      if (targetParent && newPath !== targetParent && newPath.startsWith(targetParent)) {
        router.replace(targetParent);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return null;
}
