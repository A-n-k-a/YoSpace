import { Metadata } from "next";
import Subscribe from "@/components/Subscribe/Subscribe";

export const metadata: Metadata = {
  title: `Subscribe - ${process.env.NEXT_PUBLIC_SITE_TITLE || "YoSpace"}`,
  description: "Subscribe to RSS and Atom feeds for the latest content updates",
};

export const revalidate = 3600;

export default function SubscribePage() {
  return <Subscribe />;
}
