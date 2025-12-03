import { redirect } from "next/navigation";

// Redirect /products to the main discovery page
export default function ProductsPage() {
  redirect("/");
}
