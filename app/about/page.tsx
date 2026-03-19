import { redirect } from "next/navigation";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  redirect("/faq#about");
}
